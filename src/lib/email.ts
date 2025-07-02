import { Resend } from "resend";
import { 
  getContactNotificationTemplate, 
  getContactConfirmationTemplate,
  getNewsletterConfirmationTemplate 
} from "./email-templates";

// Environment validation
if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY környezeti változó nincs beállítva");
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const EMAIL_CONFIG = {
  fromDomain: process.env.EMAIL_FROM_DOMAIN || "onboarding@resend.dev",
  adminEmail: process.env.ADMIN_EMAIL || "lovas.zoltan1986@gmail.com",
  fromName: "Lovas Zoltán György",
  maxRetries: 3,
  retryDelay: 1000, // 1 second
} as const;

// Interfaces
export interface ContactData {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  district?: string;
  preferredContact?: string;
  newsletter?: boolean;
}

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
  retries?: number;
}

interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  type: 'contact_notification' | 'contact_confirmation' | 'newsletter';
  status: 'success' | 'error' | 'retry';
  timestamp: Date;
  error?: string;
  retries: number;
}

// Email logging (in production, consider using a database)
const emailLog: EmailLogEntry[] = [];

// Utility functions
function logEmail(entry: Omit<EmailLogEntry, 'timestamp'>): void {
  emailLog.push({
    ...entry,
    timestamp: new Date(),
  });
  
  // Keep only last 1000 entries
  if (emailLog.length > 1000) {
    emailLog.splice(0, emailLog.length - 1000);
  }
  
  console.log(`[Email Log] ${entry.type} to ${entry.to}: ${entry.status}`, entry);
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendEmailWithRetry(
  emailData: Parameters<typeof resend.emails.send>[0],
  type: EmailLogEntry['type'],
  maxRetries: number = EMAIL_CONFIG.maxRetries
): Promise<EmailResult> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await delay(EMAIL_CONFIG.retryDelay * attempt);
        logEmail({
          id: `retry-${Date.now()}`,
          to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
          subject: emailData.subject,
          type,
          status: 'retry',
          retries: attempt,
        });
      }

      const result = await resend.emails.send(emailData);
      
      logEmail({
        id: result.data?.id || `success-${Date.now()}`,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject: emailData.subject,
        type,
        status: 'success',
        retries: attempt,
      });

      return {
        success: true,
        id: result.data?.id,
        retries: attempt,
      };
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.statusCode === 422 || error.statusCode === 400) {
        break;
      }
      
      console.error(`Email sending attempt ${attempt + 1} failed:`, {
        error: error.message,
        statusCode: error.statusCode,
        code: error.code,
      });
    }
  }

  // Log final failure
  logEmail({
    id: `error-${Date.now()}`,
    to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
    subject: emailData.subject,
    type,
    status: 'error',
    error: lastError?.message || 'Unknown error',
    retries: maxRetries,
  });

  return {
    success: false,
    error: lastError?.message || 'Email sending failed after retries',
    retries: maxRetries,
  };
}

// Main email functions
export async function sendContactNotification(data: ContactData): Promise<EmailResult> {
  try {
    console.log("Kapcsolatfelvételi értesítő email küldése...", {
      to: EMAIL_CONFIG.adminEmail,
      from: EMAIL_CONFIG.fromDomain,
      subject: data.subject,
    });

    const htmlContent = getContactNotificationTemplate(data);

    const result = await sendEmailWithRetry({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromDomain}>`,
      to: EMAIL_CONFIG.adminEmail,
      subject: `🔔 Új üzenet: ${data.subject}`,
      html: htmlContent,
      reply_to: data.email,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
      },
    }, 'contact_notification');

    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  } catch (error: any) {
    console.error("Kapcsolatfelvételi értesítő email küldési hiba:", {
      error: error.message,
      data: { ...data, message: data.message.substring(0, 100) + '...' }
    });
    throw error;
  }
}

export async function sendContactConfirmation(data: ContactData): Promise<EmailResult> {
  try {
    console.log("Megerősítő email küldése a felhasználónak...", {
      to: data.email,
      subject: data.subject,
    });

    const htmlContent = getContactConfirmationTemplate(data);

    const result = await sendEmailWithRetry({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromDomain}>`,
      to: data.email,
      subject: `✅ Üzenet megerősítése - ${data.subject}`,
      html: htmlContent,
      headers: {
        'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?email=${encodeURIComponent(data.email)}>`,
      },
    }, 'contact_confirmation');

    if (!result.success) {
      console.error("Megerősítő email küldése sikertelen:", result.error);
      // Don't throw error for confirmation emails - it's not critical
    }

    return result;
  } catch (error: any) {
    console.error("Megerősítő email küldési hiba:", {
      error: error.message,
      email: data.email,
    });
    // Return failed result but don't throw
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function sendNewsletterConfirmation(email: string, name?: string): Promise<EmailResult> {
  try {
    console.log("Hírlevél megerősítő email küldése...", { email });

    const htmlContent = getNewsletterConfirmationTemplate(email, name);

    const result = await sendEmailWithRetry({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromDomain}>`,
      to: email,
      subject: `📧 Hírlevél feliratkozás megerősítése`,
      html: htmlContent,
      headers: {
        'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}>`,
      },
    }, 'newsletter');

    return result;
  } catch (error: any) {
    console.error("Hírlevél megerősítő email küldési hiba:", {
      error: error.message,
      email,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

// Utility functions for monitoring
export function getEmailStats(): {
  total: number;
  success: number;
  error: number;
  retry: number;
  byType: Record<EmailLogEntry['type'], number>;
} {
  const stats = {
    total: emailLog.length,
    success: 0,
    error: 0,
    retry: 0,
    byType: {
      contact_notification: 0,
      contact_confirmation: 0,
      newsletter: 0,
    } as Record<EmailLogEntry['type'], number>,
  };

  emailLog.forEach(entry => {
    stats[entry.status]++;
    stats.byType[entry.type]++;
  });

  return stats;
}

export function getRecentEmailLog(limit: number = 50): EmailLogEntry[] {
  return emailLog
    .slice(-limit)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Validate email configuration
export function validateEmailConfig(): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!process.env.RESEND_API_KEY) {
    issues.push("RESEND_API_KEY hiányzik");
  }

  if (!EMAIL_CONFIG.adminEmail || !EMAIL_CONFIG.adminEmail.includes('@')) {
    issues.push("ADMIN_EMAIL hiányzik vagy érvénytelen");
  }

  if (!EMAIL_CONFIG.fromDomain || !EMAIL_CONFIG.fromDomain.includes('@')) {
    issues.push("EMAIL_FROM_DOMAIN hiányzik vagy érvénytelen");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
