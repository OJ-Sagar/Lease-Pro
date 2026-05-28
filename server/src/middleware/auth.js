import { supabase } from '../config/supabase.js';
import { HttpError } from './error.js';

export async function requireAuth(req, _res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new HttpError(401, 'Missing bearer token');

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new HttpError(401, 'Invalid or expired token');

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role, status')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) throw new HttpError(403, 'Admin profile is not configured');
    if (profile.status !== 'active') throw new HttpError(403, 'Admin account is inactive');

    req.user = profile;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      next(new HttpError(403, 'Insufficient permissions'));
      return;
    }
    next();
  };
}
