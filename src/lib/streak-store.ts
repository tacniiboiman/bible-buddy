import { supabase } from "@/integrations/supabase/client";
import { fetchCloudStreak, upsertCloudStreak } from "./streak-cloud";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  activityHistory: string[]; // List of dates YYYY-MM-DD
}

const STORAGE_KEY = "bible-memory-streak";

export function getStreakData(): StreakData {
  const defaultData: StreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    activityHistory: [],
  };

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultData;
  } catch {
    return defaultData;
  }
}

export async function syncCloudToLocalStreak(): Promise<StreakData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return getStreakData();

  try {
    const cloudStreak = await fetchCloudStreak();
    if (cloudStreak) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudStreak));
      return cloudStreak;
    }
    return getStreakData();
  } catch (error) {
    console.error("Failed to sync cloud streak:", error);
    return getStreakData();
  }
}

export async function updateStreak(): Promise<StreakData> {
  const data = getStreakData();
  const today = new Date().toISOString().split("T")[0];
  
  if (data.lastActivityDate === today) {
    return data; // Already updated today
  }

  const newData = { ...data };
  
  // Check if yesterday was active
  if (data.lastActivityDate) {
    const lastDate = new Date(data.lastActivityDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (data.lastActivityDate === yesterdayStr) {
      newData.currentStreak += 1;
    } else {
      newData.currentStreak = 1; // Streak broken
    }
  } else {
    newData.currentStreak = 1; // First time
  }

  newData.lastActivityDate = today;
  if (!newData.activityHistory.includes(today)) {
    newData.activityHistory.push(today);
  }
  
  if (newData.currentStreak > newData.longestStreak) {
    newData.longestStreak = newData.currentStreak;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      await upsertCloudStreak(newData, user.id);
    } catch (error) {
      console.error("Failed to update cloud streak:", error);
    }
  }

  return newData;
}

export async function setStreak(count: number): Promise<StreakData> {
  const data = getStreakData();
  const newData = { 
    ...data, 
    currentStreak: count,
    longestStreak: Math.max(data.longestStreak, count)
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      await upsertCloudStreak(newData, user.id);
    } catch (error) {
      console.error("Failed to update cloud streak:", error);
    }
  }

  return newData;
}

export async function resetStreak(): Promise<StreakData> {
  const defaultData: StreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    activityHistory: [],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      await upsertCloudStreak(defaultData, user.id);
    } catch (error) {
      console.error("Failed to update cloud streak:", error);
    }
  }

  return defaultData;
}
