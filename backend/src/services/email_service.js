const nodemailer = require("nodemailer");

function validateEmailEnvironmentVariables() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing env var: ${key}`);
    }
  }
}

function createMailerTransport() {
  validateEmailEnvironmentVariables();

  const port = Number(process.env.SMTP_PORT);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendPasswordResetEmail(recipientEmail, resetLink) {
  const transporter = createMailerTransport();

  await transporter.sendMail({
    from: "Tarefando <no-reply@tarefando.local>",
    to: recipientEmail,
    subject: "Recuperação de senha — Tarefando",
    text: `Use o link para redefinir sua senha: ${resetLink}`,
    html: `
  <div style="background:#0f1220;padding:32px 12px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#1b1e30;border-radius:16px;overflow:hidden;border:1px solid #2b3144;">
      <tr>
        <td style="padding:26px 26px 10px 26px;font-family:Arial,sans-serif;color:#ffe08a;font-size:22px;font-weight:800;">
          Tarefando — Recuperação de senha
        </td>
      </tr>

      <tr>
        <td style="padding:0 26px 18px 26px;font-family:Arial,sans-serif;color:#bae1fc;font-size:14px;line-height:1.5;">
          Recebemos um pedido para redefinir sua senha. Clique no botão abaixo.
        </td>
      </tr>

      <tr>
        <td style="padding:0 26px 22px 26px;">
          <a href="${resetLink}"
             style="display:inline-block;background:#ffe08a;color:#1a1d35;text-decoration:none;font-family:Arial,sans-serif;font-weight:800;padding:12px 16px;border-radius:10px;">
            Redefinir senha
          </a>
        </td>
      </tr>

      <tr>
        <td style="padding:0 26px 22px 26px;font-family:Arial,sans-serif;color:#c9d6e6;font-size:12px;line-height:1.5;">
          Se o botão não funcionar, copie e cole este link no navegador:
          <div style="margin-top:10px;word-break:break-all;color:#9dc0e6;">
            ${resetLink}
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:14px 26px 24px 26px;font-family:Arial,sans-serif;color:#9aa7bd;font-size:12px;line-height:1.5;border-top:1px solid #2b3144;">
          Se você não solicitou isso, ignore este email. O link expira em 30 minutos.
        </td>
      </tr>
    </table>
  </div>
`,
  });
}

module.exports = { sendPasswordResetEmail };
