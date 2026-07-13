export interface Student extends Record<string, unknown> {
  id: number;
  name: string;
  last_name: string;
}

export interface StudentInfo extends Record<string, unknown> {
  id: number;
  name: string;
  last_name: string;
  middle_name?: string;
  faculty?: string;
  direction?: string;
  passport?: string;
  group?: string;
  course?: string;
  gender?: string;
  phone?: string;
  picture?: string;
}

export interface Payment extends Record<string, unknown> {
  id: number;
  student?: Student;
  student_info?: StudentInfo;
  amount: number;
  paid_date: string;
  valid_until: string;
  method: "Cash" | "Card";
  status: string;
  comment?: string;
}
