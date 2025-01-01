// src/utils/posts.ts
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // ékezetek eltávolítása
    .replace(/[^a-z0-9]+/g, "-") // speciális karakterek cseréje kötőjelre
    .replace(/^-+|-+$/g, "") // kötőjelek eltávolítása az elejéről és végéről
    .trim();
}
