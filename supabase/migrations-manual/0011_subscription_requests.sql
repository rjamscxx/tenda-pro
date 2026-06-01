-- Subscription requests from users who want to upgrade to Pro
create table if not exists subscription_requests (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  phone       text not null,
  email       text not null,
  billing     text not null check (billing in ('monthly', 'annual')),
  receipt_url text,
  status      text not null default 'pending' check (status in ('pending', 'activated', 'rejected')),
  created_at  timestamptz not null default now()
);

create index if not exists subscription_requests_status_idx on subscription_requests(status, created_at desc);
