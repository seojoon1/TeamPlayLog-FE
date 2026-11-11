/** BE(app/schemas.py) 응답 형식과 맞춘 타입. 시각은 ISO 8601 UTC 문자열. */

export type MemberRole = 'LEADER' | 'MEMBER';
export type TaskStatus = 'TODO' | 'DOING' | 'DONE' | 'OVERDUE';
export type RecordType = 'OUTPUT' | 'MEETING' | 'COORDINATION' | 'REVIEW';
export type RecordStatus = 'PENDING' | 'CONFIRMED' | 'ON_HOLD' | 'RECHECK' | 'UNCONFIRMED' | 'WITHDRAWN';
export type RejectReason = 'NO_OUTPUT' | 'MISMATCH' | 'OTHER';

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface Me {
  id: string;
  email: string;
  display_name: string;
  department: string | null;
}

export interface Member {
  member_id: string;
  user_id: string;
  display_name: string;
  role: MemberRole;
  left: boolean;
}

export interface TeamSummary {
  id: string;
  course_name: string;
  project_name: string;
  final_due_at: string;
  member_count: number;
  my_role: MemberRole;
}

export interface Team extends TeamSummary {
  max_members: number;
  invite_code: string | null;
  invite_expires_at: string | null;
  members: Member[];
  agreement_confirmed: boolean;
  tasks_total: number;
  tasks_done: number;
}

export interface Task {
  id: string;
  title: string;
  due_at: string;
  status: TaskStatus;
  memo: string | null;
  for_everyone: boolean;
  assignees: Member[];
  record_count: number;
  confirmed_record_count: number;
  completed_at: string | null;
}

export interface Board {
  final_due_at: string;
  d_day: number;
  tasks_total: number;
  tasks_done: number;
  agreement_confirmed: boolean;
  tasks: Task[];
}

export interface Confirmation {
  reviewer_id: string;
  reviewer_name: string;
  decision: 'CONFIRM' | 'REJECT';
  reason_type: RejectReason | null;
  reason_text: string | null;
  valid: boolean;
  created_at: string;
}

export interface RecordItem {
  id: string;
  task_id: string | null;
  task_title: string | null;
  author_id: string;
  author_name: string;
  type: RecordType;
  link_url: string | null;
  file_key: string | null;
  note: string | null;
  has_output: boolean;
  is_late: boolean;
  status: RecordStatus;
  confirmations: Confirmation[];
  revision_count: number;
  created_at: string;
}

export interface TaskEvent {
  kind: 'DUE_CHANGED' | 'ASSIGNEES_CHANGED' | 'STATUS_CHANGED' | string;
  actor_member_id: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  created_at: string;
}

export interface TaskDetail extends Task {
  events: TaskEvent[];
}

export interface Page<T> {
  items: T[];
  next_cursor: string | null;
}

export type AgreementStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'SUPERSEDED';

export interface Agreement {
  id: string;
  version: number;
  status: AgreementStatus;
  reply_hours: number;
  meeting_rule: string | null;
  free_rules: string[];
  roles: { member_id: string; role_name: string }[];
  tasks: { assignee_member_id: string; title: string; due_at: string }[];
  consents: { member_id: string; display_name: string; agreed: boolean | null; change_request: string | null; responded_at: string | null }[];
  confirmed_at: string | null;
}

export interface AgreementHistory {
  current: Agreement | null;
  versions: Agreement[];
}

export type NotificationKind =
  | 'AGREEMENT_CONSENT'
  | 'TASK_ASSIGNED'
  | 'CONFIRM_REQUEST'
  | 'RECORD_REJECTED'
  | 'MUTUAL_CONFIRM_WARNING'
  | 'DUE_SOON'
  | 'OVERDUE'
  | 'REPORT_VIEW_REQUEST';

export interface AppNotification {
  id: string;
  team_id: string | null;
  kind: NotificationKind;
  title: string;
  body: string;
  payload: { screen?: string; team_id?: string; task_id?: string; record_id?: string; report_id?: string };
  created_at: string;
  read_at: string | null;
}

export interface ReportEntry {
  record_id: string;
  date: string;
  task: string | null;
  note: string | null;
  link: string | null;
  file: string | null;
  late: boolean;
  no_output: boolean;
  status: RecordStatus;
  confirmed_by: string[];
}

export interface ReportMember {
  member_id: string;
  name: string;
  left: boolean;
  confirmed: Record<RecordType, ReportEntry[]>;
  unconfirmed: Record<RecordType, ReportEntry[]>;
}

export interface Report {
  id: string;
  serial_no: string;
  status: 'DRAFT' | 'SUBMITTED';
  period_from: string;
  period_to: string;
  created_at: string;
  submitted_at: string | null;
  content: {
    notice: string;
    members: ReportMember[];
    agreement: { version: number; roles: { name: string; role: string }[] } | null;
  };
  views: { member_id: string; display_name: string; viewed_at: string | null; objection: string | null }[];
  can_submit: boolean;
  submit_blocked_reason: string | null;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: { field: string | null; reason: string }[];
}
