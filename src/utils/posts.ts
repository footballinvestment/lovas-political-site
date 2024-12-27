export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Ékezetek eltávolítása
    .replace(/[^a-z0-9\s-]/g, "") // Speciális karakterek eltávolítása
    .replace(/\s+/g, "-") // Szóközök cseréje kötőjelre
    .replace(/-+/g, "-") // Többszörös kötőjelek egyesítése
    .trim();
}

export function generateExcerpt(
  content: string,
  maxLength: number = 160
): string {
  const stripped = content.replace(/(<([^>]+)>)/gi, ""); // HTML tagek eltávolítása
  if (stripped.length <= maxLength) return stripped;

  const truncated = stripped.slice(0, maxLength);
  return truncated.slice(0, truncated.lastIndexOf(" ")) + "...";
}
