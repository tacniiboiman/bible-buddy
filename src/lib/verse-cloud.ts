import { supabase } from "@/integrations/supabase/client";
import type { BibleVerse } from "./verse-store";

export async function fetchCloudVerses(): Promise<BibleVerse[]> {
  const { data, error } = await supabase
    .from("verses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    reference: row.reference,
    text: row.text,
    tags: row.tags || [],
    createdAt: row.created_at,
  }));
}

export async function saveCloudVerse(
  reference: string,
  text: string,
  tags: string[],
  userId: string,
): Promise<BibleVerse> {
  const { data, error } = await supabase
    .from("verses")
    .insert({
      reference: reference.trim(),
      text: text.trim(),
      tags: tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    reference: data.reference,
    text: data.text,
    tags: data.tags || [],
    createdAt: data.created_at,
  };
}

export async function deleteCloudVerse(id: string): Promise<void> {
  const { error } = await supabase.from("verses").delete().eq("id", id);
  if (error) throw error;
}

export async function updateCloudVerse(
  id: string,
  reference: string,
  text: string,
  tags: string[]
): Promise<BibleVerse> {
  const { data, error } = await supabase
    .from("verses")
    .update({
      reference: reference.trim(),
      text: text.trim(),
      tags: tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    reference: data.reference,
    text: data.text,
    tags: data.tags || [],
    createdAt: data.created_at,
  };
}

