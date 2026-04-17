import { supabase } from "@/integrations/supabase/client";
import type { ScheduleItem } from "./schedule-store";

export async function fetchCloudSchedules(): Promise<ScheduleItem[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .order("day_of_week", { ascending: true });

  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('not found')) {
      console.warn("Schedules table might not exist yet in Supabase.");
      return [];
    }
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    day: row.day_of_week,
    activity: row.activity,
    time: row.activity_time || undefined,
    createdAt: row.created_at,
  }));
}

export async function saveCloudSchedule(
  day: number,
  activity: string,
  time: string | undefined,
  userId: string
): Promise<ScheduleItem> {
  const { data, error } = await supabase
    .from("schedules")
    .insert({
      day_of_week: day,
      activity: activity.trim(),
      activity_time: time?.trim() || null,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    day: data.day_of_week,
    activity: data.activity,
    time: data.activity_time || undefined,
    createdAt: data.created_at,
  };
}

export async function updateCloudSchedule(
  id: string,
  day: number,
  activity: string,
  time: string | undefined
): Promise<ScheduleItem> {
  const { data, error } = await supabase
    .from("schedules")
    .update({
      day_of_week: day,
      activity: activity.trim(),
      activity_time: time?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    day: data.day_of_week,
    activity: data.activity,
    time: data.activity_time || undefined,
    createdAt: data.created_at,
  };
}

export async function deleteCloudSchedule(id: string): Promise<void> {
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw error;
}
