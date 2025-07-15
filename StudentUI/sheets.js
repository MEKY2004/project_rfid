const { google } = require("googleapis");
const fs = require("fs");

// Load service account credentials
const credentials = require("./rfid.json");

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function appendToSheet(spreadsheetId, range, values) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range, // e.g. "Sheet1!A1"
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [values], // an array of rows
    },
  });
}

module.exports = { appendToSheet };
