import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock } from "lucide-react";
import type { ScheduleItem } from "@/lib/schedule-store";

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

interface ScheduleDialogProps {
  onSave: (day: number, activity: string, time?: string) => void;
  initialItem?: ScheduleItem;
  defaultDay?: number;
  trigger?: React.ReactNode;
}

export function ScheduleDialog({ onSave, initialItem, defaultDay, trigger }: ScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<string>(initialItem?.day.toString() ?? defaultDay?.toString() ?? "0");
  const [activity, setActivity] = useState(initialItem?.activity ?? "");
  const [time, setTime] = useState(initialItem?.time ?? "");

  useEffect(() => {
    if (open) {
      setDay(initialItem?.day.toString() ?? defaultDay?.toString() ?? "0");
      setActivity(initialItem?.activity ?? "");
      setTime(initialItem?.time ?? "");
    }
  }, [open, initialItem, defaultDay]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activity.trim()) return;
    onSave(parseInt(day), activity, time || undefined);
    if (!initialItem) {
      setActivity("");
      setTime("");
    }
    setOpen(false);
  }

  const isEditing = !!initialItem;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {isEditing ? "Edit Activity" : "Add Activity"}
          </DialogTitle>
          <DialogDescription>
            Plan your Bible study or reflection for the day.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Day of the Week
            </label>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((name, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Activity
            </label>
            <Input
              placeholder="e.g. Read John 1, Meditation, Prayer"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Time (Optional)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="time"
                className="pl-9"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            {isEditing ? "Update Activity" : "Save Activity"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
