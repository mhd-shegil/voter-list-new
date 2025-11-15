import express from "express";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------------
// Google Auth
// ------------------------------
console.log("🔐 Initializing Google Auth…");

let credentials = {};
try {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  console.log("✅ GOOGLE_CREDENTIALS loaded");
} catch (e) {
  console.error("❌ ERROR: GOOGLE_CREDENTIALS is invalid JSON");
}

const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ["https://www.googleapis.com/auth/spreadsheets"]
);

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = process.env.SHEET_ID;

if (!SPREADSHEET_ID) {
  console.error("❌ SHEET_ID env variable is missing!");
} else {
  console.log("✅ Using Sheet ID:", SPREADSHEET_ID);
}

// Helper: map Resident object → row array
const residentToRow = (r) => [
  r.serialNo || "",
  r.name || "",
  r.guardianName || "",
  r.wardHouseNo || "",
  r.houseName || "",
  r.genderAge || "",
  r.mobileNumber || "",
  r.phoneNumber || "",
  r.category || "",
  r.remark || "",
  r.visitCount ?? 0,
];

// =====================================================
// TEST WRITE ROUTE (VERY IMPORTANT)
// =====================================================
app.get("/test-write", async (req, res) => {
  console.log("✍️ TEST WRITE called...");
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["TEST WRITE OK", new Date().toISOString()]],
      },
    });

    console.log("✔ TEST WRITE SUCCESS");
    res.json({ success: true, message: "Test write successful" });
  } catch (err) {
    console.error("❌ TEST WRITE FAILED:", err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// 1️⃣ ADD RESIDENT
// =====================================================
app.post("/add-resident", async (req, res) => {
  console.log("📥 /add-resident HIT:", req.body);
  try {
    const r = req.body;
    const row = residentToRow(r);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:K",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    console.log("✔ Row added");
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Add failed:", err);
    res.status(500).json({ error: "Failed to add resident" });
  }
});

// =====================================================
// 2️⃣ UPDATE SINGLE RESIDENT
// =====================================================
app.post("/update-resident", async (req, res) => {
  console.log("📥 /update-resident HIT");
  console.log("Incoming data:", req.body);

  try {
    const r = req.body;
    const row = residentToRow(r);

    if (!r.serialNo || isNaN(Number(r.serialNo))) {
      console.log("⚠ serialNo missing → APPEND INSTEAD OF UPDATE");

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!A:K",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [row] },
      });

      console.log("✔ Row appended instead of update");
      return res.json({ success: true, mode: "append" });
    }

    const rowNumber = Number(r.serialNo) + 1;
    const range = `Sheet1!A${rowNumber}:K${rowNumber}`;

    console.log("📌 Updating range:", range);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    console.log("✔ Row updated successfully");
    res.json({ success: true, mode: "update" });
  } catch (err) {
    console.error("❌ Update failed:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// =====================================================
// 3️⃣ SYNC ALL RESIDENTS
// =====================================================
app.post("/sync-residents", async (req, res) => {
  console.log("📥 /sync-residents HIT");
  console.log("Rows received:", req.body.length);

  try {
    const rows = req.body;
    const values = rows.map(residentToRow);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:K",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    console.log("✔ Full sync completed");
    res.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("❌ Sync failed:", err);
    res.status(500).json({ error: "Sync failed" });
  }
});

// =====================================================
// 4️⃣ FETCH ALL RESIDENTS
// =====================================================
app.get("/fetch-residents", async (req, res) => {
  console.log("📥 /fetch-residents HIT");

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:K",
    });

    const rows = result.data.values || [];

    console.log("📄 Raw sheet rows:", rows.length);

    if (rows.length <= 1) {
      console.log("⚠ Sheet empty");
      return res.json({ success: true, residents: [] });
    }

    const residents = rows.slice(1).map((r, index) => ({
      serialNo: Number(r[0]) || index + 1,
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

    console.log("✔ Residents loaded:", residents.length);
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
