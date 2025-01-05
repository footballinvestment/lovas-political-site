import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY környezeti változó nincs beállítva");
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface ContactData {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  district?: string;
  preferredContact?: string;
}

export async function sendContactNotification(data: ContactData) {
  try {
    console.log("Email küldés kezdése...", {
      to: "lovas.zoltan1986@gmail.com", // Módosított sor
      from: "onboarding@resend.dev",
    });

    const { name, email, subject, message, phone, district, preferredContact } =
      data;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Új kapcsolatfelvételi üzenet érkezett</h2>
        
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Feladó neve:</strong> ${name}</p>
          <p><strong>Email címe:</strong> ${email}</p>
          ${phone ? `<p><strong>Telefonszám:</strong> ${phone}</p>` : ""}
          ${district ? `<p><strong>Kerület:</strong> ${district}</p>` : ""}
          ${
            preferredContact
              ? `<p><strong>Preferált kapcsolattartás:</strong> ${preferredContact}</p>`
              : ""
          }
          <p><strong>Tárgy:</strong> ${subject}</p>
          <p style="margin-top: 20px;"><strong>Üzenet:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        
        <p style="color: #718096; font-size: 14px;">
          Ez egy automatikus értesítés a weboldal kapcsolatfelvételi űrlapjáról.
        </p>
      </div>
    `;

    const emailResult = await resend.emails.send({
      from: "Lovas Zoltán <onboarding@resend.dev>",
      to: "lovas.zoltan1986@gmail.com", // Módosított sor
      subject: `Új üzenet: ${subject}`,
      html: emailHtml,
      reply_to: email,
    });

    console.log("Email küldés eredménye:", emailResult);
    return { success: true };
  } catch (error) {
    console.error("Email küldési hiba részletek:", {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    });
    throw error;
  }
}
