// pages/api/debug-env.js
//
// TEMPORARY diagnostic route — delete this file once lead capture is confirmed
// working. It never reveals the actual secret value, only whether it's set
// and roughly how long it is, which is enough to tell "missing" apart from
// "present but wrong".

export default function handler(req, res) {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
  res.status(200).json({
    googleSheetWebhookConfigured: url.length > 0,
    length: url.length,
    looksLikeAppsScriptUrl: url.startsWith("https://script.google.com/macros/s/"),
  });
}
