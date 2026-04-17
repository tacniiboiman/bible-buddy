import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { BookOpen, Search, X, Tag, Cloud, HardDrive, RefreshCw, SortAsc, LayoutGrid, List, Sparkles, Brain, CheckCircle2 } from "lucide-react";
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
  toggleMemorized,
  getAllTags, 
  type BibleVerse 
} from "@/lib/verse-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
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
  const [showSynced, setShowSynced] = useState(false);
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
    setShowSynced(true);
    setTimeout(() => setShowSynced(false), 3000);
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

  // Verse of the Day Logic: Consistent random verse based on the date
  const verseOfTheDay = useMemo(() => {
    if (verses.length === 0) return null;
    const dateStr = new Date().toISOString().split('T')[0];
    const hash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return verses[hash % verses.length];
  }, [verses]);

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

  async function handleToggleMemorized(id: string) {
    try {
      const updated = await toggleMemorized(id);
      setVerses((prev) => prev.map(v => v.id === id ? updated : v));
    } catch (err) {
      console.error("Failed to toggle memorized:", err);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
      {/* Dynamic Header */}
      <header className="mb-10 text-center relative border border-border/20 rounded-3xl p-8 bg-card/40 backdrop-blur-xl shadow-xl shadow-primary/5 isolate overflow-hidden">
        <div className="absolute -top-24 -left-24 h-48 w-48 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 bg-accent/20 rounded-full blur-3xl -z-10" />
        
        <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3 shadow-inner">
          <BookOpen className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-serif text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          Bible Memory
        </h1>
        <p className="mt-3 text-sm font-medium text-muted-foreground max-w-xs mx-auto leading-relaxed">
          The elegant way to save, tag, and hidden-word memorize your favorite scriptures.
        </p>
        
        {isSyncing && (
          <div className="absolute top-4 right-6 flex items-center gap-1.5 text-[10px] font-bold text-primary/60 uppercase tracking-widest animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Syncing
          </div>
        )}
      </header>

      {/* Verse of the Day Hero */}
      {verseOfTheDay && !search && !activeTag && (
        <div className="mb-10 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          <div className="relative rounded-2xl bg-card border border-primary/10 p-6 shadow-sm overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <Sparkles className="h-5 w-5 text-primary/30" />
             </div>
             <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                <Sparkles className="h-3 w-3" />
                Verse of the Day
             </div>
             <p className="font-serif text-xl italic font-medium text-foreground/90 leading-relaxed mb-4">
               "{verseOfTheDay.text}"
             </p>
             <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-primary">{verseOfTheDay.reference}</span>
                <div className="flex gap-2">
                   <button 
                     onClick={() => handleToggleMemorized(verseOfTheDay.id)}
                     className={`rounded-full p-2 transition-all ${verseOfTheDay.isMemorized ? 'bg-green-100 text-green-600' : 'bg-accent/50 text-muted-foreground hover:bg-accent'}`}
                   >
                     {verseOfTheDay.isMemorized ? <CheckCircle2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Auth + Status */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 bg-secondary/20 p-2 rounded-2xl border border-border/30">
        <AuthDialog user={user} onAuthChange={loadUser} />
        <div className="flex items-center gap-2 pr-2">
           <div className="flex items-center gap-2">
              {user ? (
                showSynced && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 animate-in fade-in zoom-in duration-300">
                    <Cloud className="h-3 w-3" />
                    Synced
                  </span>
                )
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                  <HardDrive className="h-3 w-3" />
                  Local
                </span>
              )}
           </div>
           <button 
             className="h-9 w-9 flex items-center justify-center rounded-xl bg-background text-muted-foreground hover:text-primary hover:bg-card transition-all shadow-sm border border-border/50"
             onClick={handleSync}
             disabled={isSyncing}
             title="Force Sync"
           >
             <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {/* Search + Add */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search scripture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-card/50 border-border/50 focus-visible:ring-primary/20 transition-all font-medium"
          />
        </div>
        <VerseDialog onSave={handleAdd} existingTags={allTags} />
      </div>

      {/* Organization Controls */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 bg-background/50 backdrop-blur-md p-2 rounded-xl border-b border-border/30 sticky top-2 z-20">
        <div className="flex items-center gap-2 px-2">
          <SortAsc className="h-4 w-4 text-muted-foreground" />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-[11px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="bible">Bible Order</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
           <button
             onClick={() => setGroupByBook(!groupByBook)}
             className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-all ${
               groupByBook ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-accent/50"
             }`}
           >
             {groupByBook ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
             {groupByBook ? "Books" : "List"}
           </button>
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[10px] font-bold text-primary-foreground shadow-sm animate-in zoom-in-95 duration-200"
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
                className="rounded-full bg-tag/30 backdrop-blur-sm px-4 py-1.5 text-[10px] font-bold text-tag-foreground hover:bg-tag/50 transition-all border border-border/10"
              >
                {tag}
              </button>
            ))}
        </div>
      )}

      {/* Verse list */}
      <div className="space-y-6">
        {verses.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border/50 py-24 text-center bg-card/20 backdrop-blur-sm">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="font-serif text-lg font-bold text-foreground opacity-60">Your collection is empty</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add a verse to start your memorization journey.
            </p>
          </div>
        ) : sortedAndFiltered.length === 0 ? (
           <div className="py-24 text-center">
             <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
             <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
               No matches found
             </p>
           </div>
        ) : groupByBook && groupedVerses ? (
          Object.entries(groupedVerses).map(([book, verses]) => (
            <div key={book} className="space-y-4">
              <h2 className="font-serif text-xs font-black uppercase tracking-[0.3em] text-primary/60 pl-2">
                {book}
              </h2>
              {verses.map((verse) => (
                <VerseCard
                  key={verse.id}
                  verse={verse}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onToggleMemorized={handleToggleMemorized}
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
              onToggleMemorized={handleToggleMemorized}
              onTagClick={setActiveTag}
              existingTags={allTags}
            />
          ))
        )}
      </div>

      {/* Footer statistics */}
      {verses.length > 0 && (
        <div className="mt-12 py-8 border-t border-border/20 text-center">
          <div className="inline-flex gap-8">
             <div className="text-center">
                <div className="text-lg font-black text-foreground">{verses.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Verses</div>
             </div>
             <div className="text-center">
                <div className="text-lg font-black text-green-600">{verses.filter(v => v.isMemorized).length}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Memorized</div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
