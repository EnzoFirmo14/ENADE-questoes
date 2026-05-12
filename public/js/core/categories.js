// public/js/categories.js

import {
  db,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "./core/firebase.js";

const CATEGORIES_COLLECTION = "categories";

export function listenCategories(callback) {
  const q = query(collection(db, CATEGORIES_COLLECTION), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));
    callback(categories);
  });
}

export async function getCategoriesOnce() {
  const snapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));
}

export async function createCategory({ name, color = "#8B7CF6", priority }) {
  return addDoc(collection(db, CATEGORIES_COLLECTION), {
    name,
    color,
    priority,
    items: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateCategory(categoryId, payload) {
  return updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function deleteCategory(categoryId) {
  return deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
}

export async function addItemToCategory(category) {
  const items = [...(category.items || []), "Novo item"];
  return updateDoc(doc(db, CATEGORIES_COLLECTION, category.id), {
    items,
    updatedAt: serverTimestamp()
  });
}

export async function saveCategoryItems(categoryId, items) {
  return updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), {
    items,
    updatedAt: serverTimestamp()
  });
}