import * as XLSX from 'xlsx';
import { Resident } from '@/types/resident';

export const parseExcelFile = (file: File): Promise<Resident[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const residents: Resident[] = jsonData.map((row: any, index: number) => {
          // Handle various possible column name formats
          const serialNo = row['Serial No.'] || row['Serial No'] || row['S.No'] || row['SNo'] || index + 1;
          const name = row['Name'] || row['name'] || '';
          const guardianName = row["Guardian's Name"] || row['Guardian Name'] || row['Guardian'] || '';
          const wardHouseNo = row['Old Ward No/House No'] || row['Ward No'] || row['House No'] || row['Ward/House No'] || '';
          const houseName = row['House Name'] || row['House'] || '';
          const genderAge = row['Gender/Age'] || row['Gender'] || row['Age'] || '';
          const mobileNumber = row['Mobile Number'] || row['Mobile'] || row['Original Mobile'] || '';
          const phoneNumber = row['Phone Number'] || row['Phone'] || '';
          const visitCount = parseInt(String(row['Visit Count'] || '0')) || 0;
          const category = row['Category'] || '';
          const remark = row['Remark'] || '';

          return {
            id: `resident-${Date.now()}-${index}`,
            serialNo,
            name: String(name),
            guardianName: String(guardianName),
            wardHouseNo: String(wardHouseNo),
            houseName: String(houseName),
            genderAge: String(genderAge),
            mobileNumber: String(mobileNumber),
            phoneNumber: String(phoneNumber),
            visitCount,
            category: String(category),
            remark: String(remark),
          };
        });

        resolve(residents);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
};

export const exportToExcel = (residents: Resident[], filename: string = 'residents') => {
  const exportData = residents.map((resident) => ({
    'Serial No.': resident.serialNo,
    'Name': resident.name,
    "Guardian's Name": resident.guardianName,
    'Ward/House No': resident.wardHouseNo,
    'House Name': resident.houseName,
    'Gender/Age': resident.genderAge,
    'Original Mobile': resident.mobileNumber,
    'Phone Number': resident.phoneNumber || '',
    'Visit Count': resident.visitCount,
    'Category': resident.category || '',
    'Remark': resident.remark || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Residents');

  // Auto-size columns
  const maxWidth = 20;
  const columnWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: maxWidth }));
  worksheet['!cols'] = columnWidths;

  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
