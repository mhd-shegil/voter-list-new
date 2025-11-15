import * as XLSX from 'xlsx';
import { Resident } from '@/types/resident';

// ================================================
// PARSE EXCEL → RESIDENT LIST  (Matches Google Sheet)
// ================================================
export const parseExcelFile = (file: File): Promise<Resident[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const residents: Resident[] = jsonData.map((row: any, index: number) => {
          return {
            id: `resident-${Date.now()}-${index}`,

            // 🔥 EXACT Google Sheet Columns
            serialNo:
              row["Serial No."] ||
              row["Serial No"] ||
              row["S.No"] ||
              row["SNo"] ||
              index + 1,

            name: row["Name"] || "",
            guardianName: row["Guardian's Name"] || "",
            wardHouseNo: row["Ward/House No"] || row["Old Ward No/House No"] || "",

            houseName: row["House Name"] || "",
            genderAge: row["Gender/Age"] || "",

            mobileNumber:
              row["Original Mobile"] ||
              row["Mobile Number"] ||
              row["Mobile"] ||
              "",

            phoneNumber: row["Phone Number"] || "",

            category: row["Category"] || "",
            remark: row["Remark"] || "",

            visitCount: parseInt(row["Visit Count"] || "0") || 0,
          };
        });

        resolve(residents);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
};

// ==================================================
// EXPORT RESIDENTS → EXCEL  (Matches Google Sheet)
// ==================================================
export const exportToExcel = (
  residents: Resident[],
  filename: string = "residents"
) => {
  const exportData = residents.map((r) => ({
    "Serial No.": r.serialNo,
    Name: r.name,
    "Guardian's Name": r.guardianName,
    "Ward/House No": r.wardHouseNo,
    "House Name": r.houseName,
    "Gender/Age": r.genderAge,
    "Original Mobile": r.mobileNumber,
    "Phone Number": r.phoneNumber || "",
    Category: r.category || "",
    Remark: r.remark || "",
    "Visit Count": r.visitCount,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Residents");

  // Auto column widths
  worksheet["!cols"] = Object.keys(exportData[0]).map(() => ({ wch: 20 }));

  XLSX.writeFile(
    workbook,
    `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
  );
};
