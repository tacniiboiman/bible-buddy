import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, BookOpen, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import type { BibleVerse } from "@/lib/verse-store";
import { VerseDialog } from "./VerseDialog";

interface VerseCardProps {
  verse: BibleVerse;
  onDelete: (id: string) => void;
  onEdit: (id: string, reference: string, text: string, tags: string[]) => void;
  onTagClick: (tag: string) => void;
  existingTags: string[];
}

export function VerseCard({ 
  verse, 
  onDelete, 
  onEdit,
  onTagClick,
  existingTags
}: VerseCardProps) {
  const [showActions, setShowActions] = useState(false);
  
  const date = new Date(verse.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card 
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
      onClick={() => setShowActions(!showActions)}
    >
      <div className="absolute left-0 top-0 h-full w-1 bg-primary/60" />
      <CardContent className="p-5 pl-6">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-serif text-lg font-semibold text-foreground">{verse.reference}</h3>
          </div>
          <div className="flex items-center gap-1">
             {showActions ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        <p className="mb-3 font-serif text-base leading-relaxed italic text-foreground/85">
          "{verse.text}"
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {verse.tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag);
                }}
                className="rounded-full bg-tag px-2.5 py-0.5 text-xs font-medium text-tag-foreground transition-colors hover:opacity-80"
              >
                {tag}
              </button>
            ))}
          </div>
          <time className="text-xs text-muted-foreground">{formattedDate}</time>
        </div>

        {showActions && (
          <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <VerseDialog
              onSave={(ref, txt, tags) => onEdit(verse.id, ref, txt, tags)}
              existingTags={existingTags}
              initialVerse={verse}
              trigger={
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              }
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(verse.id);
              }}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              aria-label="Delete verse"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

