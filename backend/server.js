import express from "express";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------------
// Google Auth
// ------------------------------
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ["https://www.googleapis.com/auth/spreadsheets"]
);

const sheets = google.sheets({ version: "v4", auth });

// Your Sheet ID from Render env
const SPREADSHEET_ID = process.env.SHEET_ID;

if (!SPREADSHEET_ID) {
  console.error("❌ SHEET_ID env variable is missing!");
} else {
  console.log("✅ Using Sheet ID:", SPREADSHEET_ID);
}

// Helper: map a Resident object → sheet row (A–K)
const residentToRow = (r) => [
  r.serialNo || "",
  r.name || "",
  r.guardianName || "",
  r.wardHouseNo || "",
  r.houseName || "",
  r.genderAge || "",
  r.mobileNumber || "",   // Original Mobile
  r.phoneNumber || "",
  r.category || "",
  r.remark || "",
  r.visitCount ?? 0,
];

// =====================================================
// 1️⃣ ADD RESIDENT (append at bottom) — optional
// =====================================================
app.post("/add-resident", async (req, res) => {
  try {
    const r = req.body;

    const row = residentToRow(r);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:K", // 11 columns
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Add failed:", err);
    res.status(500).json({ error: "Failed to add resident" });
  }
});

// =====================================================
// 2️⃣ UPDATE SINGLE RESIDENT (used by auto-sync)
// =====================================================
app.post("/update-resident", async (req, res) => {
  try {
    const r = req.body;

    const row = residentToRow(r);

    // Serial No. corresponds to row number (header is row 1)
    const rowNumber = Number(r.serialNo) + 1; // +1 because headers in row 1

    const range = `Sheet1!A${rowNumber}:K${rowNumber}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Update failed:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// =====================================================
// 3️⃣ SYNC ALL RESIDENTS (overwrite full sheet)
// =====================================================
app.post("/sync-residents", async (req, res) => {
  try {
    const rows = req.body;

    const values = rows.map(residentToRow);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:K",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    res.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("❌ Sync failed:", err);
    res.status(500).json({ error: "Sync failed" });
  }
});

// =====================================================
// 4️⃣ FETCH ALL RESIDENTS (for new devices)
// =====================================================
app.get("/fetch-residents", async (req, res) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:K",
    });

    const rows = result.data.values || [];

    if (rows.length === 0) {
      return res.json({ success: true, residents: [] });
    }

    // rows[0] is header row (Serial No., Name, ...)
    const residents = rows.slice(1).map((r, index) => ({
      serialNo: r[0] || index + 1,
      name: r[1] || "",
      guardianName: r[2] || "",
      wardHouseNo: r[3] || "",
      houseName: r[4] || "",
      genderAge: r[5] || "",
      mobileNumber: r[6] || "",
      phoneNumber: r[7] || "",
      category: r[8] || "",
      remark: r[9] || "",
      visitCount: Number(r[10]) || 0,
      id: `res-${index + 1}`,
    }));

    console.log(`✅ Loaded ${residents.length} rows from Google Sheet`);
    res.json({ success: true, residents });
  } catch (err) {
    console.error("❌ Fetch failed:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// =====================================================
// START SERVER
// =====================================================
app.listen(5000, () =>
  console.log("🚀 Backend running on http://localhost:5000")
);
