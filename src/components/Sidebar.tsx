import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users as UsersIcon,
  LogOut,
  Tag,
  Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'الرئيسية', path: '/' },
    { icon: ShoppingCart, label: 'الطلبات', path: '/orders' },
    { icon: UsersIcon, label: 'المستخدمين', path: '/users' },
    { icon: Package, label: 'المخزون', path: '/inventory' },
    { icon: Tag, label: 'العروض', path: '/offers' },
    { icon: Bell, label: 'الإشعارات', path: '/notifications' },
  ];

  return (
    <aside className="w-72 glass-sidebar h-screen flex flex-col sticky top-0 z-40 border-l border-white/5 shadow-2xl shadow-indigo-500/5">
      <div className="p-10 border-b border-white/10 flex flex-col items-center justify-center gap-2">
        <h1 className="text-4xl font-black tracking-tighter gradient-text">VIATICA</h1>
        <div className="px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">منصة الإدارة</p>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-3 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-sm font-black uppercase tracking-wide group",
                isActive
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-[1.03]"
                  : "text-slate-400 hover:bg-white/5 hover:text-indigo-400 hover:translate-x-2"
              )
            }
          >
            <item.icon className={cn("w-5 h-5", "group-hover:scale-110 transition-transform")} />
            {item.label}
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
  );
};

export default Sidebar;
