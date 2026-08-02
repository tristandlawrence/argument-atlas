export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`\n[email:dev-mode] To: ${to}\nSubject: ${subject}\n${html}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Argument Atlas <noreply@argument-atlas.example>", to, subject, html }),
  });
  if (!res.ok) {
    console.error("Failed to send email:", await res.text());
  }
}
