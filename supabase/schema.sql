-- =============================================================
-- Mess Expense & Complaint Management System — Database Schema
-- =============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- =============================================================
-- USERS TABLE (mirrors auth.users, source of truth for roles)
-- =============================================================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'viewer' check (role in ('viewer', 'mess', 'admin')),
  created_at timestamptz not null default now()
);

-- Trigger: auto-create public.users row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS for users table
alter table public.users enable row level security;

create policy "Users can view all profiles"
  on public.users for select
  using (true);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- ----- Expenses Table -----
create table if not exists public.expenses (
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
create table if not exists public.complaints (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'acknowledged', 'resolved')),
  created_at timestamptz not null default now(),
  created_by_ip text,
  created_by_device text
);

-- ----- Comments Table -----
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  comment_text text not null,
  created_at timestamptz not null default now(),
  author_id uuid references auth.users(id) on delete set null,  -- nullable for anonymous viewers
  author_role text not null default 'viewer' check (author_role in ('mess', 'admin', 'viewer'))
);

-- ----- Indexes -----
create index if not exists idx_expenses_date on public.expenses(expense_date desc);
create index if not exists idx_expenses_category on public.expenses(category);
create index if not exists idx_expenses_added_by on public.expenses(added_by);
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_complaints_created_at on public.complaints(created_at desc);
create index if not exists idx_comments_complaint_id on public.comments(complaint_id);
create index if not exists idx_comments_parent_id on public.comments(parent_comment_id);
create index if not exists idx_users_role on public.users(role);

-- =============================================================
-- Push Notification Subscriptions
-- =============================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage their own push subscriptions"
  on public.push_subscriptions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================
-- Row Level Security
-- =============================================================

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

-- Complaints: public read and insert, admin can delete
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

create policy "Admins can delete complaints"
  on public.complaints for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Comments: public read, anyone can insert (viewers anonymous), admin can delete
alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Anyone can insert comments"
  on public.comments for insert
  with check (true);

create policy "Admins can delete any comment"
  on public.comments for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

-- =============================================================
-- Storage Bucket (run once in Supabase SQL editor)
-- =============================================================
insert into storage.buckets (id, name, public)
values ('mess-receipts', 'mess-receipts', true)
on conflict (id) do nothing;

create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'mess-receipts');

create policy "Authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'mess-receipts' and auth.uid() is not null);

create policy "Authenticated delete"
  on storage.objects for delete
  using (bucket_id = 'mess-receipts' and auth.uid() is not null);

-- =============================================================
-- Enable Realtime
-- =============================================================
alter publication supabase_realtime add table public.complaints;
alter publication supabase_realtime add table public.comments;

-- =============================================================
-- MIGRATION: Run these if upgrading an existing database
-- =============================================================
-- Step 1: Create users table and backfill from auth.users
--   insert into public.users (id, email, role)
--   select id, email, coalesce(raw_user_meta_data->>'role', 'viewer')
--   from auth.users
--   on conflict (id) do nothing;
--
-- Step 2: Promote existing mess managers (authenticated users who should be 'mess' role)
--   update public.users set role = 'mess' where id = '<user-uuid>';
--
-- Step 3: Promote admins
--   update public.users set role = 'admin' where id = '<admin-uuid>';
--
-- Step 4: Add parent_comment_id column if upgrading comments table
--   alter table public.comments add column if not exists
--     parent_comment_id uuid references public.comments(id) on delete cascade;
--
-- Step 5: Make author_id nullable (anonymous viewer comments)
--   alter table public.comments alter column author_id drop not null;
--
-- Step 6: Update author_role check constraint to include 'viewer' and 'admin'
--   alter table public.comments drop constraint if exists comments_author_role_check;
--   alter table public.comments add constraint comments_author_role_check
--     check (author_role in ('mess', 'admin', 'viewer'));
