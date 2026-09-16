/**
 * Paste this into Extensions > Apps Script on the Google Sheet you want leads
 * saved to. See README.md for full deployment steps.
 *
 * What it does: receives a POST with {name, phone, email, goal, submittedAt}
 * and appends it as a new row. That's it — no other permissions needed.
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  // Add a header row once, if the sheet is empty.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Submitted At", "Name", "Phone", "Email", "Goal"]);
  }

  sheet.appendRow([
    data.submittedAt || new Date().toISOString(),
    data.name || "",
    data.phone || "",
    data.email || "",
    data.goal || "",
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
