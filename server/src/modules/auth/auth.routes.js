import { Router } from 'express';
import { supabase } from '../../config/supabase.js';
import { asyncHandler } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';

export const authRouter = Router();

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

authRouter.post('/sync-profile', requireAuth, asyncHandler(async (req, res) => {
  const payload = {
    id: req.user.id,
    email: req.user.email,
    full_name: req.body.fullName || req.user.full_name,
    role: req.user.role || 'staff',
    status: 'active'
  };

  const { data, error } = await supabase.from('users').upsert(payload).select().single();
  if (error) throw error;
  res.json({ user: data });
}));
