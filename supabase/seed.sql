insert into public.customers (
  full_name,
  phone,
  national_id,
  address,
  guarantor_name,
  guarantor_phone,
  guarantor_national_id,
  notes,
  risk_status
) values
  ('Adeel Khan', '+92 300 1111111', '35202-1234567-1', 'Model Town, Lahore', 'Bilal Khan', '+92 300 2222222', '35202-7654321-1', 'Reliable payer with stable job.', 'low'),
  ('Sara Ahmed', '+92 301 3333333', '42101-2222222-2', 'Gulshan-e-Iqbal, Karachi', 'Nadia Ahmed', '+92 301 4444444', '42101-3333333-3', 'Prefers bank transfer.', 'medium'),
  ('Usman Raza', '+92 302 5555555', '61101-4444444-4', 'Satellite Town, Rawalpindi', 'Hassan Raza', '+92 302 6666666', '61101-5555555-5', 'Watch closely after prior late payment.', 'high')
on conflict (national_id) do nothing;

insert into public.products (
  product_name,
  brand,
  category,
  serial_number,
  purchase_cost,
  lease_price,
  current_status,
  product_condition,
  warranty_expiry
) values
  ('iPhone 15 Pro', 'Apple', 'smartphone', 'LP-APL-15P-0001', 385000, 455000, 'available', 'excellent', current_date + interval '10 months'),
  ('55 inch Crystal UHD TV', 'Samsung', 'tv', 'LP-SAM-TV-0001', 180000, 232000, 'available', 'new', current_date + interval '16 months'),
  ('Inverter Refrigerator', 'Dawlance', 'refrigerator', 'LP-DAW-REF-0001', 145000, 188000, 'available', 'good', current_date + interval '8 months'),
  ('Split AC 1.5 Ton', 'Haier', 'air_conditioner', 'LP-HAI-AC-0001', 165000, 216000, 'available', 'excellent', current_date + interval '14 months'),
  ('Front Load Washing Machine', 'LG', 'washing_machine', 'LP-LG-WM-0001', 135000, 176000, 'under_repair', 'fair', current_date + interval '5 months')
on conflict (serial_number) do nothing;

do $$
declare
  adeel uuid;
  sara uuid;
  iphone uuid;
  tv uuid;
  lease_one public.leases;
  lease_two public.leases;
begin
  select id into adeel from public.customers where national_id = '35202-1234567-1';
  select id into sara from public.customers where national_id = '42101-2222222-2';
  select id into iphone from public.products where serial_number = 'LP-APL-15P-0001';
  select id into tv from public.products where serial_number = 'LP-SAM-TV-0001';

  if not exists (select 1 from public.leases where customer_id = adeel and product_id = iphone) then
    select * into lease_one from public.create_lease_contract(jsonb_build_object(
      'customer_id', adeel,
      'product_id', iphone,
      'lease_start_date', current_date - interval '65 days',
      'lease_end_date', current_date + interval '300 days',
      'monthly_installment', 36000,
      'total_payable_amount', 455000,
      'down_payment', 95000,
      'remaining_balance', 360000,
      'payment_due_day', 5,
      'late_fee_type', 'fixed',
      'late_fee_value', 1500,
      'status', 'active'
    ));

    perform public.record_lease_payment(jsonb_build_object(
      'lease_id', lease_one.id,
      'amount', 36000,
      'payment_date', current_date - interval '35 days',
      'payment_method', 'cash',
      'reference_number', 'CASH-1001',
      'notes', 'First installment'
    ));
  end if;

  if not exists (select 1 from public.leases where customer_id = sara and product_id = tv) then
    select * into lease_two from public.create_lease_contract(jsonb_build_object(
      'customer_id', sara,
      'product_id', tv,
      'lease_start_date', current_date - interval '95 days',
      'lease_end_date', current_date + interval '265 days',
      'monthly_installment', 22000,
      'total_payable_amount', 232000,
      'down_payment', 34000,
      'remaining_balance', 198000,
      'payment_due_day', 10,
      'late_fee_type', 'fixed',
      'late_fee_value', 1200,
      'status', 'active'
    ));

    perform public.record_lease_payment(jsonb_build_object(
      'lease_id', lease_two.id,
      'amount', 15000,
      'payment_date', current_date - interval '42 days',
      'payment_method', 'bank_transfer',
      'reference_number', 'BT-2001',
      'notes', 'Partial installment'
    ));
  end if;
end $$;
