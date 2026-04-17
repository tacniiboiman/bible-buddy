import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, Plus, Clock, Trash2, Edit2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScheduleDialog } from "@/components/ScheduleDialog";
import { 
  getLocalSchedules, 
  syncCloudToLocalSchedules, 
  saveSchedule, 
  updateSchedule, 
  deleteSchedule,
  type ScheduleItem 
} from "@/lib/schedule-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/schedule")({
  component: SchedulePage,
  head: () => ({
    meta: [
      { title: "Weekly Schedule — Bible Memory" },
      { name: "description", content: "Plan your Bible reading and meditation activities for the week." },
    ],
  }),
});

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    const synced = await syncCloudToLocalSchedules();
    setItems(synced);
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ? { id: user.id } : null);
      setItems(getLocalSchedules());
      handleSync();
    };
    load();
  }, [handleSync]);

  async function handleSave(day: number, activity: string, time?: string) {
    try {
      const newItem = await saveSchedule(day, activity, time);
      setItems(prev => [...prev, newItem]);
    } catch (err) {
      console.error("Failed to save schedule:", err);
    }
  }

  async function handleUpdate(id: string, day: number, activity: string, time?: string) {
    try {
      const updated = await updateSchedule(id, day, activity, time);
      setItems(prev => prev.map(item => item.id === id ? updated : item));
    } catch (err) {
      console.error("Failed to update schedule:", err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSchedule(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    }
  }

  const itemsByDay = useMemo(() => {
    const groups: Record<number, ScheduleItem[]> = {};
    items.forEach(item => {
      if (!groups[item.day]) groups[item.day] = [];
      groups[item.day].push(item);
    });
    return groups;
  }, [items]);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-8 relative">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Weekly Schedule
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Plan your week with the Word.
        </p>
        
        {isSyncing && (
          <div className="absolute top-0 right-0 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground animate-pulse">
            <Calendar className="h-3 w-3" />
            Syncing...
          </div>
        )}
      </header>

      <div className="space-y-6">
        {DAYS.map((dayName, dayIndex) => (
          <section key={dayName} className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1">
              <h2 className="font-serif text-lg font-bold text-primary/80">
                {dayName}
              </h2>
              <ScheduleDialog 
                onSave={(day, act, time) => handleSave(day, act, time)} 
                defaultDay={dayIndex}
              />
            </div>
            
            <div className="space-y-2">
              {!itemsByDay[dayIndex] || itemsByDay[dayIndex].length === 0 ? (
                <p className="py-2 text-xs italic text-muted-foreground/60">
                  No activities planned.
                </p>
              ) : (
                itemsByDay[dayIndex].map((item) => (
                  <ScheduleItemRow 
                    key={item.id} 
                    item={item} 
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="h-20" /> {/* Spacer for bottom nav */}
    </div>
  );
}

function ScheduleItemRow({ 
  item, 
  onUpdate, 
  onDelete 
}: { 
  item: ScheduleItem; 
  onUpdate: (id: string, d: number, a: string, t?: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card 
      className={`group overflow-hidden transition-all duration-200 cursor-pointer ${isExpanded ? "ring-1 ring-primary/20 shadow-md" : "hover:bg-accent/30"}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">
              {item.activity}
            </p>
            {item.time && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {item.time}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
             {isExpanded ? <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 flex items-center justify-end gap-2 border-t pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <ScheduleDialog
              onSave={(day, act, time) => onUpdate(item.id, day, act, time)}
              initialItem={item}
              trigger={
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </button>
              }
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
