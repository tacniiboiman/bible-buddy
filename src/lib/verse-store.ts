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

export function getVerses(): BibleVerse[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveVerse(reference: string, text: string, tags: string[]): BibleVerse {
  const verses = getVerses();
  const verse: BibleVerse = {
    id: generateId(),
    reference: reference.trim(),
    text: text.trim(),
    tags: tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
    createdAt: new Date().toISOString(),
  };
  verses.unshift(verse);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(verses));
  return verse;
}

export function deleteVerse(id: string): void {
  const verses = getVerses().filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(verses));
}

export function getAllTags(verses: BibleVerse[]): string[] {
  const tagSet = new Set<string>();
  verses.forEach((v) => v.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}
