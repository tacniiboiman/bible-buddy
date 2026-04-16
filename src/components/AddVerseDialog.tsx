import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import type { BibleVerse } from "@/lib/verse-store";

interface AddVerseDialogProps {
  onAdd: (reference: string, text: string, tags: string[]) => void;
  existingTags: string[];
}

export function AddVerseDialog({ onAdd, existingTags }: AddVerseDialogProps) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [text, setText] = useState("");
  const [tagInput, setTagInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim() || !text.trim()) return;
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onAdd(reference, text, tags);
    setReference("");
    setText("");
    setTagInput("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 shadow-md">
          <Plus className="h-5 w-5" />
          Add Verse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Add a Bible Verse</DialogTitle>
          <DialogDescription>Enter the verse reference, text, and optional tags.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Reference
            </label>
            <Input
              placeholder="e.g. John 3:16"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Verse Text
            </label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
              placeholder="For God so loved the world..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Tags (comma-separated)
            </label>
            <Input
              placeholder="e.g. love, salvation, faith"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
            {existingTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {existingTags.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const current = tagInput
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean);
                      if (!current.includes(tag)) {
                        setTagInput(current.length ? `${tagInput}, ${tag}` : tag);
                      }
                    }}
                    className="rounded-full bg-tag px-2.5 py-0.5 text-xs font-medium text-tag-foreground transition-colors hover:opacity-80"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" className="w-full">
            Save Verse
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
