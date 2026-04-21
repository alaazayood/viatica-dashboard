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
  Activity
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
    { icon: LayoutDashboard, label: 'الرئيسية', path: '/', roles: ['admin', 'warehouse'] },
    { icon: Store, label: 'نقطة بيع (POS)', path: '/pos', roles: ['warehouse'] },
    { icon: ShoppingCart, label: 'الطلبات والورديات', path: '/orders', roles: ['admin', 'warehouse'] },
    { icon: UsersIcon, label: 'المستخدمين', path: '/users', roles: ['admin'] },
    { icon: Package, label: 'المخزون', path: '/inventory', roles: ['admin', 'warehouse'] },
    { icon: Tag, label: 'العروض', path: '/offers', roles: ['admin', 'warehouse'] },
    { icon: User, label: 'الملف الشخصي', path: '/warehouse/me', roles: ['warehouse'] },
    { icon: DollarSign, label: 'الحسابات المالية', path: '/finance', roles: ['warehouse'] },
    { icon: BarChart3, label: 'التقارير والمبيعات', path: '/reports', roles: ['warehouse'] },
    { icon: RotateCcw, label: 'المرتجعات', path: '/returns', roles: ['warehouse'] },
    { icon: Activity, label: 'نبض المنصة', path: '/feed', roles: ['admin', 'warehouse'] },
    { icon: Bell, label: 'الإشعارات', path: '/notifications', roles: ['admin', 'warehouse'] },
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
        "w-72 glass-sidebar flex flex-col fixed lg:sticky top-0 z-50 h-[100dvh] border-l border-white/5 shadow-2xl shadow-indigo-500/5 transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
      <div className="p-10 border-b border-white/10 flex flex-col items-center justify-center gap-2">
        <h1 className="text-4xl font-black tracking-tighter gradient-text">VIATICA</h1>
        <div className="px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{roleLabel}</p>
        </div>
        {user?.name && (
          <p className="text-[11px] text-slate-400 font-medium mt-1">👋 {user.name}</p>
        )}
      </div>

      <nav className="flex-1 p-6 space-y-3 mt-4">
        {navItems.map((item) => (
          <NavLink
            onClick={() => onClose && onClose()}
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 text-sm font-black uppercase tracking-wide group",
                isActive
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-[1.03]"
                  : "text-slate-400 hover:bg-white/5 hover:text-indigo-400 hover:translate-x-2"
              )
            }
          >
            <div className="flex items-center gap-4">
              <item.icon className={cn("w-5 h-5", "group-hover:scale-110 transition-transform")} />
              {item.label}
            </div>
            
            {/* Notification Badge for Orders Tab */}
            {item.path === '/orders' && unreadOrderNotificationsCount > 0 && (
              <span className="flex items-center justify-center w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-lg shadow-lg">
                {unreadOrderNotificationsCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-white/10 bg-white/5">
        <button 
          onClick={logout}
          className="flex items-center gap-4 px-5 py-4 w-full rounded-2xl text-slate-400 hover:bg-rose-500 hover:text-white transition-all duration-300 text-sm font-black uppercase tracking-widest group shadow-sm hover:shadow-rose-500/20"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
