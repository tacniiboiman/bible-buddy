import { supabase } from "@/integrations/supabase/client";
import type { StreakData } from "./streak-store";

export async function fetchCloudStreak(): Promise<StreakData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastActivityDate: data.last_activity_date,
    activityHistory: data.activity_history || [],
  };
}

export async function upsertCloudStreak(data: StreakData, userId: string): Promise<void> {
  const { error } = await supabase
    .from("streaks")
    .upsert({
      user_id: userId,
      current_streak: data.currentStreak,
      longest_streak: data.longestStreak,
      last_activity_date: data.lastActivityDate,
      activity_history: data.activityHistory,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) throw error;
}
