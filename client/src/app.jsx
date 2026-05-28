import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/app-shell.jsx';
import { ProtectedRoute } from './components/protected-route.jsx';
import { Dashboard } from './pages/dashboard.jsx';
import { Login } from './pages/login.jsx';
import { Customers } from './pages/customers.jsx';
import { CustomerProfile } from './pages/customer-profile.jsx';
import { CustomerHistory } from './pages/customer-history.jsx';
import { Inventory } from './pages/inventory.jsx';
import { ProductHistory } from './pages/product-history.jsx';
import { Leases } from './pages/leases.jsx';
import { Payments } from './pages/payments.jsx';
import { Overdue } from './pages/overdue.jsx';
import { Reports } from './pages/reports.jsx';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        )}
      >
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customer-history" element={<CustomerHistory />} />
        <Route path="customers/:id" element={<CustomerProfile />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="product-history" element={<ProductHistory />} />
        <Route path="leases" element={<Leases />} />
        <Route path="payments" element={<Payments />} />
        <Route path="overdue" element={<Overdue />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
