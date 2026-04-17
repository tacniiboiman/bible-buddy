import { supabase } from "@/integrations/supabase/client";
import { fetchCloudVerses, saveCloudVerse, deleteCloudVerse, updateCloudVerse } from "./verse-cloud";

export interface BibleVerse {
  id: string;
  reference: string;
  text: string;
  tags: string[];
  createdAt: string;
}

const STORAGE_KEY = "bible-memory-verses";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getLocalVerses(): BibleVerse[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function syncCloudToLocal(): Promise<BibleVerse[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return getLocalVerses();

  try {
    const cloudVerses = await fetchCloudVerses();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudVerses));
    return cloudVerses;
  } catch (error) {
    console.error("Failed to sync cloud verses:", error);
    return getLocalVerses();
  }
}

export async function saveVerse(
  reference: string,
  text: string,
  tags: string[]
): Promise<BibleVerse> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const localVerses = getLocalVerses();
  const newVerse: BibleVerse = {
    id: generateId(),
    reference: reference.trim(),
    text: text.trim(),
    tags: tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
    createdAt: new Date().toISOString(),
  };

  // Always save locally first (Persistence)
  localVerses.unshift(newVerse);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localVerses));

  // If logged in, sync to cloud
  if (user) {
    try {
      const cloudVerse = await saveCloudVerse(
        newVerse.reference,
        newVerse.text,
        newVerse.tags,
        user.id
      );
      // Update local ID with cloud ID to keep them in sync
      const updatedLocal = localVerses.map(v => v.id === newVerse.id ? cloudVerse : v);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocal));
      return cloudVerse;
    } catch (error) {
      console.error("Failed to save to cloud, will sync later:", error);
    }
  }

  return newVerse;
}

export async function deleteVerse(id: string): Promise<void> {
  const localVerses = getLocalVerses().filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localVerses));

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      await deleteCloudVerse(id);
    } catch (error) {
      console.error("Failed to delete from cloud:", error);
    }
  }
}

export async function updateVerse(
  id: string,
  reference: string,
  text: string,
  tags: string[]
): Promise<BibleVerse> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const localVerses = getLocalVerses();
  const verseIndex = localVerses.findIndex(v => v.id === id);
  
  if (verseIndex === -1) throw new Error("Verse not found");

  const updatedVerse: BibleVerse = {
    ...localVerses[verseIndex],
    reference: reference.trim(),
    text: text.trim(),
    tags: tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
  };

  // Update locally
  localVerses[verseIndex] = updatedVerse;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localVerses));

  // Update cloud if logged in
  if (user) {
    try {
      return await updateCloudVerse(id, reference, text, tags);
    } catch (error) {
      console.error("Failed to update cloud verse:", error);
    }
  }

  return updatedVerse;
}

export function getAllTags(verses: BibleVerse[]): string[] {
  const tagSet = new Set<string>();
  verses.forEach((v) => v.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}


