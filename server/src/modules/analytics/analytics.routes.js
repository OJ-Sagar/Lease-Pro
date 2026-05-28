import { Router } from 'express';
import { subMonths, format } from 'date-fns';
import { supabase } from '../../config/supabase.js';
import { asyncHandler } from '../../middleware/error.js';

export const analyticsRouter = Router();

analyticsRouter.get('/dashboard', asyncHandler(async (_req, res) => {
  const [metrics, monthlyRevenue, paymentDistribution, categoryTrends, overdue] = await Promise.all([
    supabase.from('dashboard_metrics').select('*').single(),
    supabase.rpc('monthly_revenue_trend', { months_back: 12 }),
    supabase.rpc('payment_status_distribution'),
    supabase.rpc('category_leasing_trends', { months_back: 6 }),
    supabase.from('overdue_accounts').select('*').order('days_overdue', { ascending: false }).limit(12)
  ]);

  for (const result of [metrics, monthlyRevenue, paymentDistribution, categoryTrends, overdue]) {
    if (result.error) throw result.error;
  }

  res.json({
    metrics: metrics.data,
    monthlyRevenue: monthlyRevenue.data,
    paymentDistribution: paymentDistribution.data,
    categoryTrends: categoryTrends.data,
    overdueAccounts: overdue.data
  });
}));

analyticsRouter.get('/cashflow', asyncHandler(async (_req, res) => {
  const months = Array.from({ length: 12 }, (_, index) => format(subMonths(new Date(), 11 - index), 'yyyy-MM'));
  const { data, error } = await supabase.from('monthly_revenue').select('*').in('month_key', months).order('month_key');
  if (error) throw error;
  res.json({ data });
}));
