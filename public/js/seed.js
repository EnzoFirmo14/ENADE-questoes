// public/js/seed.js
import { DEFAULT_DATA, normalizeCategory } from "./data.js";
import { createCategory, getCategoriesOnce } from "./core/categories.js";

export async function seedCategoriesIfEmpty() {
  const existing = await getCategoriesOnce();
  if (existing.length > 0) return;

  for (const category of DEFAULT_DATA) {
    const normalized = normalizeCategory(category);
    await createCategory(normalized);
  }

  console.log("Seed inicial concluído.");
}