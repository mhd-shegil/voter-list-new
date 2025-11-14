export interface Resident {
  id: string;
  serialNo: string | number;
  name: string;
  guardianName: string;
  wardHouseNo: string;
  houseName: string;
  genderAge: string;
  mobileNumber: string;
  phoneNumber?: string;
  visitCount: number;
  category?: string;
  remark?: string;
}
