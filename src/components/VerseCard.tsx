import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, BookOpen, Pencil, ChevronDown, ChevronUp, Brain, CheckCircle, CheckCircle2, RotateCcw } from "lucide-react";
import type { BibleVerse } from "@/lib/verse-store";
import { VerseDialog } from "./VerseDialog";
import { Button } from "./ui/button";

interface VerseCardProps {
  verse: BibleVerse;
  onDelete: (id: string) => void;
  onEdit: (id: string, reference: string, text: string, tags: string[]) => void;
  onToggleMemorized: (id: string) => void;
  onTagClick: (tag: string) => void;
  existingTags: string[];
}

export function VerseCard({ 
  verse, 
  onDelete, 
  onEdit,
  onToggleMemorized,
  onTagClick,
  existingTags
}: VerseCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [revealedWords, setRevealedWords] = useState<Set<number>>(new Set());
  
  const date = new Date(verse.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Learning Mode Logic: Hide ~40% of words
  const words = useMemo(() => verse.text.split(" "), [verse.text]);
  const hiddenIndices = useMemo(() => {
    const indices: number[] = [];
    // Deterministic random-ish hiding based on verse ID and word position
    words.forEach((_, i) => {
      const hash = verse.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + i;
      if (hash % 3 === 0 && words[i].length > 3) {
        indices.push(i);
      }
    });
    return indices;
  }, [words, verse.id]);

  const toggleReveal = (index: number) => {
    const newSet = new Set(revealedWords);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setRevealedWords(newSet);
  };

  const resetLearning = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedWords(new Set());
  };

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer border-border/50 backdrop-blur-md ${
        verse.isMemorized ? "bg-secondary/30 opacity-80" : "bg-card/80"
      }`}
      onClick={() => setShowActions(!showActions)}
    >
      <div className={`absolute left-0 top-0 h-full w-1 transition-colors duration-300 ${
        verse.isMemorized ? "bg-green-500" : "bg-primary/60"
      }`} />
      
      <CardContent className="p-5 pl-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className={`h-4 w-4 ${verse.isMemorized ? "text-green-500" : "text-primary"}`} />
            <h3 className="font-serif text-lg font-bold tracking-tight text-foreground">
              {verse.reference}
              {verse.isMemorized && (
                <CheckCircle2 className="ml-2 inline h-4 w-4 text-green-500" />
              )}
            </h3>
          </div>
          <div className="flex items-center gap-2">
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setIsLearning(!isLearning);
               }}
               className={`rounded-full p-1.5 transition-colors ${
                 isLearning ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
               }`}
               title={isLearning ? "Exit Learning Mode" : "Start Learning Mode"}
             >
               <Brain className="h-4 w-4" />
             </button>
             {showActions ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        <div className="mb-4">
          <p className={`font-serif text-lg leading-relaxed text-foreground/90 ${isLearning ? 'select-none' : 'italic'}`}>
            {!isLearning ? (
              <span className="opacity-90">"{verse.text}"</span>
            ) : (
              words.map((word, i) => {
                const isHidden = hiddenIndices.includes(i) && !revealedWords.has(i);
                return (
                  <span 
                    key={i} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hiddenIndices.includes(i)) toggleReveal(i);
                    }}
                    className={`inline-block mr-1.5 transition-all duration-200 ${
                      isHidden 
                        ? "bg-muted text-transparent rounded px-2 cursor-help border-b-2 border-primary/20" 
                        : revealedWords.has(i) ? "text-primary font-medium" : ""
                    }`}
                  >
                    {word}
                  </span>
                );
              })
            )}
          </p>
          {isLearning && (
            <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <span>Tap hidden words to reveal</span>
              <button 
                onClick={resetLearning}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {verse.tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag);
                }}
                className="rounded-full bg-tag/50 backdrop-blur-sm px-2.5 py-0.5 text-xs font-semibold text-tag-foreground transition-colors hover:bg-tag"
              >
                {tag}
              </button>
            ))}
          </div>
          <time className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-tighter">
            {formattedDate}
          </time>
        </div>

        {showActions && (
          <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMemorized(verse.id);
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                verse.isMemorized 
                  ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400" 
                  : "bg-accent text-accent-foreground hover:bg-accent/80"
              }`}
            >
              <CheckCircle className={`h-4 w-4 ${verse.isMemorized ? "fill-green-500/20" : ""}`} />
              {verse.isMemorized ? "Memorized" : "Mark as Memorized"}
            </button>

            <div className="flex items-center gap-1">
              <VerseDialog
                onSave={(ref, txt, tags) => onEdit(verse.id, ref, txt, tags)}
                existingTags={existingTags}
                initialVerse={verse}
                trigger={
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    title="Edit Verse"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                }
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(verse.id);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
                aria-label="Delete verse"
                title="Delete Verse"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


