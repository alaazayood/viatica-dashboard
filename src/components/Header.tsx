import { useState, useEffect } from 'react';
import { Bell, Search, User, ShoppingBag, UserPlus } from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Notification {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const Header = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data.notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map((n: Notification) => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  return (
    <header className="h-24 glass-card px-10 flex items-center justify-between sticky top-0 z-50 border-x-0 border-t-0 rounded-none shadow-none backdrop-blur-3xl bg-white/40 dark:bg-black/40">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative group w-full max-w-md">
           <div className="absolute inset-0 bg-indigo-500/5 blur-xl group-focus-within:bg-indigo-500/10 transition-all rounded-2xl" />
           <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
           <input 
            type="text" 
            placeholder="ابحث عن أي شيء..." 
            className="w-full pr-12 pl-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "p-3 rounded-2xl transition-all relative border group",
              showNotifications 
                ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/30" 
                : "bg-white/50 dark:bg-black/50 border-white/20 dark:border-white/10 text-slate-500 hover:border-indigo-500/40"
            )}
          >
            <Bell className={cn("w-5 h-5", showNotifications ? "animate-none" : "group-hover:animate-bounce")} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -left-1 w-5 h-5 bg-rose-500 text-[10px] text-white rounded-lg border-2 border-white dark:border-zinc-900 flex items-center justify-center font-black shadow-lg">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-[-1]" 
                onClick={() => setShowNotifications(false)} 
              />
              <div className="absolute left-0 mt-4 w-96 glass-card border-white/20 dark:border-white/10 rounded-[2rem] shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-6 border-b border-white/10 bg-white/20 dark:bg-black/20 flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-wider">مركز التنبيهات</h4>
                    <p className="text-[10px] text-muted-foreground font-bold">لديك {unreadCount} رسائل غير مقروءة</p>
                  </div>
                  {unreadCount > 0 && (
                     <button 
                      onClick={async () => {
                        await api.patch('/notifications/mark-all-read');
                        fetchNotifications();
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 px-3 py-1 bg-indigo-500/10 rounded-full transition-colors"
                     >
                       تصفير الكل
                     </button>
                  )}
                </div>
                
                <div className="max-h-[450px] overflow-y-auto divide-y divide-white/10">
                  {notifications.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-4">
                       <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                          <Bell className="w-8 h-8 text-slate-300" />
                       </div>
                       <p className="text-xs font-bold text-muted-foreground">لا توجد إشعارات جديدة حالياً</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n._id} 
                        onClick={() => markRead(n._id)}
                        className={cn(
                          "p-5 hover:bg-white/30 dark:hover:bg-white/5 transition-all cursor-pointer flex gap-4 border-r-4",
                          !n.read ? "border-indigo-500 bg-indigo-500/5" : "border-transparent"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                          n.title.includes('انضمام') ? "bg-blue-500/10 text-blue-500" : 
                          n.title.includes('طلب') ? "bg-emerald-500/10 text-emerald-500" : 
                          "bg-amber-500/10 text-amber-500"
                        )}>
                          {n.title.includes('انضمام') ? <UserPlus className="w-4 h-4" /> : 
                           n.title.includes('طلب') ? <ShoppingBag className="w-4 h-4" /> : 
                           <Bell className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 space-y-1.5 pt-0.5">
                          <p className="text-[13px] font-black leading-none tracking-tight">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed font-medium line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-2 pt-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-white/10" />
                             <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1">
                                {format(new Date(n.createdAt), 'hh:mm a', { locale: ar })}
                             </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="p-4 border-t border-white/10 text-center bg-white/10 dark:bg-black/10">
                  <button className="text-[10px] font-black text-muted-foreground hover:text-indigo-500 transition-colors uppercase tracking-widest">
                    فتح مركز الإشعارات الكامل
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="h-10 w-[1px] bg-white/20 dark:bg-white/10 mx-2" />

        <div className="flex items-center gap-4 group cursor-pointer hover:bg-white/30 dark:hover:bg-white/5 p-2 rounded-2xl transition-all border border-transparent hover:border-white/10">
          <div className="text-left hidden lg:block pr-2">
            <p className="text-xs font-black uppercase tracking-wider text-right">أهلاً، المسؤول</p>
            <p className="text-[10px] text-muted-foreground font-bold">مدير النظام الرئيسي</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
