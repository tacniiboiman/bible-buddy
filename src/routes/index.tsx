import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { BookOpen, Search, X, Tag, Cloud, HardDrive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddVerseDialog } from "@/components/AddVerseDialog";
import { VerseCard } from "@/components/VerseCard";
import { AuthDialog } from "@/components/AuthDialog";
import { getVerses, saveVerse, deleteVerse, getAllTags, type BibleVerse } from "@/lib/verse-store";
import { fetchCloudVerses, saveCloudVerse, deleteCloudVerse } from "@/lib/verse-cloud";
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

function Index() {
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [storageMode, setStorageMode] = useState<"local" | "cloud">("local");
  const [loading, setLoading] = useState(false);

  const loadUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      setUser({ id: authUser.id, email: authUser.email ?? undefined });
    } else {
      setUser(null);
      setStorageMode("local");
    }
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
        setStorageMode("local");
      }
    });
    return () => subscription.unsubscribe();
  }, [loadUser]);

  const loadVerses = useCallback(async () => {
    if (storageMode === "cloud" && user) {
      setLoading(true);
      try {
        const cloudVerses = await fetchCloudVerses();
        setVerses(cloudVerses);
      } catch (err) {
        console.error("Failed to load cloud verses:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setVerses(getVerses());
    }
  }, [storageMode, user]);

  useEffect(() => {
    loadVerses();
  }, [loadVerses]);

  const allTags = useMemo(() => getAllTags(verses), [verses]);

  const filtered = useMemo(() => {
    let result = verses;
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
    return result;
  }, [verses, search, activeTag]);

  async function handleAdd(reference: string, text: string, tags: string[]) {
    if (storageMode === "cloud" && user) {
      try {
        const verse = await saveCloudVerse(reference, text, tags, user.id);
        setVerses((prev) => [verse, ...prev]);
      } catch (err) {
        console.error("Failed to save to cloud:", err);
      }
    } else {
      const verse = saveVerse(reference, text, tags);
      setVerses((prev) => [verse, ...prev]);
    }
  }

  async function handleDelete(id: string) {
    if (storageMode === "cloud" && user) {
      try {
        await deleteCloudVerse(id);
        setVerses((prev) => prev.filter((v) => v.id !== id));
      } catch (err) {
        console.error("Failed to delete from cloud:", err);
      }
    } else {
      deleteVerse(id);
      setVerses((prev) => prev.filter((v) => v.id !== id));
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center justify-center rounded-full bg-accent p-3">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Bible Memory
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save, tag, and memorize your favorite scripture
        </p>
      </header>

      {/* Auth + Storage toggle */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <AuthDialog user={user} onAuthChange={loadUser} />
        {user && (
          <div className="flex items-center gap-1 rounded-full border border-border p-1">
            <button
              onClick={() => setStorageMode("local")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                storageMode === "local"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              Local
            </button>
            <button
              onClick={() => setStorageMode("cloud")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                storageMode === "cloud"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Cloud className="h-3.5 w-3.5" />
              Cloud
            </button>
          </div>
        )}
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
        <AddVerseDialog onAdd={handleAdd} existingTags={allTags} />
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
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Loading verses from cloud...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {verses.length === 0
                ? storageMode === "cloud"
                  ? "No cloud verses yet. Add your first verse to sync across devices!"
                  : "No verses yet. Add your first verse to get started!"
                : "No verses match your search."}
            </p>
          </div>
        ) : (
          filtered.map((verse) => (
            <VerseCard
              key={verse.id}
              verse={verse}
              onDelete={handleDelete}
              onTagClick={setActiveTag}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {verses.length > 0 && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          {verses.length} verse{verses.length !== 1 ? "s" : ""} saved
          {storageMode === "cloud" ? " in cloud" : " locally"}
        </p>
      )}
    </div>
  );
}
