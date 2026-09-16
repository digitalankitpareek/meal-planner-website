// pages/api/save-lead.js
//
// Forwards the visitor's name/phone/email to a Google Sheet. No database of
// our own — a Google Apps Script "Web App" URL acts as the simplest possible
// free webhook that appends a row to a Sheet. See README.md for the exact
// Apps Script code to paste in and how to deploy it.

function isPlausiblePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}
function isPlausibleEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { name, phone, email, goal } = req.body || {};

  if (!isPlausiblePhone(phone) || !isPlausibleEmail(email)) {
    res.status(400).json({ error: "Please provide a valid phone number and email." });
    return;
  }

  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("GOOGLE_SHEET_WEBHOOK_URL is not set.");
    res.status(500).json({ error: "Lead capture isn't configured yet." });
    return;
  }

  try {
    const sheetRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || "",
        phone,
        email,
        goal: goal || "",
        submittedAt: new Date().toISOString(),
      }),
    });
    if (!sheetRes.ok) throw new Error(`Sheet webhook responded ${sheetRes.status}`);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not save your details right now. Please try again." });
  }
}
