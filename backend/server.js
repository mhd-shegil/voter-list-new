import express from "express";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(express.json());

// ================================
// GOOGLE AUTH SETUP
// ================================
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ["https://www.googleapis.com/auth/spreadsheets"]
);

const sheets = google.sheets({ version: "v4", auth });

// Your Google Sheet ID (from Render env)
const SPREADSHEET_ID = process.env.SHEET_ID;



// ===================================================================
// 1️⃣ ADD A NEW RESIDENT → APPEND TO END OF SHEET
// ===================================================================
app.post("/add-resident", async (req, res) => {
  try {
    const { name, guardian, ward, phone, category, remark, visit } = req.body;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, guardian, ward, phone, category, remark, visit]],
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Add failed:", err);
    res.status(500).json({ error: "Failed to add resident" });
  }
});



// ===================================================================
// 2️⃣ UPDATE SINGLE RESIDENT ROW → AUTO SYNC FROM FRONTEND
// ===================================================================
app.post("/update-resident", async (req, res) => {
  try {
    const r = req.body;

    const row = [
      r.serialNo,
      r.name,
      r.guardianName,
      r.wardHouseNo,
      r.phoneNumber,
      r.category,
      r.remark,
      r.visitCount,
    ];

    // serialNo → sheet row (header is row 1)
    const rowNumber = Number(r.serialNo) + 1;

    const range = `Sheet1!A${rowNumber}:H${rowNumber}`;

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



// ===================================================================
// 3️⃣ SYNC WHOLE RESIDENT LIST (EXPORT ALL)
// ===================================================================
app.post("/sync-residents", async (req, res) => {
  try {
    const rows = req.body;

    const values = rows.map((r) => [
      r.serialNo,
      r.name,
      r.guardianName,
      r.wardHouseNo,
      r.phoneNumber,
      r.category,
      r.remark,
      r.visitCount,
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    res.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("❌ Sync failed:", err);
    res.status(500).json({ error: "Sync failed" });
  }
});



// ===================================================================
// 4️⃣ FETCH ALL RESIDENTS FROM GOOGLE SHEETS
// ===================================================================
app.get("/fetch-residents", async (req, res) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:H",
    });

    const rows = result.data.values || [];
    const residents = rows.slice(1).map((r, index) => ({
      serialNo: r[0] || index + 1,
      name: r[1] || "",
      guardianName: r[2] || "",
      wardHouseNo: r[3] || "",
      phoneNumber: r[4] || "",
      category: r[5] || "",
      remark: r[6] || "",
      visitCount: Number(r[7]) || 0,
      id: `res-${index + 1}`,
    }));

    res.json({ success: true, residents });
  } catch (err) {
    console.error("❌ Fetch failed:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});



// ===================================================================
// START SERVER
// ===================================================================
app.listen(5000, () =>
  console.log("🚀 Backend running on http://localhost:5000")
);
