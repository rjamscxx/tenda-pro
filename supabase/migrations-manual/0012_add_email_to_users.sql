-- Add email column to users table
alter table users add column if not exists email text;

-- Backfill existing rows from auth.users
update users u
set email = au.email
from auth.users au
where au.id = u.id;

create index if not exists users_email_idx on users(email);
