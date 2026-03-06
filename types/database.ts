export type ExpenseCategory = 'groceries' | 'dairy' | 'utilities' | 'maintenance' | 'other';

export type ComplaintStatus = 'pending' | 'acknowledged' | 'resolved';

export type AuthorRole = 'mess' | 'admin' | 'viewer';

export type UserRole = 'viewer' | 'mess' | 'admin';

export interface UserProfile {
  id: string;
  email: string | null;
  role: UserRole;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  category: ExpenseCategory;
  expense_date: string;
  added_by: string;
  created_at: string;
  receipt_image_url: string | null;
  receipt_storage_path: string | null;
}

export interface ExpenseInsert {
  title: string;
  description?: string | null;
  amount: number;
  category: ExpenseCategory;
  expense_date: string;
  receipt_image_url?: string | null;
  receipt_storage_path?: string | null;
}

export interface ExpenseUpdate {
  title?: string;
  description?: string | null;
  amount?: number;
  category?: ExpenseCategory;
  expense_date?: string;
  receipt_image_url?: string | null;
  receipt_storage_path?: string | null;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  created_at: string;
  created_by_ip: string | null;
  created_by_device: string | null;
}

export interface ComplaintInsert {
  title: string;
  description: string;
  created_by_ip?: string | null;
  created_by_device?: string | null;
}

export interface Comment {
  id: string;
  complaint_id: string;
  parent_comment_id: string | null;
  comment_text: string;
  created_at: string;
  author_id: string | null;
  author_role: AuthorRole;
}

export interface CommentInsert {
  complaint_id: string;
  comment_text: string;
  parent_comment_id?: string | null;
}

export interface ExpenseFilters {
  category?: ExpenseCategory | 'all';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'expense_date' | 'amount' | 'title' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
