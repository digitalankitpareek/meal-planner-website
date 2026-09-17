/**
 * Paste this into Extensions > Apps Script on the Google Sheet you want leads
 * saved to. See README.md for full deployment steps.
 *
 * What it does: receives a POST with lead + household summary fields and
 * appends it as a new row. No raw per-member biometrics are sent here — just
 * a household size and an average adult BMI/category, computed server-side.
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Submitted At", "Name", "Phone", "Email", "Goal",
      "Household Size", "Adults", "Kids", "Avg Adult BMI", "Avg Adult BMI Category",
    ]);
  }

  sheet.appendRow([
    data.submittedAt || new Date().toISOString(),
    data.name || "",
    data.phone || "",
    data.email || "",
    data.goal || "",
    data.householdSize || "",
    data.adults || "",
    data.kids || "",
    data.avgAdultBmi || "",
    data.avgAdultBmiCategory || "",
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
