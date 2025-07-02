// src/app/api/contact/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContactNotification, sendContactConfirmation, ContactData } from "@/lib/email";
import { withRateLimit } from "@/lib/rate-limit";
import { validateCSRFToken } from "@/lib/csrf";
import DOMPurify from "isomorphic-dompurify";

// Sanitize input to prevent XSS and HTML injection
function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  
  // Remove HTML tags and dangerous characters
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // Additional SQL injection prevention (though Prisma handles this)
  return cleaned
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .trim();
}

const validateContactForm = (data: any) => {
  const errors = [];
  
  // Sanitize all string inputs
  const name = sanitizeInput(data.name || "");
  const email = sanitizeInput(data.email || "");
  const subject = sanitizeInput(data.subject || "");
  const message = sanitizeInput(data.message || "");
  const phone = sanitizeInput(data.phone || "");
  const district = sanitizeInput(data.district || "");
  
  // Validate sanitized inputs
  if (!name || name.length < 2 || name.length > 100) {
    errors.push("A név 2-100 karakter között kell legyen");
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    errors.push("Érvénytelen email cím");
  }
  
  if (!subject || subject.length < 3 || subject.length > 200) {
    errors.push("A tárgy 3-200 karakter között kell legyen");
  }
  
  if (!message || message.length < 10 || message.length > 2000) {
    errors.push("Az üzenet 10-2000 karakter között kell legyen");
  }
  
  if (phone && (!/^[0-9+\-\s()]*$/.test(phone) || phone.length > 20)) {
    errors.push("Érvénytelen telefonszám formátum");
  }
  
  if (district && district.length > 100) {
    errors.push("Kerület neve túl hosszú");
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /<script/i,
    /union\s+select/i,
    /drop\s+table/i,
  ];
  
  const allText = `${name} ${email} ${subject} ${message} ${phone} ${district}`;
  if (suspiciousPatterns.some(pattern => pattern.test(allText))) {
    errors.push("Érvénytelen tartalom észlelve");
  }
  
  return {
    errors,
    sanitizedData: { name, email, subject, message, phone, district }
  };
};

export async function POST(request: Request) {
  return withRateLimit("contact", async () => {
    try {
      // CSRF Protection
      const csrfToken = request.headers.get("x-csrf-token");
      if (!csrfToken || !validateCSRFToken(csrfToken)) {
        return NextResponse.json(
          { error: "Invalid CSRF token" },
          { status: 403 }
        );
      }

      const rawData = await request.json();
      const validation = validateContactForm(rawData);

      if (validation.errors.length > 0) {
        return NextResponse.json({ errors: validation.errors }, { status: 400 });
      }

      const { sanitizedData } = validation;
      
      // Use sanitized data for database insertion
      const contact = await prisma.contact.create({
        data: {
          name: sanitizedData.name,
          email: sanitizedData.email,
          phone: sanitizedData.phone || null,
          subject: sanitizedData.subject,
          message: sanitizedData.message,
          district: sanitizedData.district || null,
          preferredContact: sanitizeInput(rawData.preferredContact || "email"),
          newsletter: Boolean(rawData.newsletter),
          status: "NEW",
        },
      });

      // Prepare email data
      const emailData: ContactData = {
        ...sanitizedData,
        preferredContact: sanitizeInput(rawData.preferredContact || "email"),
        newsletter: Boolean(rawData.newsletter),
      };

      // Send notification and confirmation emails
      const emailResults = await Promise.allSettled([
        sendContactNotification(emailData),
        sendContactConfirmation(emailData),
      ]);

      const [notificationResult, confirmationResult] = emailResults;

      // Log email results
      if (notificationResult.status === 'rejected') {
        console.error("Admin értesítő email küldési hiba:", notificationResult.reason);
      } else {
        console.log("Admin értesítő email sikeresen elküldve:", notificationResult.value);
      }

      if (confirmationResult.status === 'rejected') {
        console.error("Felhasználó megerősítő email küldési hiba:", confirmationResult.reason);
      } else {
        console.log("Felhasználó megerősítő email eredménye:", confirmationResult.value);
      }

      return NextResponse.json({
        success: true,
        message: "Üzenet sikeresen elküldve",
        id: contact.id,
        timestamp: contact.createdAt,
        emailStatus: {
          notificationSent: notificationResult.status === 'fulfilled',
          confirmationSent: confirmationResult.status === 'fulfilled',
        },
      });
    } catch (error) {
      console.error("Contact form error:", error);
      return NextResponse.json(
        { error: "Hiba történt az üzenet feldolgozása során." },
        { status: 500 }
      );
    }
  });
}

export async function GET() {
  return withRateLimit("default", async () => {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  });
}
