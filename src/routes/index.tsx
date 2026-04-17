import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { BookOpen, Search, X, Tag, Cloud, HardDrive, RefreshCw, SortAsc, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VerseDialog } from "@/components/VerseDialog";
import { VerseCard } from "@/components/VerseCard";
import { AuthDialog } from "@/components/AuthDialog";
import { 
  getLocalVerses, 
  syncCloudToLocal, 
  saveVerse, 
  deleteVerse, 
  updateVerse,
  getAllTags, 
  type BibleVerse 
} from "@/lib/verse-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Bible Memory — Save & Memorize Scripture" },
      {
        name: "description",
        content: "A simple app to save, tag, and memorize your favorite Bible verses.",
      },
    ],
  }),
});

const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther",
  "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
  "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
  "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

function getBookIndex(reference: string): number {
  const normalizedRef = reference.trim();
  for (let i = 0; i < BIBLE_BOOKS.length; i++) {
    if (normalizedRef.toLowerCase().startsWith(BIBLE_BOOKS[i].toLowerCase())) {
      return i;
    }
  }
  return 999;
}

function Index() {
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "bible">("newest");
  const [groupByBook, setGroupByBook] = useState(false);

  const loadUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      setUser({ id: authUser.id, email: authUser.email ?? undefined });
    } else {
      setUser(null);
    }
  }, []);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    const synced = await syncCloudToLocal();
    setVerses(synced);
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    loadUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? undefined });
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadUser]);

  useEffect(() => {
    setVerses(getLocalVerses());
    handleSync();
  }, [handleSync, user]);

  const allTags = useMemo(() => getAllTags(verses), [verses]);

  const sortedAndFiltered = useMemo(() => {
    let result = [...verses];
    
    // Filter
    if (activeTag) {
      result = result.filter((v) => v.tags.includes(activeTag));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.reference.toLowerCase().includes(q) ||
          v.text.toLowerCase().includes(q) ||
          v.tags.some((t) => t.includes(q)),
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "bible") {
        const bookA = getBookIndex(a.reference);
        const bookB = getBookIndex(b.reference);
        if (bookA !== bookB) return bookA - bookB;
        // Secondary sort by reference text (chapter/verse)
        return a.reference.localeCompare(b.reference, undefined, { numeric: true });
      }
      return 0;
    });

    return result;
  }, [verses, search, activeTag, sortBy]);

  const groupedVerses = useMemo(() => {
    if (!groupByBook) return null;
    const groups: Record<string, BibleVerse[]> = {};
    sortedAndFiltered.forEach(v => {
      const bookIndex = getBookIndex(v.reference);
      const bookName = bookIndex === 999 ? "Other" : BIBLE_BOOKS[bookIndex];
      if (!groups[bookName]) groups[bookName] = [];
      groups[bookName].push(v);
    });
    return groups;
  }, [sortedAndFiltered, groupByBook]);

  async function handleAdd(reference: string, text: string, tags: string[]) {
    try {
      const verse = await saveVerse(reference, text, tags);
      setVerses((prev) => [verse, ...prev]);
    } catch (err) {
      console.error("Failed to add verse:", err);
    }
  }

  async function handleEdit(id: string, reference: string, text: string, tags: string[]) {
    try {
      const updated = await updateVerse(id, reference, text, tags);
      setVerses((prev) => prev.map(v => v.id === id ? updated : v));
    } catch (err) {
      console.error("Failed to edit verse:", err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteVerse(id);
      setVerses((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error("Failed to delete verse:", err);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <header className="mb-8 text-center relative">
        <div className="mb-3 inline-flex items-center justify-center rounded-full bg-accent p-3">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Bible Memory
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save, tag, and memorize your favorite scripture
        </p>
        
        {isSyncing && (
          <div className="absolute top-0 right-0 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Syncing...
          </div>
        )}
      </header>

      {/* Auth + Status */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <AuthDialog user={user} onAuthChange={loadUser} />
        <div className="flex items-center gap-2">
           {user ? (
             <span className="flex items-center gap-1 text-xs text-muted-foreground bg-accent/50 px-2 py-1 rounded-full">
               <Cloud className="h-3 w-3" />
               Cloud Synced
             </span>
           ) : (
             <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
               <HardDrive className="h-3 w-3" />
               Local Storage
             </span>
           )}
           <Button 
             variant="ghost" 
             size="icon" 
             className="h-8 w-8 text-muted-foreground hover:text-primary"
             onClick={handleSync}
             disabled={isSyncing}
           >
             <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
           </Button>
        </div>
      </div>

      {/* Search + Add */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search verses or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <VerseDialog onSave={handleAdd} existingTags={allTags} />
      </div>

      {/* Organization Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-muted-foreground" />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="bible">Bible Order</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
           <button
             onClick={() => setGroupByBook(!groupByBook)}
             className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
               groupByBook ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
             }`}
           >
             {groupByBook ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
             {groupByBook ? "Grouped by Book" : "List View"}
           </button>
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
            >
              {activeTag}
              <X className="h-3 w-3" />
            </button>
          )}
          {allTags
            .filter((t) => t !== activeTag)
            .map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className="rounded-full bg-tag px-3 py-1 text-xs font-medium text-tag-foreground transition-colors hover:opacity-80"
              >
                {tag}
              </button>
            ))}
        </div>
      )}

      {/* Verse list */}
      <div className="space-y-4">
        {verses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No verses yet. Add your first verse to get started!
            </p>
          </div>
        ) : sortedAndFiltered.length === 0 ? (
           <div className="py-16 text-center text-sm text-muted-foreground">
             No verses match your search.
           </div>
        ) : groupByBook && groupedVerses ? (
          Object.entries(groupedVerses).map(([book, verses]) => (
            <div key={book} className="space-y-3">
              <h2 className="font-serif text-sm font-bold uppercase tracking-widest text-primary/70 pl-1">
                {book}
              </h2>
              {verses.map((verse) => (
                <VerseCard
                  key={verse.id}
                  verse={verse}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onTagClick={setActiveTag}
                  existingTags={allTags}
                />
              ))}
            </div>
          ))
        ) : (
          sortedAndFiltered.map((verse) => (
            <VerseCard
              key={verse.id}
              verse={verse}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onTagClick={setActiveTag}
              existingTags={allTags}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {verses.length > 0 && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          {verses.length} verse{verses.length !== 1 ? "s" : ""} available {user ? "across all devices" : "locally"}
        </p>
      )}
    </div>
  );
}


