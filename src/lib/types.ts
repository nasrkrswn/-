export type UserRole = "employee" | "supervisor" | "manager" | "admin";

export type AttendanceStatus =
  | "present"
  | "late"
  | "absent"
  | "leave"
  | "early_leave"
  | "incomplete";

export type RequestType = "absence" | "leave" | "correction";

export type RequestStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  department_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type Department = {
  id: string;
  name: string;
  manager_id: string | null;
  created_at: string;
  updated_at: string | null;
};

export type WorkLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type Shift = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
  active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type AttendanceRecord = {
  id: string;
  user_id: string;
  work_location_id: string | null;
  shift_id: string | null;
  check_in_time: string;
  check_out_time: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export type AttendanceRequest = {
  id: string;
  user_id: string;
  request_type: RequestType;
  target_date: string;
  reason: string;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export type ReportRow = {
  employeeName: string;
  departmentName: string;
  locationName: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  notes: string;
};
