-- GoCheck Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Jobs table
create table if not exists public.jobs (
  id uuid default uuid_generate_v4() primary key,
  status text not null default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  files jsonb default '[]'::jsonb,
  results jsonb default null,
  progress jsonb default '[]'::jsonb,
  error text
);

-- Enable Realtime on jobs table
alter publication supabase_realtime add table public.jobs;

-- Enable RLS
alter table public.jobs enable row level security;

-- Policy: anyone can read/write (lock down properly in production)
create policy "Allow all operations" on public.jobs
  for all using (true) with check (true);

-- Storage bucket for document uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  52428800,  -- 50MB max
  array['application/pdf', 'application/octet-stream']
)
on conflict (id) do nothing;

-- Storage policies
create policy "Allow uploads to documents bucket"
  on storage.objects for insert
  with check (bucket_id = 'documents');

create policy "Allow reads from documents bucket"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "Allow deletes from documents bucket"
  on storage.objects for delete
  using (bucket_id = 'documents');

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_jobs_updated
  before update on public.jobs
  for each row execute procedure public.handle_updated_at();
