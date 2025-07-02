// src/lib/email-templates.ts

interface ContactData {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  district?: string;
  preferredContact?: string;
  newsletter?: boolean;
}

interface EmailTemplateData {
  [key: string]: any;
}

// Base email layout with consistent styling
function getBaseTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #6DAEF0 0%, #8DEBD1 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .header p {
            color: #ffffff;
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }
        
        .info-item {
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .info-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 4px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-value {
            color: #4a5568;
            font-size: 16px;
            word-wrap: break-word;
        }
        
        .message-content {
            background-color: #ffffff;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            white-space: pre-wrap;
            font-size: 15px;
            line-height: 1.7;
        }
        
        .footer {
            background-color: #f1f5f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: #dbeafe;
            color: #1e40af;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #6DAEF0 0%, #8DEBD1 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 16px 0;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>
  `;
}

// Contact notification template for admin
export function getContactNotificationTemplate(data: ContactData): string {
  const {
    name,
    email,
    subject,
    message,
    phone,
    district,
    preferredContact,
    newsletter
  } = data;

  const content = `
    <div class="header">
        <h1>Új kapcsolatfelvételi üzenet</h1>
        <p>Kapcsolatfelvételi űrlap a weboldalról</p>
    </div>
    
    <div class="content">
        <p style="font-size: 16px; margin-bottom: 24px;">
            Új üzenet érkezett a weboldal kapcsolatfelvételi űrlapján keresztül.
        </p>
        
        <div class="info-card">
            <div class="info-item">
                <div class="info-label">Feladó neve</div>
                <div class="info-value">${escapeHtml(name)}</div>
            </div>
            
            <div class="info-item">
                <div class="info-label">Email cím</div>
                <div class="info-value">
                    <a href="mailto:${escapeHtml(email)}" style="color: #3b82f6; text-decoration: none;">
                        ${escapeHtml(email)}
                    </a>
                </div>
            </div>
            
            ${phone ? `
            <div class="info-item">
                <div class="info-label">Telefonszám</div>
                <div class="info-value">
                    <a href="tel:${escapeHtml(phone)}" style="color: #3b82f6; text-decoration: none;">
                        ${escapeHtml(phone)}
                    </a>
                </div>
            </div>
            ` : ''}
            
            ${district ? `
            <div class="info-item">
                <div class="info-label">Kerület/Város</div>
                <div class="info-value">${escapeHtml(district)}</div>
            </div>
            ` : ''}
            
            ${preferredContact ? `
            <div class="info-item">
                <div class="info-label">Preferált kapcsolattartás</div>
                <div class="info-value">
                    <span class="badge">${getContactMethodName(preferredContact)}</span>
                </div>
            </div>
            ` : ''}
            
            <div class="info-item">
                <div class="info-label">Hírlevél feliratkozás</div>
                <div class="info-value">
                    <span class="badge" style="${newsletter ? 'background-color: #dcfce7; color: #166534;' : 'background-color: #fef2f2; color: #dc2626;'}">
                        ${newsletter ? 'Igen' : 'Nem'}
                    </span>
                </div>
            </div>
            
            <div class="info-item">
                <div class="info-label">Tárgy</div>
                <div class="info-value">${escapeHtml(subject)}</div>
            </div>
        </div>
        
        <div style="margin: 24px 0;">
            <div class="info-label" style="margin-bottom: 12px;">Üzenet tartalma</div>
            <div class="message-content">${escapeHtml(message)}</div>
        </div>
        
        <div style="margin-top: 32px; padding: 20px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; color: #0c4a6e; font-weight: 600;">💡 Gyors műveletek</p>
            <p style="margin: 8px 0 0 0; color: #075985; font-size: 14px;">
                • Válaszolj közvetlenül erre az emailre<br>
                • Hívd fel: <a href="tel:${escapeHtml(phone || '')}" style="color: #0ea5e9;">${phone || 'Nincs megadva'}</a><br>
                • Kapcsolatfelvétel módja: ${getContactMethodName(preferredContact || 'email')}
            </p>
        </div>
    </div>
    
    <div class="footer">
        <p><strong>Lovas Zoltán György</strong></p>
        <p>Mindenki Magyarországa Néppárt</p>
        <p style="margin-top: 16px;">
            Ez egy automatikus értesítés a 
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://lovaszoltan.hu'}">weboldal</a> 
            kapcsolatfelvételi űrlapjáról.
        </p>
        <p style="margin-top: 8px; font-size: 12px; color: #94a3b8;">
            Beérkezett: ${new Date().toLocaleString('hu-HU', { 
              timeZone: 'Europe/Budapest',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
        </p>
    </div>
  `;

  return getBaseTemplate(content, 'Új kapcsolatfelvételi üzenet');
}

// Confirmation email template for users
export function getContactConfirmationTemplate(data: ContactData): string {
  const { name, subject } = data;

  const content = `
    <div class="header">
        <h1>Köszönjük a megkeresését!</h1>
        <p>Üzenetét sikeresen megkaptuk</p>
    </div>
    
    <div class="content">
        <p style="font-size: 18px; margin-bottom: 24px;">
            Kedves <strong>${escapeHtml(name)}</strong>!
        </p>
        
        <p style="margin-bottom: 20px;">
            Köszönjük, hogy kapcsolatba lépett velünk! Üzenetét megkaptuk, és hamarosan 
            felvesszük Önnel a kapcsolatot.
        </p>
        
        <div class="info-card">
            <div class="info-item">
                <div class="info-label">Az Ön üzenete tárgya</div>
                <div class="info-value">${escapeHtml(subject)}</div>
            </div>
            
            <div class="info-item">
                <div class="info-label">Beérkezés időpontja</div>
                <div class="info-value">
                    ${new Date().toLocaleString('hu-HU', { 
                      timeZone: 'Europe/Budapest',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                </div>
            </div>
        </div>
        
        <div style="margin: 32px 0; padding: 24px; background-color: #f0f9ff; border-radius: 8px; text-align: center;">
            <h3 style="color: #0c4a6e; margin-bottom: 16px;">Mit tehetünk Önért?</h3>
            <p style="color: #075985; margin-bottom: 20px;">
                Általában <strong>24 órán belül</strong> válaszolunk a megkeresésekre. 
                Sürgős esetben kérjük, hívja telefonszámunkat.
            </p>
            <a href="tel:+36201234567" class="button">
                📞 +36 20 123 4567
            </a>
        </div>
        
        <div style="margin-top: 32px;">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Hasznos linkek</h3>
            <p style="margin-bottom: 12px;">
                • <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://lovaszoltan.hu'}/program" style="color: #3b82f6; text-decoration: none;">Programunk</a><br>
                • <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://lovaszoltan.hu'}/esemenyek" style="color: #3b82f6; text-decoration: none;">Közelgő események</a><br>
                • <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://lovaszoltan.hu'}/hirek" style="color: #3b82f6; text-decoration: none;">Legfrissebb hírek</a>
            </p>
        </div>
    </div>
    
    <div class="footer">
        <p><strong>Lovas Zoltán György</strong></p>
        <p>Mindenki Magyarországa Néppárt</p>
        <p style="margin-top: 16px;">
            Weboldal: <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://lovaszoltan.hu'}">${process.env.NEXT_PUBLIC_BASE_URL || 'lovaszoltan.hu'}</a><br>
            Email: <a href="mailto:kapcsolat@lovaszoltan.hu">kapcsolat@lovaszoltan.hu</a><br>
            Telefon: <a href="tel:+36201234567">+36 20 123 4567</a>
        </p>
        <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
            Ez egy automatikus megerősítő email. Kérjük, ne válaszoljon erre az üzenetre.
        </p>
    </div>
  `;

  return getBaseTemplate(content, 'Üzenet megerősítése - Lovas Zoltán György');
}

// Newsletter subscription template
export function getNewsletterConfirmationTemplate(email: string, name?: string): string {
  const content = `
    <div class="header">
        <h1>Hírlevél feliratkozás</h1>
        <p>Sikeresen feliratkozott hírlevelünkre</p>
    </div>
    
    <div class="content">
        <p style="font-size: 18px; margin-bottom: 24px;">
            ${name ? `Kedves <strong>${escapeHtml(name)}</strong>!` : 'Kedves Feliratkozó!'}
        </p>
        
        <p style="margin-bottom: 20px;">
            Köszönjük, hogy feliratkozott hírlevelünkre! Ezentúl elsők között értesülhet 
            a legfrissebb hírekről, eseményekről és programjainkról.
        </p>
        
        <div style="margin: 32px 0; padding: 24px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
            <h3 style="color: #166534; margin-bottom: 16px;">🎉 Sikeres feliratkozás!</h3>
            <p style="color: #15803d; margin-bottom: 20px;">
                Email címe: <strong>${escapeHtml(email)}</strong>
            </p>
        </div>
        
        <div style="margin-top: 32px;">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Mit várhat tőlünk?</h3>
            <ul style="color: #4a5568; margin-left: 20px;">
                <li style="margin-bottom: 8px;">Heti összefoglaló a legfontosabb hírekről</li>
                <li style="margin-bottom: 8px;">Értesítések a közelgő eseményekről</li>
                <li style="margin-bottom: 8px;">Exkluzív tartalmak és vélemények</li>
                <li style="margin-bottom: 8px;">Közösségi programok meghívói</li>
            </ul>
        </div>
    </div>
    
    <div class="footer">
        <p><strong>Lovas Zoltán György</strong></p>
        <p>Mindenki Magyarországa Néppárt</p>
        <p style="margin-top: 16px;">
            Ha nem szeretne több hírlevet kapni, 
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://lovaszoltan.hu'}/unsubscribe?email=${encodeURIComponent(email)}">
                itt leiratkozhat
            </a>.
        </p>
    </div>
  `;

  return getBaseTemplate(content, 'Hírlevél feliratkozás megerősítése');
}

// Utility functions
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function getContactMethodName(method: string): string {
  switch (method.toLowerCase()) {
    case 'email':
      return 'Email';
    case 'phone':
      return 'Telefon';
    case 'both':
      return 'Mindkettő';
    default:
      return 'Email';
  }
}