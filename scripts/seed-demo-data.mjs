import pg from 'pg';

const { Client } = pg;

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('Missing SUPABASE_DB_URL. Set it to your Supabase Postgres connection string.');
  process.exit(1);
}

const customers = [
  ['Hassan Malik', '+92 300 7001001', 'DEMO-35202-0001', 'Johar Town, Lahore', 'Imran Malik', '+92 300 8001001', 'low'],
  ['Maham Ali', '+92 300 7001002', 'DEMO-42101-0002', 'Clifton, Karachi', 'Ayesha Ali', '+92 300 8001002', 'medium'],
  ['Zain Qureshi', '+92 300 7001003', 'DEMO-61101-0003', 'Blue Area, Islamabad', 'Tariq Qureshi', '+92 300 8001003', 'low'],
  ['Nimra Shah', '+92 300 7001004', 'DEMO-37405-0004', 'Cantt, Multan', 'Farah Shah', '+92 300 8001004', 'high'],
  ['Arham Siddiqui', '+92 300 7001005', 'DEMO-42201-0005', 'DHA, Karachi', 'Sameer Siddiqui', '+92 300 8001005', 'medium'],
  ['Iqra Rauf', '+92 300 7001006', 'DEMO-33100-0006', 'Madina Town, Faisalabad', 'Rauf Ahmed', '+92 300 8001006', 'low'],
  ['Danish Sheikh', '+92 300 7001007', 'DEMO-17301-0007', 'University Road, Peshawar', 'Noman Sheikh', '+92 300 8001007', 'high'],
  ['Areeba Noor', '+92 300 7001008', 'DEMO-35201-0008', 'Wapda Town, Lahore', 'Sana Noor', '+92 300 8001008', 'low'],
  ['Kamran Butt', '+92 300 7001009', 'DEMO-61102-0009', 'Bahria Town, Rawalpindi', 'Asif Butt', '+92 300 8001009', 'medium'],
  ['Sobia Tariq', '+92 300 7001010', 'DEMO-42102-0010', 'Gulistan-e-Johar, Karachi', 'Tariq Mahmood', '+92 300 8001010', 'low'],
  ['Bilal Anwar', '+92 300 7001011', 'DEMO-35203-0011', 'Askari, Lahore', 'Anwar Iqbal', '+92 300 8001011', 'blocked'],
  ['Mehwish Khan', '+92 300 7001012', 'DEMO-61103-0012', 'G-11, Islamabad', 'Sadia Khan', '+92 300 8001012', 'medium']
];

const products = [
  ['Galaxy S24 Ultra', 'Samsung', 'smartphone', 'DEMO-SAM-S24U-001', 340000, 420000, 'excellent'],
  ['iPhone 14', 'Apple', 'smartphone', 'DEMO-APL-IP14-002', 245000, 310000, 'good'],
  ['Redmi Note 13 Pro', 'Xiaomi', 'smartphone', 'DEMO-XIA-RN13-003', 88000, 126000, 'new'],
  ['OLED 65 inch TV', 'LG', 'tv', 'DEMO-LG-TV65-004', 310000, 390000, 'excellent'],
  ['LED 43 inch TV', 'TCL', 'tv', 'DEMO-TCL-TV43-005', 105000, 145000, 'good'],
  ['Smart TV 50 inch', 'Haier', 'tv', 'DEMO-HAI-TV50-006', 135000, 178000, 'new'],
  ['Top Load Washer', 'Dawlance', 'washing_machine', 'DEMO-DAW-WM-007', 98000, 138000, 'good'],
  ['Front Load Washer', 'Samsung', 'washing_machine', 'DEMO-SAM-WM-008', 155000, 210000, 'excellent'],
  ['Twin Tub Washer', 'Super Asia', 'washing_machine', 'DEMO-SA-WM-009', 62000, 92000, 'fair'],
  ['Double Door Refrigerator', 'PEL', 'refrigerator', 'DEMO-PEL-REF-010', 128000, 172000, 'good'],
  ['No Frost Refrigerator', 'Orient', 'refrigerator', 'DEMO-ORI-REF-011', 158000, 206000, 'new'],
  ['Side by Side Refrigerator', 'Samsung', 'refrigerator', 'DEMO-SAM-REF-012', 420000, 520000, 'excellent'],
  ['Split AC 1 Ton', 'Gree', 'air_conditioner', 'DEMO-GRE-AC1-013', 128000, 174000, 'good'],
  ['Split AC 1.5 Ton', 'Dawlance', 'air_conditioner', 'DEMO-DAW-AC15-014', 172000, 228000, 'excellent'],
  ['Inverter AC 2 Ton', 'Kenwood', 'air_conditioner', 'DEMO-KEN-AC2-015', 245000, 318000, 'new'],
  ['Galaxy A55', 'Samsung', 'smartphone', 'DEMO-SAM-A55-016', 126000, 172000, 'good'],
  ['QLED 55 inch TV', 'TCL', 'tv', 'DEMO-TCL-Q55-017', 210000, 275000, 'excellent'],
  ['Compact Refrigerator', 'Waves', 'refrigerator', 'DEMO-WAV-REF-018', 78000, 112000, 'fair']
];

const leases = [
  { customerId: 'DEMO-35202-0001', serial: 'DEMO-SAM-S24U-001', startOffset: -150, months: 12, monthly: 35000, total: 420000, down: 70000, dueDay: 4, payments: [35000, 35000, 18000] },
  { customerId: 'DEMO-42101-0002', serial: 'DEMO-APL-IP14-002', startOffset: -90, months: 10, monthly: 31000, total: 310000, down: 62000, dueDay: 8, payments: [31000, 12000] },
  { customerId: 'DEMO-61101-0003', serial: 'DEMO-LG-TV65-004', startOffset: -210, months: 13, monthly: 30000, total: 390000, down: 90000, dueDay: 12, payments: [30000, 30000, 30000, 30000] },
  { customerId: 'DEMO-37405-0004', serial: 'DEMO-TCL-TV43-005', startOffset: -70, months: 8, monthly: 18000, total: 145000, down: 25000, dueDay: 3, payments: [9000] },
  { customerId: 'DEMO-42201-0005', serial: 'DEMO-SAM-WM-008', startOffset: -130, months: 10, monthly: 21000, total: 210000, down: 42000, dueDay: 14, payments: [21000, 21000, 21000] },
  { customerId: 'DEMO-33100-0006', serial: 'DEMO-ORI-REF-011', startOffset: -45, months: 10, monthly: 20600, total: 206000, down: 41000, dueDay: 20, payments: [20600] },
  { customerId: 'DEMO-17301-0007', serial: 'DEMO-GRE-AC1-013', startOffset: -110, months: 9, monthly: 19300, total: 174000, down: 24000, dueDay: 5, payments: [] },
  { customerId: 'DEMO-35201-0008', serial: 'DEMO-KEN-AC2-015', startOffset: -35, months: 12, monthly: 26500, total: 318000, down: 62000, dueDay: 22, payments: [26500] },
  { customerId: 'DEMO-61102-0009', serial: 'DEMO-TCL-Q55-017', startOffset: -80, months: 11, monthly: 25000, total: 275000, down: 50000, dueDay: 11, payments: [25000, 15000] },
  { customerId: 'DEMO-42102-0010', serial: 'DEMO-SAM-A55-016', startOffset: -55, months: 8, monthly: 21500, total: 172000, down: 32000, dueDay: 18, payments: [21500] }
];

function isoDate(offsetDays) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

await client.connect();

try {
  await client.query('begin');

  for (const customer of customers) {
    await client.query(
      `insert into public.customers (
        full_name, phone, national_id, address, guarantor_name, guarantor_phone, guarantor_national_id, notes, risk_status
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      on conflict (national_id) do update set
        full_name = excluded.full_name,
        phone = excluded.phone,
        address = excluded.address,
        guarantor_name = excluded.guarantor_name,
        guarantor_phone = excluded.guarantor_phone,
        risk_status = excluded.risk_status`,
      [customer[0], customer[1], customer[2], customer[3], customer[4], customer[5], `${customer[2]}-G`, 'Generated demo portfolio record.', customer[6]]
    );
  }

  for (const product of products) {
    await client.query(
      `insert into public.products (
        product_name, brand, category, serial_number, purchase_cost, lease_price, current_status, product_condition, warranty_expiry
      ) values ($1,$2,$3,$4,$5,$6,'available',$7,current_date + interval '14 months')
      on conflict (serial_number) do update set
        product_name = excluded.product_name,
        brand = excluded.brand,
        category = excluded.category,
        purchase_cost = excluded.purchase_cost,
        lease_price = excluded.lease_price,
        product_condition = excluded.product_condition`,
      product
    );
  }

  for (const lease of leases) {
    const existing = await client.query(
      `select l.id
       from public.leases l
       join public.customers c on c.id = l.customer_id
       join public.products p on p.id = l.product_id
       where c.national_id = $1 and p.serial_number = $2`,
      [lease.customerId, lease.serial]
    );

    if (existing.rowCount > 0) continue;

    const ids = await client.query(
      `select
        (select id from public.customers where national_id = $1) as customer_id,
        (select id from public.products where serial_number = $2) as product_id`,
      [lease.customerId, lease.serial]
    );

    const payload = {
      customer_id: ids.rows[0].customer_id,
      product_id: ids.rows[0].product_id,
      lease_start_date: isoDate(lease.startOffset),
      lease_end_date: isoDate(lease.startOffset + lease.months * 30),
      monthly_installment: lease.monthly,
      total_payable_amount: lease.total,
      down_payment: lease.down,
      remaining_balance: lease.total - lease.down,
      payment_due_day: lease.dueDay,
      late_fee_type: 'fixed',
      late_fee_value: 1500,
      status: 'active'
    };

    const created = await client.query('select id from public.create_lease_contract($1::jsonb)', [payload]);
    const leaseId = created.rows[0].id;

    for (const [index, amount] of lease.payments.entries()) {
      await client.query(
        'select public.record_lease_payment($1::jsonb, null)',
        [{
          lease_id: leaseId,
          amount,
          payment_date: isoDate(lease.startOffset + 30 * (index + 1)),
          payment_method: index % 2 === 0 ? 'cash' : 'bank_transfer',
          reference_number: `DEMO-PAY-${leaseId.slice(0, 8)}-${index + 1}`,
          notes: 'Generated demo payment'
        }]
      );
    }
  }

  await client.query('commit');
  console.log('Demo data seeded.');
} catch (error) {
  await client.query('rollback');
  throw error;
} finally {
  await client.end();
}
