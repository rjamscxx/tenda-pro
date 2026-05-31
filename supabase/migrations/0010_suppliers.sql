-- Supplier management
create table if not exists suppliers (
  id           uuid primary key default gen_random_uuid(),
  venue_id     uuid not null references venues(id) on delete cascade,
  name         text not null,
  contact_name text,
  phone        text,
  email        text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists suppliers_venue_idx on suppliers(venue_id);

-- Link ingredients to suppliers (optional)
alter table ingredients
  add column if not exists supplier_id uuid references suppliers(id) on delete set null;

create index if not exists ingredients_supplier_idx on ingredients(supplier_id);
