import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContactNotification } from "@/lib/email";

// Validációs függvény
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

export async function POST(request: Request) {
  try {
    console.log("Kontakt form kérés érkezett");
    const data = await request.json();

    // Validáljuk a beérkező adatokat
    console.log("Validálás kezdése...");
    const validationErrors = validateContactForm(data);
    if (validationErrors.length > 0) {
      console.log("Validációs hibák:", validationErrors);
      return NextResponse.json({ errors: validationErrors }, { status: 400 });
    }

    // Mentsük az adatbázisba
    console.log("Adatbázis mentés kezdése...");
    const contact = await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        district: data.district || null,
        preferredContact: data.preferredContact || "email",
        newsletter: data.newsletter || false,
        status: "new",
      },
    });
    console.log("Adatbázis mentés sikeres:", contact.id);

    // Email küldés
    console.log("Email küldés kezdése...");
    try {
      await sendContactNotification(data);
      console.log("Email küldés sikeres");
    } catch (emailError) {
      console.error("Email küldési hiba:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Üzenet sikeresen elküldve",
      id: contact.id,
      timestamp: contact.createdAt,
    });
  } catch (error) {
    console.error("Általános hiba:", error);
    return NextResponse.json(
      {
        error:
          "Hiba történt az üzenet feldolgozása során. Kérjük, próbálja újra később.",
      },
      { status: 500 }
    );
  }
}

// GET kérések tiltása
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
