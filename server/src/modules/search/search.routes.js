import { Router } from 'express';
import { supabase } from '../../config/supabase.js';
import { asyncHandler } from '../../middleware/error.js';

export const searchRouter = Router();

searchRouter.get('/', asyncHandler(async (req, res) => {
  const term = String(req.query.q || '').trim();
  if (term.length < 2) {
    res.json({ customers: [], products: [], leases: [] });
    return;
  }

  const [customers, products, leases] = await Promise.all([
    supabase.from('customers').select('id, full_name, phone, national_id').or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,national_id.ilike.%${term}%`).limit(8),
    supabase.from('products').select('id, product_name, brand, serial_number, current_status').or(`product_name.ilike.%${term}%,brand.ilike.%${term}%,serial_number.ilike.%${term}%`).limit(8),
    supabase.from('lease_contracts_overview').select('id, lease_number, customer_name, product_serial_number, status').or(`lease_number.ilike.%${term}%,customer_name.ilike.%${term}%,product_serial_number.ilike.%${term}%`).limit(8)
  ]);

  for (const result of [customers, products, leases]) {
    if (result.error) throw result.error;
  }

  res.json({ customers: customers.data, products: products.data, leases: leases.data });
}));
