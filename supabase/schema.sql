-- =============================================================
-- Mess Expense & Complaint Management System — Database Schema
-- =============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ----- Users (managed by Supabase Auth, but we reference auth.users) -----

-- ----- Expenses Table -----
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  amount numeric not null check (amount >= 0),
  category text not null check (category in ('groceries', 'dairy', 'utilities', 'maintenance', 'other')),
  expense_date timestamptz not null default now(),
  added_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  receipt_image_url text,
  receipt_storage_path text
);

-- ----- Complaints Table -----
create table public.complaints (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'acknowledged', 'resolved')),
  created_at timestamptz not null default now(),
  created_by_ip text,
  created_by_device text
);

-- ----- Comments Table -----
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  comment_text text not null,
  created_at timestamptz not null default now(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_role text not null default 'mess' check (author_role in ('mess'))
);

-- ----- Indexes -----
create index idx_expenses_date on public.expenses(expense_date desc);
create index idx_expenses_category on public.expenses(category);
create index idx_expenses_added_by on public.expenses(added_by);
create index idx_complaints_status on public.complaints(status);
create index idx_complaints_created_at on public.complaints(created_at desc);
create index idx_comments_complaint_id on public.comments(complaint_id);

-- ----- Row Level Security -----

-- Expenses: public read, authenticated write
alter table public.expenses enable row level security;

create policy "Expenses are viewable by everyone"
  on public.expenses for select
  using (true);

create policy "Authenticated users can insert expenses"
  on public.expenses for insert
  with check (auth.uid() is not null);

create policy "Users can update their own expenses"
  on public.expenses for update
  using (auth.uid() = added_by);

create policy "Users can delete their own expenses"
  on public.expenses for delete
  using (auth.uid() = added_by);

-- Complaints: public read and insert
alter table public.complaints enable row level security;

create policy "Complaints are viewable by everyone"
  on public.complaints for select
  using (true);

create policy "Anyone can create complaints"
  on public.complaints for insert
  with check (true);

create policy "Authenticated users can update complaint status"
  on public.complaints for update
  using (auth.uid() is not null);

-- Comments: public read, authenticated insert
alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Authenticated users can insert comments"
  on public.comments for insert
  with check (auth.uid() is not null);

-- ----- Storage Bucket -----
-- Run this in Supabase SQL editor or dashboard:
-- insert into storage.buckets (id, name, public) values ('mess-receipts', 'mess-receipts', true);

-- Storage policies
-- create policy "Public read access" on storage.objects for select using (bucket_id = 'mess-receipts');
-- create policy "Authenticated upload" on storage.objects for insert with check (bucket_id = 'mess-receipts' and auth.uid() is not null);
-- create policy "Authenticated delete" on storage.objects for delete using (bucket_id = 'mess-receipts' and auth.uid() is not null);

-- ----- Enable Realtime -----
alter publication supabase_realtime add table public.complaints;
alter publication supabase_realtime add table public.comments;
