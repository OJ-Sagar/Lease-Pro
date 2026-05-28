import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Boxes, CreditCard, FileBarChart, Gauge, History, LogOut, Menu, Search, Users, WalletCards, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/use-auth';
import { GlobalSearch } from './global-search';
import { cn } from '../../lib/utils';

const nav = [
  { to: '/', label: 'Dashboard', icon: Gauge },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/customer-history', label: 'Customer History', icon: History },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/product-history', label: 'Product History', icon: History },
  { to: '/leases', label: 'Leases', icon: WalletCards },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/overdue', label: 'Overdue', icon: AlertTriangle },
  { to: '/reports', label: 'Reports', icon: FileBarChart }
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen min-w-0 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-72 border-r border-white/10 bg-[#080d18]/95 p-4 backdrop-blur-xl transition lg:static lg:block', open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className="flex h-full min-h-0 flex-col">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-lg font-black text-primary-foreground">LP</div>
            <div>
              <p className="text-lg font-extrabold text-white">Lease Pro</p>
              <p className="text-xs text-muted-foreground">Internal Admin</p>
            </div>
          </div>
          <nav className="grid min-h-0 gap-1 overflow-y-auto pr-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.05] p-4">
            <p className="text-sm font-bold text-white">{profile?.full_name || profile?.email || 'Admin'}</p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">{profile?.role || 'staff'} access</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070b14]/80 px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open sidebar">
              <Menu size={20} />
            </Button>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-md border border-white/10 bg-white/[0.06] px-3 text-left text-sm text-muted-foreground transition hover:bg-white/[0.09]"
            >
              <Search size={17} />
              <span className="truncate">Search customer, CNIC, phone, product serial, or lease ID</span>
            </button>
            <Button variant="ghost" size="icon" aria-label="Notifications"><Bell size={19} /></Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out"><LogOut size={19} /></Button>
          </div>
        </header>
        <main className="mx-auto min-w-0 max-w-7xl px-3 py-5 sm:px-4 lg:px-8">
          <Outlet />
        </main>
      </div>
      {searchOpen ? <GlobalSearch onClose={() => setSearchOpen(false)} /> : null}
    </div>
  );
}
