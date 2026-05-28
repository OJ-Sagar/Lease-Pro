create extension if not exists "pgcrypto";

create type admin_role as enum ('owner', 'staff');
create type user_status as enum ('active', 'inactive');
create type risk_status as enum ('low', 'medium', 'high', 'blocked');
create type product_category as enum ('smartphone', 'tv', 'washing_machine', 'refrigerator', 'air_conditioner', 'other');
create type product_status as enum ('available', 'leased', 'returned', 'under_repair', 'damaged');
create type product_condition as enum ('new', 'excellent', 'good', 'fair', 'poor');
create type lease_status as enum ('active', 'completed', 'overdue', 'cancelled', 'repossessed');
create type late_fee_type as enum ('fixed', 'percentage');
create type payment_method as enum ('cash', 'bank_transfer', 'card', 'easypaisa', 'jazzcash', 'other');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role admin_role not null default 'staff',
  status user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  national_id text not null unique,
  address text,
  guarantor_name text,
  guarantor_phone text,
  guarantor_national_id text,
  notes text,
  risk_status risk_status not null default 'low',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  brand text not null,
  category product_category not null,
  serial_number text not null unique,
  purchase_cost numeric(14,2) not null check (purchase_cost >= 0),
  lease_price numeric(14,2) not null check (lease_price >= 0),
  current_status product_status not null default 'available',
  product_condition product_condition not null default 'good',
  warranty_expiry date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  lease_number text not null unique default ('LP-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  customer_id uuid not null references public.customers(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  lease_start_date date not null,
  lease_end_date date not null,
  monthly_installment numeric(14,2) not null check (monthly_installment > 0),
  total_payable_amount numeric(14,2) not null check (total_payable_amount > 0),
  down_payment numeric(14,2) not null default 0 check (down_payment >= 0),
  remaining_balance numeric(14,2) not null check (remaining_balance >= 0),
  payment_due_day int not null check (payment_due_day between 1 and 28),
  late_fee_type late_fee_type not null default 'fixed',
  late_fee_value numeric(14,2) not null default 0 check (late_fee_value >= 0),
  status lease_status not null default 'active',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.leases(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null,
  payment_method payment_method not null default 'cash',
  reference_number text,
  notes text,
  recorded_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical', 'success')),
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_customers_search on public.customers using gin (to_tsvector('simple', coalesce(full_name,'') || ' ' || coalesce(phone,'') || ' ' || coalesce(national_id,'')));
create index idx_products_search on public.products using gin (to_tsvector('simple', coalesce(product_name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(serial_number,'')));
create index idx_leases_customer on public.leases(customer_id);
create index idx_leases_product on public.leases(product_id);
create index idx_leases_status on public.leases(status);
create index idx_payments_lease on public.payments(lease_id);
create index idx_payments_date on public.payments(payment_date);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch before update on public.users for each row execute function public.touch_updated_at();
create trigger customers_touch before update on public.customers for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger leases_touch before update on public.leases for each row execute function public.touch_updated_at();

create or replace function public.create_lease_contract(payload jsonb)
returns public.leases language plpgsql security definer as $$
declare
  created public.leases;
begin
  if exists (
    select 1 from public.products
    where id = (payload->>'product_id')::uuid
      and current_status not in ('available', 'returned')
  ) then
    raise exception 'Product is not available for leasing';
  end if;

  insert into public.leases (
    customer_id, product_id, lease_start_date, lease_end_date, monthly_installment,
    total_payable_amount, down_payment, remaining_balance, payment_due_day,
    late_fee_type, late_fee_value, status
  )
  values (
    (payload->>'customer_id')::uuid,
    (payload->>'product_id')::uuid,
    (payload->>'lease_start_date')::date,
    (payload->>'lease_end_date')::date,
    (payload->>'monthly_installment')::numeric,
    (payload->>'total_payable_amount')::numeric,
    coalesce((payload->>'down_payment')::numeric, 0),
    (payload->>'remaining_balance')::numeric,
    (payload->>'payment_due_day')::int,
    coalesce((payload->>'late_fee_type')::late_fee_type, 'fixed'),
    coalesce((payload->>'late_fee_value')::numeric, 0),
    coalesce((payload->>'status')::lease_status, 'active')
  )
  returning * into created;

  update public.products set current_status = 'leased' where id = created.product_id;
  return created;
end;
$$;

create or replace function public.record_lease_payment(payload jsonb, actor_id uuid default null)
returns public.payments language plpgsql security definer as $$
declare
  lease_row public.leases;
  payment public.payments;
  new_balance numeric(14,2);
begin
  select * into lease_row from public.leases where id = (payload->>'lease_id')::uuid for update;
  if not found then
    raise exception 'Lease not found';
  end if;

  insert into public.payments (lease_id, customer_id, amount, payment_date, payment_method, reference_number, notes, recorded_by)
  values (
    lease_row.id,
    lease_row.customer_id,
    (payload->>'amount')::numeric,
    (payload->>'payment_date')::date,
    coalesce((payload->>'payment_method')::payment_method, 'cash'),
    payload->>'reference_number',
    payload->>'notes',
    actor_id
  )
  returning * into payment;

  new_balance := greatest(lease_row.remaining_balance - payment.amount, 0);
  update public.leases
  set remaining_balance = new_balance,
      status = case when new_balance = 0 then 'completed'::lease_status else status end
  where id = lease_row.id;

  if new_balance = 0 then
    update public.products set current_status = 'returned' where id = lease_row.product_id;
  end if;

  return payment;
end;
$$;

create view public.lease_contracts_overview as
select
  l.*,
  c.full_name as customer_name,
  c.phone as customer_phone,
  c.national_id as customer_national_id,
  p.product_name,
  p.brand as product_brand,
  p.category as product_category,
  p.serial_number as product_serial_number,
  coalesce(sum(pay.amount), 0) as paid_amount,
  greatest(l.total_payable_amount - coalesce(sum(pay.amount), 0) - l.down_payment, 0) as computed_remaining_balance,
  case
    when l.status in ('active', 'overdue') and make_date(extract(year from current_date)::int, extract(month from current_date)::int, l.payment_due_day) < current_date and l.remaining_balance > 0
      then (current_date - make_date(extract(year from current_date)::int, extract(month from current_date)::int, l.payment_due_day))::int
    else 0
  end as days_overdue
from public.leases l
join public.customers c on c.id = l.customer_id
join public.products p on p.id = l.product_id
left join public.payments pay on pay.lease_id = l.id
group by l.id, c.id, p.id;

create view public.customer_balances as
select
  c.*,
  count(l.id) filter (where l.status = 'active') as active_leases,
  count(l.id) filter (where l.status in ('completed', 'cancelled', 'repossessed')) as previous_leases,
  coalesce(sum(l.remaining_balance) filter (where l.status in ('active', 'overdue')), 0) as outstanding_balance,
  coalesce(sum(pay.amount), 0) as lifetime_paid
from public.customers c
left join public.leases l on l.customer_id = c.id
left join public.payments pay on pay.customer_id = c.id
where c.deleted_at is null
group by c.id;

create view public.customer_profiles as
select
  cb.*,
  coalesce(jsonb_agg(distinct to_jsonb(lco)) filter (where lco.id is not null), '[]'::jsonb) as leases,
  coalesce(jsonb_agg(distinct to_jsonb(pr)) filter (where pr.id is not null), '[]'::jsonb) as payment_history
from public.customer_balances cb
left join public.lease_contracts_overview lco on lco.customer_id = cb.id
left join (
  select p.*, l.lease_number from public.payments p join public.leases l on l.id = p.lease_id
) pr on pr.customer_id = cb.id
group by cb.id, cb.full_name, cb.phone, cb.national_id, cb.address, cb.guarantor_name, cb.guarantor_phone, cb.guarantor_national_id, cb.notes, cb.risk_status, cb.created_by, cb.created_at, cb.updated_at, cb.deleted_at, cb.active_leases, cb.previous_leases, cb.outstanding_balance, cb.lifetime_paid;

create view public.payment_records as
select
  p.*,
  l.lease_number,
  c.full_name as customer_name,
  c.phone as customer_phone
from public.payments p
join public.leases l on l.id = p.lease_id
join public.customers c on c.id = p.customer_id;

create view public.overdue_accounts as
select *
from public.lease_contracts_overview
where status in ('active', 'overdue') and remaining_balance > 0 and days_overdue > 0;

create view public.monthly_revenue as
select
  to_char(date_trunc('month', payment_date), 'YYYY-MM') as month_key,
  date_trunc('month', payment_date)::date as month_start,
  sum(amount) as revenue,
  count(*) as payment_count
from public.payments
group by 1, 2;

create view public.dashboard_metrics as
select
  coalesce((select sum(amount) from public.payments), 0) as total_revenue,
  coalesce((select sum(remaining_balance) from public.leases where status in ('active', 'overdue')), 0) as outstanding_amount,
  coalesce((select count(*) from public.leases where status = 'active'), 0) as active_leases,
  coalesce((select count(distinct customer_id) from public.overdue_accounts), 0) as overdue_customers,
  coalesce((select round(100.0 * count(*) filter (where current_status = 'leased') / nullif(count(*), 0), 2) from public.products where deleted_at is null), 0) as inventory_utilization,
  coalesce((select round(100.0 * sum(total_payable_amount - remaining_balance) / nullif(sum(total_payable_amount), 0), 2) from public.leases), 0) as collection_rate;

create or replace function public.monthly_revenue_trend(months_back int default 12)
returns table(month_key text, revenue numeric, payment_count bigint) language sql stable as $$
  select m.month_key, coalesce(r.revenue, 0), coalesce(r.payment_count, 0)
  from (
    select to_char(date_trunc('month', current_date) - (interval '1 month' * gs), 'YYYY-MM') as month_key
    from generate_series(months_back - 1, 0, -1) gs
  ) m
  left join public.monthly_revenue r using (month_key)
  order by m.month_key;
$$;

create or replace function public.payment_status_distribution()
returns table(status text, count bigint) language sql stable as $$
  select status::text, count(*) from public.leases group by status;
$$;

create or replace function public.category_leasing_trends(months_back int default 6)
returns table(month_key text, category text, lease_count bigint) language sql stable as $$
  select to_char(date_trunc('month', l.created_at), 'YYYY-MM'), p.category::text, count(*)
  from public.leases l
  join public.products p on p.id = l.product_id
  where l.created_at >= date_trunc('month', current_date) - (interval '1 month' * months_back)
  group by 1, 2
  order by 1, 2;
$$;

alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.leases enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;

create policy "Admins can read users" on public.users for select using (auth.uid() = id or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('owner', 'staff')));
create policy "Owners can manage users" on public.users for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'owner'));
create policy "Admins can manage customers" on public.customers for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.status = 'active'));
create policy "Admins can manage products" on public.products for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.status = 'active'));
create policy "Admins can manage leases" on public.leases for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.status = 'active'));
create policy "Admins can manage payments" on public.payments for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.status = 'active'));
create policy "Admins can read notifications" on public.notifications for select using (user_id is null or user_id = auth.uid());
create policy "Admins can update own notifications" on public.notifications for update using (user_id is null or user_id = auth.uid());
