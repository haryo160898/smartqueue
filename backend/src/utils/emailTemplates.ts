export interface ResetPasswordEmailData {
  userName: string;
  resetLink: string;
  expiredTime: string;
}

const getAppBrandHtml = () => {
  return `
    <div style="font-size:18px;font-weight:700;line-height:1.2;color:#0f172a;">
      SMART QUEUE<br />
      <span style="font-size:14px;font-weight:500;color:#2563eb;">BENGKEL RAKA</span>
    </div>
  `;
};

const getHeaderHtml = () => {
  return `
    <td style="padding:24px 24px 16px;text-align:center;">
      <div style="display:inline-block;padding:16px 20px;border-radius:18px;background:#eff6ff;">
        <span style="font-size:28px;line-height:1;color:#1e40af;">🔧</span>
      </div>
      <div style="margin-top:16px;">${getAppBrandHtml()}</div>
    </td>
  `;
};

export const createResetPasswordEmail = ({ userName, resetLink, expiredTime }: ResetPasswordEmailData) => {
  const subject = '🔒 Reset Password Smart Queue';

  const text = `Halo, ${userName}\n\nKami menerima permintaan untuk mengatur ulang password akun Smart Queue Anda.\n\nKlik tautan berikut untuk membuat password baru:\n${resetLink}\n\nJika tombol tidak bisa diklik, salin dan buka tautan tersebut di browser Anda.\n\n• Link hanya berlaku selama masa aktif token.\n• Link hanya dapat digunakan satu kali.\n• Jangan bagikan link kepada siapa pun.\n\nJika Anda tidak merasa meminta reset password, abaikan email ini.\nAkun Anda tetap aman.\n\nSmart Queue\nBENGKEL RAKA\n\nEmail ini dikirim secara otomatis. Mohon jangan membalas email ini.\n\n© 2026 Smart Queue - Bengkel RAKA All Rights Reserved`;

  const html = `
  <!DOCTYPE html>
  <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reset Password</title>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;width:100%;min-width:100%;">
        <tr>
          <td align="center" style="padding:24px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:22px;box-shadow:0 20px 45px rgba(15,23,42,0.08);overflow:hidden;">
              <tr>${getHeaderHtml()}</tr>
              <tr>
                <td style="padding:0 24px;">
                  <h1 style="margin:0;font-size:28px;font-weight:700;color:#0f172a;">Reset Password</h1>
                  <p style="margin:16px 0 0;font-size:16px;line-height:1.7;color:#334155;">Halo, ${userName}</p>
                  <p style="margin:12px 0 0;font-size:16px;line-height:1.7;color:#4b5563;">Kami menerima permintaan untuk mengatur ulang password akun Smart Queue Anda. Klik tombol di bawah ini untuk membuat password baru.</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:24px;">
                  <a href="${resetLink}" style="display:inline-block;width:100%;max-width:320px;padding:14px 18px;background:#2563eb;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 10px 25px rgba(37,99,235,0.25);">Reset Password</a>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 24px;">
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">Jika tombol tidak dapat digunakan, salin dan buka tautan berikut:</p>
                  <p style="margin:12px 0 0;padding:16px;background:#f1f5f9;border-radius:12px;color:#0f172a;font-size:14px;word-break:break-word;">${resetLink}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:18px;">
                        <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#0f172a;">🛡️ Keamanan</p>
                        <ul style="padding-left:18px;margin:0;color:#475569;font-size:14px;line-height:1.8;">
                          <li>Link hanya berlaku selama masa aktif token.</li>
                          <li>Link hanya dapat digunakan satu kali.</li>
                          <li>Jangan bagikan link kepada siapa pun.</li>
                        </ul>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:18px;">
                        <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">🔒 Perhatian</p>
                        <p style="margin:12px 0 0;color:#475569;font-size:14px;line-height:1.8;">Jika Anda tidak merasa meminta reset password, abaikan email ini. Akun Anda tetap aman.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 24px;">
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">${expiredTime}.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 24px;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;"><strong>Smart Queue</strong><br />Bengkel RAKA</p>
                  <p style="margin:12px 0 0;font-size:12px;line-height:1.7;color:#94a3b8;">Email ini dikirim secara otomatis. Mohon jangan membalas email ini.</p>
                  <p style="margin:16px 0 0;font-size:12px;line-height:1.7;color:#94a3b8;">© 2026 Smart Queue - Bengkel RAKA All Rights Reserved</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  return {
    subject,
    text,
    html,
  };
};
