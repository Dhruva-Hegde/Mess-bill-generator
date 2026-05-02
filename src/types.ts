export type MemberType = 'student' | 'job';
export type ExpenseCategory = 'commonMess' | 'common' | 'mess';

export interface Member {
  id: string;
  name: string;
  type: MemberType;
  daysStayed: number;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: ExpenseCategory;
  isIncome?: boolean;
}

export interface AppSettings {
  president: string;
  secretary: string;
  studentRent: number;
  jobRent: number;
  month: string;
}

export interface BillStats {
  totalCommonMess: number;
  totalCommon: number;
  totalMess: number;
  totalDays: number;
  commonMessPerHead: number;
  commonPerHead: number;
  messPerDay: number;
  memberBills: (Member & {
    commonMessBill: number;
    commonBill: number;
    messBill: number;
    rent: number;
    totalBill: number;
  })[];
  grandTotal: number;
}
