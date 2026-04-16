import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, BookOpen } from "lucide-react";
import type { BibleVerse } from "@/lib/verse-store";

interface VerseCardProps {
  verse: BibleVerse;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export function VerseCard({ verse, onDelete, onTagClick }: VerseCardProps) {
  const date = new Date(verse.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div className="absolute left-0 top-0 h-full w-1 bg-primary/60" />
      <CardContent className="p-5 pl-6">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-serif text-lg font-semibold text-foreground">{verse.reference}</h3>
          </div>
          <button
            onClick={() => onDelete(verse.id)}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            aria-label="Delete verse"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 font-serif text-base leading-relaxed italic text-foreground/85">
          "{verse.text}"
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {verse.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className="rounded-full bg-tag px-2.5 py-0.5 text-xs font-medium text-tag-foreground transition-colors hover:opacity-80"
              >
                {tag}
              </button>
            ))}
          </div>
          <time className="text-xs text-muted-foreground">{formattedDate}</time>
        </div>
      </CardContent>
    </Card>
  );
}
