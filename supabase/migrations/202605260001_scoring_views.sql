create or replace view public.customer_performance as
select
  cb.*,
  coalesce(stats.total_leases, 0) as total_leases,
  coalesce(stats.completed_leases, 0) as completed_leases,
  coalesce(stats.completed_on_time_leases, 0) as completed_on_time_leases,
  coalesce(stats.late_payment_count, 0) as late_payment_count,
  coalesce(stats.on_time_payment_count, 0) as on_time_payment_count,
  coalesce(stats.payment_count, 0) as payment_count,
  coalesce(stats.overdue_active_leases, 0) as overdue_active_leases,
  round(
    greatest(
      1,
      least(
        10,
        7
        + (coalesce(stats.completed_on_time_leases, 0) * 0.6)
        + (coalesce(stats.on_time_payment_count, 0) * 0.12)
        - (coalesce(stats.late_payment_count, 0) * 0.8)
        - (coalesce(stats.overdue_active_leases, 0) * 1.5)
        - case when cb.risk_status = 'high' then 1.2 when cb.risk_status = 'blocked' then 3 else 0 end
      )
    )::numeric,
    1
  ) as customer_rating,
  case
    when coalesce(stats.overdue_active_leases, 0) > 0 or cb.risk_status in ('high', 'blocked') then 'Watchlist'
    when coalesce(stats.completed_on_time_leases, 0) >= 2 and coalesce(stats.late_payment_count, 0) = 0 then 'Preferred'
    when coalesce(stats.late_payment_count, 0) > 1 then 'Caution'
    else 'Standard'
  end as leasing_grade
from public.customer_balances cb
left join (
  select
    l.customer_id,
    count(distinct l.id) as total_leases,
    count(distinct l.id) filter (where l.status = 'completed') as completed_leases,
    count(distinct l.id) filter (
      where l.status = 'completed'
        and not exists (
          select 1 from public.payments lp
          where lp.lease_id = l.id
            and extract(day from lp.payment_date)::int > l.payment_due_day
        )
    ) as completed_on_time_leases,
    count(p.id) as payment_count,
    count(p.id) filter (where extract(day from p.payment_date)::int <= l.payment_due_day) as on_time_payment_count,
    count(p.id) filter (where extract(day from p.payment_date)::int > l.payment_due_day) as late_payment_count,
    count(distinct l.id) filter (
      where l.status in ('active', 'overdue')
        and l.remaining_balance > 0
        and make_date(extract(year from current_date)::int, extract(month from current_date)::int, l.payment_due_day) < current_date
    ) as overdue_active_leases
  from public.leases l
  left join public.payments p on p.lease_id = l.id
  group by l.customer_id
) stats on stats.customer_id = cb.id;

create or replace view public.product_performance as
select
  p.*,
  coalesce(stats.total_leases, 0) as total_leases,
  coalesce(stats.active_leases, 0) as active_leases,
  coalesce(stats.completed_leases, 0) as completed_leases,
  coalesce(stats.total_collected, 0) as total_collected,
  coalesce(stats.total_contract_value, 0) as total_contract_value,
  round(
    greatest(
      1,
      least(
        10,
        4
        + (coalesce(stats.total_leases, 0) * 0.9)
        + (coalesce(stats.completed_leases, 0) * 0.4)
        + case when p.current_status = 'leased' then 1 else 0 end
        - case when p.current_status in ('damaged', 'under_repair') then 2 else 0 end
      )
    )::numeric,
    1
  ) as product_rating,
  case
    when coalesce(stats.total_leases, 0) >= 3 and p.current_status <> 'damaged' then 'High Demand'
    when p.current_status in ('damaged', 'under_repair') then 'Service Risk'
    when coalesce(stats.total_leases, 0) = 0 then 'Unleased'
    else 'Stable'
  end as sales_grade
from public.products p
left join (
  select
    l.product_id,
    count(*) as total_leases,
    count(*) filter (where l.status = 'active') as active_leases,
    count(*) filter (where l.status = 'completed') as completed_leases,
    sum(l.total_payable_amount) as total_contract_value,
    coalesce(sum(payments.total_paid), 0) as total_collected
  from public.leases l
  left join (
    select lease_id, sum(amount) as total_paid
    from public.payments
    group by lease_id
  ) payments on payments.lease_id = l.id
  group by l.product_id
) stats on stats.product_id = p.id;
