import { Router } from 'express';
import { supabase } from '../../config/supabase.js';
import { asyncHandler } from '../../middleware/error.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  res.json({ data });
}));

notificationsRouter.patch('/:id/read', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json({ data });
}));
