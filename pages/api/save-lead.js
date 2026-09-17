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

function computeBMI(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm) / 100;
  if (!w || !h) return null;
  return w / (h * h);
}
function bmiCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal range";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

// Summarises the household into a few flat columns rather than dumping raw
// per-member biometrics into the sheet — enough for lead context, without
// turning the sheet into a health-data store.
function summarizeHousehold(members) {
  const list = Array.isArray(members) ? members : [];
  const adults = list.filter((m) => Number(m.age) >= 18).length;
  const kids = list.length - adults;
  const adultBmis = list
    .filter((m) => Number(m.age) >= 18)
    .map((m) => computeBMI(m.weightKg, m.heightCm))
    .filter((b) => b !== null);
  const avgBmi = adultBmis.length ? adultBmis.reduce((a, b) => a + b, 0) / adultBmis.length : null;
  return {
    householdSize: list.length,
    adults,
    kids,
    avgAdultBmi: avgBmi ? Math.round(avgBmi * 10) / 10 : "",
    avgAdultBmiCategory: avgBmi ? bmiCategory(avgBmi) : "",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { name, phone, email, goal, members } = req.body || {};

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
    const household = summarizeHousehold(members);
    const sheetRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || "",
        phone,
        email,
        goal: goal || "",
        ...household,
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
