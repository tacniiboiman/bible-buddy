import { supabase } from "@/integrations/supabase/client";
import { 
  fetchCloudSchedules, 
  saveCloudSchedule, 
  updateCloudSchedule, 
  deleteCloudSchedule 
} from "./schedule-cloud";

export interface ScheduleItem {
  id: string;
  day: number; // 0 (Sunday) to 6 (Saturday)
  activity: string;
  time?: string;
  createdAt: string;
}

const STORAGE_KEY = "bible-buddy-schedule";

export function getLocalSchedules(): ScheduleItem[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function syncCloudToLocalSchedules(): Promise<ScheduleItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return getLocalSchedules();

  try {
    const cloudItems = await fetchCloudSchedules();
    // In a real app, you'd do a more sophisticated merge. 
    // For now, cloud takes precedence if it exists.
    if (cloudItems.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudItems));
      return cloudItems;
    }
  } catch (error) {
    console.error("Failed to sync schedules from cloud:", error);
  }
  
  return getLocalSchedules();
}

export async function saveSchedule(
  day: number,
  activity: string,
  time?: string
): Promise<ScheduleItem> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Optimistic local save
  const localItems = getLocalSchedules();
  const newItem: ScheduleItem = {
    id: crypto.randomUUID(),
    day,
    activity,
    time,
    createdAt: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...localItems, newItem]));

  // Cloud sync if logged in
  if (user) {
    try {
      return await saveCloudSchedule(day, activity, time, user.id);
    } catch (error) {
      console.error("Cloud save failed, using local only:", error);
    }
  }

  return newItem;
}

export async function updateSchedule(
  id: string,
  day: number,
  activity: string,
  time?: string
): Promise<ScheduleItem> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const localItems = getLocalSchedules();
  const index = localItems.findIndex(i => i.id === id);
  if (index === -1) throw new Error("Schedule item not found");

  const updated: ScheduleItem = {
    ...localItems[index],
    day,
    activity,
    time,
  };

  localItems[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localItems));

  if (user) {
    try {
      return await updateCloudSchedule(id, day, activity, time);
    } catch (error) {
      console.error("Cloud update failed:", error);
    }
  }

  return updated;
}

export async function deleteSchedule(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const localItems = getLocalSchedules();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localItems.filter(i => i.id !== id)));

  if (user) {
    try {
      await deleteCloudSchedule(id);
    } catch (error) {
      console.error("Cloud delete failed:", error);
    }
  }
}
