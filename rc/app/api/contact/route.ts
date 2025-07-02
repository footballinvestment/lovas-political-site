// src/app/api/contact/route.ts
const validateContactForm = (data: any) => {
  const errors = [];
  if (!data.name || typeof data.name !== "string" || data.name.length < 2) {
    errors.push("Érvénytelen név");
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Érvénytelen email cím");
  }
  if (
    !data.subject ||
    typeof data.subject !== "string" ||
    data.subject.length < 3
  ) {
    errors.push("Érvénytelen tárgy");
  }
  if (
    !data.message ||
    typeof data.message !== "string" ||
    data.message.length < 10
  ) {
    errors.push("Az üzenetnek legalább 10 karakter hosszúnak kell lennie");
  }
  if (data.phone && !/^[0-9+\-\s()]*$/.test(data.phone)) {
    errors.push("Érvénytelen telefonszám formátum");
  }
  return errors;
};
