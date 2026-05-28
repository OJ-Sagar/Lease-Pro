import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../../config/supabase.js';
import { asyncHandler } from '../../middleware/error.js';
import { validate } from '../../middleware/validate.js';
import { applyTextSearch, pagination } from '../../lib/query.js';

export const productsRouter = Router();

const productBody = z.object({
  body: z.object({
    product_name: z.string().min(2),
    brand: z.string().min(1),
    category: z.enum(['smartphone', 'tv', 'washing_machine', 'refrigerator', 'air_conditioner', 'other']),
    serial_number: z.string().min(2),
    purchase_cost: z.number().nonnegative(),
    lease_price: z.number().nonnegative(),
    current_status: z.enum(['available', 'leased', 'returned', 'under_repair', 'damaged']).default('available'),
    product_condition: z.enum(['new', 'excellent', 'good', 'fair', 'poor']).default('good'),
    warranty_expiry: z.string().optional().nullable()
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough()
});

productsRouter.get('/', asyncHandler(async (req, res) => {
  const { from, to, page, pageSize } = pagination(req.query);
  let query = supabase.from('product_performance').select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: false }).range(from, to);
  query = applyTextSearch(query, ['product_name', 'brand', 'serial_number'], req.query.search);
  if (req.query.status) query = query.eq('current_status', req.query.status);
  if (req.query.category) query = query.eq('category', req.query.category);
  const { data, error, count } = await query;
  if (error) throw error;
  res.json({ data, meta: { page, pageSize, total: count || 0 } });
}));

productsRouter.post('/', validate(productBody), asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('products').insert(req.validated.body).select().single();
  if (error) throw error;
  res.status(201).json({ data });
}));

productsRouter.put('/:id', validate(productBody), asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('products').update(req.validated.body).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json({ data });
}));

productsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id);
  if (error) throw error;
  res.status(204).send();
}));
