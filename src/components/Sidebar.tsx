import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users as UsersIcon,
  LogOut,
  Tag,
  Bell,
  User,
  DollarSign,
  Store,
  BarChart3,
  RotateCcw,
  Activity,
  ShieldAlert,
  Receipt,
  PackagePlus,
  Building2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { logout, user, notifications } = useAuth();
  
  const unreadOrderNotificationsCount = notifications?.filter(n => !n.read && (n.title.includes('طلب') || n.message.includes('طلب'))).length || 0;

  // Role-based navigation
  const allNavItems = [
    { icon: LayoutDashboard, label: 'الرئيسية', path: '/app', roles: ['admin', 'warehouse'] },
    { icon: Store, label: 'نقطة بيع (POS)', path: '/app/pos', roles: ['warehouse'] },
    { icon: ShoppingCart, label: 'الطلبات والورديات', path: '/app/orders', roles: ['admin', 'warehouse'] },
    { icon: UsersIcon, label: 'المستخدمين', path: '/app/users', roles: ['admin'] },
    { icon: Package, label: 'المخزون', path: '/app/inventory', roles: ['admin', 'warehouse'] },
    { icon: Activity, label: 'سجل الحركات', path: '/app/stock-movements', roles: ['admin', 'warehouse'] },
    { icon: Tag, label: 'العروض', path: '/app/offers', roles: ['admin', 'warehouse'] },
    { icon: User, label: 'الملف الشخصي', path: '/app/warehouse/me', roles: ['warehouse'] },
    { icon: DollarSign, label: 'الحسابات المالية', path: '/app/finance', roles: ['warehouse'] },
    { icon: BarChart3, label: 'التقارير والمبيعات', path: '/app/reports', roles: ['warehouse'] },
    { icon: Activity, label: 'الأرباح والخسائر', path: '/app/profit-loss', roles: ['warehouse', 'admin'] },
    { icon: RotateCcw, label: 'المرتجعات', path: '/app/returns', roles: ['warehouse'] },
    { icon: Activity, label: 'نبض المنصة', path: '/app/feed', roles: ['admin', 'warehouse'] },
    { icon: ShieldAlert, label: 'التنبيهات', path: '/app/alerts', roles: ['admin', 'warehouse'] },
    { icon: Receipt, label: 'المصاريف', path: '/app/expenses', roles: ['admin', 'warehouse'] },
    { icon: Building2, label: 'الموردين', path: '/app/suppliers', roles: ['warehouse'] },
    { icon: PackagePlus, label: 'المشتريات', path: '/app/purchases', roles: ['warehouse'] },
    { icon: Bell, label: 'الإشعارات', path: '/app/notifications', roles: ['admin', 'warehouse'] },
  ];

  const navItems = allNavItems.filter(item => 
    item.roles.includes(user?.role || 'admin')
  );

  // Subtitle based on role
  const roleLabel = user?.role === 'warehouse' ? 'لوحة المستودع' : 'منصة الإدارة';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" 
          onClick={onClose} 
        />
      )}
      
      <aside className={cn(
        "w-72 glass-sidebar flex flex-col fixed lg:sticky top-0 z-50 h-[100dvh] border-l border-white/5 shadow-2xl shadow-indigo-500/5 transition-transform duration-300 overflow-hidden",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
      <div className="p-6 border-b border-white/10 flex flex-col items-center justify-center gap-1.5 shrink-0">
        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-2">
            <img src="/viatica_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-xl font-black tracking-tighter gradient-text">VIATICA</h1>
        <div className="px-3 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{roleLabel}</p>
        </div>
        {user?.name && (
          <p className="text-[11px] text-slate-400 font-medium">👋 {user.name}</p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 mt-2 scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            onClick={() => onClose && onClose()}
            key={item.path}
            to={item.path}
            end={item.path === '/app'}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold tracking-wide group",
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-indigo-400"
              )
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn("w-5 h-5 shrink-0", "group-hover:scale-110 transition-transform")} />
              <span className="truncate">{item.label}</span>
            </div>
            
            {/* Notification Badge for Orders Tab */}
            {item.path === '/app/orders' && unreadOrderNotificationsCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-md shadow-lg shrink-0">
                {unreadOrderNotificationsCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 bg-white/5 shrink-0">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-rose-500 hover:text-white transition-all duration-200 text-sm font-bold tracking-wide group"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
