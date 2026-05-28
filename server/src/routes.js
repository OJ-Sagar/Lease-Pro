import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { customersRouter } from './modules/customers/customers.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { leasesRouter } from './modules/leases/leases.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { analyticsRouter } from './modules/analytics/analytics.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { searchRouter } from './modules/search/search.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
// AUTH SETUP LATER:
// Re-enable protected APIs by importing requireAuth/requireRole above and
// restoring this middleware:
//
// apiRouter.use(requireAuth);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/leases', leasesRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/analytics', analyticsRouter);
// AUTH SETUP LATER:
// Restore owner-only reports with:
// apiRouter.use('/reports', requireRole(['owner']), reportsRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/notifications', notificationsRouter);
