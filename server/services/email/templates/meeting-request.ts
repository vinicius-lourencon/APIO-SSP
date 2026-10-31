// "Solicitação de reunião" e-mail (pt-BR), HTML + plain text.
// Everything that comes from users is escaped in the HTML version: tags/scripts show up as text.

export interface MeetingRequestEmailData {
  studentName: string;
  professorName: string;
  professorEmail: string;
  projectTitle: string;
  message: string;
  /** Already formatted, e.g. "15/10/2026 às 14:00" */
  proposedAt: string | null;
  location: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const multiline = (value: string) => escapeHtml(value).replace(/\r?\n/g, "<br>");

export function meetingRequestEmail(data: MeetingRequestEmailData): { subject: string; text: string; html: string } {
  const firstName = data.studentName.split(" ")[0] || data.studentName;
  const subject = `Solicitação de reunião — projeto "${data.projectTitle}"`;

  const details: [string, string][] = [];
  if (data.proposedAt) details.push(["Data e horário sugeridos", data.proposedAt]);
  if (data.location) details.push(["Local", data.location]);

  const text = [
    `Olá, ${firstName}!`,
    "",
    `${data.professorName} solicita uma reunião com você para discutir o projeto acadêmico "${data.projectTitle}".`,
    ...(details.length ? ["", ...details.map(([label, value]) => `${label}: ${value}`)] : []),
    ...(data.message ? ["", "Mensagem do professor:", data.message] : []),
    "",
    `Para combinar a reunião, responda a este e-mail: a resposta vai diretamente para ${data.professorName} (${data.professorEmail}).`,
    "",
    "—",
    "SISAPA — Sistema Integrado de Submissão e Avaliação de Projetos Acadêmicos (IFMS)",
  ].join("\n");

  const detailsHtml = details.length
    ? `<table role="presentation" style="border-collapse:collapse;margin:16px 0">${details
        .map(
          ([label, value]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#5A5858">${escapeHtml(label)}</td><td style="padding:4px 0;font-weight:bold">${escapeHtml(value)}</td></tr>`,
        )
        .join("")}</table>`
    : "";

  const messageHtml = data.message
    ? `<p style="margin:16px 0 4px;color:#5A5858">Mensagem do professor:</p>
       <blockquote style="margin:0;padding:12px 16px;background:#F3F7F4;border-left:4px solid #10512D">${multiline(data.message)}</blockquote>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#F9F9F9;font-family:Arial,Helvetica,sans-serif;color:#333">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #EEE;border-radius:8px;padding:24px">
      <h1 style="margin:0 0 16px;font-size:20px;color:#10512D">Solicitação de reunião</h1>
      <p style="margin:0 0 12px">Olá, ${escapeHtml(firstName)}!</p>
      <p style="margin:0 0 12px"><strong>${escapeHtml(data.professorName)}</strong> solicita uma reunião com você para discutir o projeto acadêmico <strong>"${escapeHtml(data.projectTitle)}"</strong>.</p>
      ${detailsHtml}
      ${messageHtml}
      <p style="margin:20px 0 0">Para combinar a reunião, <strong>responda a este e-mail</strong>: a resposta vai diretamente para ${escapeHtml(data.professorName)} (${escapeHtml(data.professorEmail)}).</p>
      <hr style="border:none;border-top:1px solid #EEE;margin:24px 0 12px">
      <p style="margin:0;font-size:12px;color:#999">SISAPA — Sistema Integrado de Submissão e Avaliação de Projetos Acadêmicos (IFMS)</p>
    </div>
  </body>
</html>`;

  return { subject, text, html };
}
