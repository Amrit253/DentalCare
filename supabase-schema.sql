-- Run this script in Supabase Dashboard > SQL Editor.
-- Appointment records are only accessed by Netlify Functions using the service-role key.
create table if not exists public.appointments (
  id bigint generated always as identity primary key,
  reference text not null unique,
  name text not null,
  phone text not null,
  email text,
  treatment text not null,
  preferred_date date,
  message text,
  status text not null default 'new'
    check (status in ('new','contacted','confirmed','completed','cancelled')),
  consent boolean not null default false,
  source text not null default 'website',
  created_at timestamptz not null default now()
);

create index if not exists appointments_created_at_idx
  on public.appointments (created_at desc);
create index if not exists appointments_status_idx
  on public.appointments (status);

-- Enable RLS and intentionally create no public policies.
-- Anonymous website visitors cannot read or change appointment records.
alter table public.appointments enable row level security;
