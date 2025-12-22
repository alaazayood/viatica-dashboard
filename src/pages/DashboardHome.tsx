import { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, ShoppingCart, DollarSign, Package, Loader2, ArrowUpRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { cn } from '../lib/utils';

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  recentOrders: any[];
  totalSales?: number;
  lowStock?: number;
}

const DashboardHome = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data.data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError('فشل تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary/60" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="p-4 bg-destructive/10 text-destructive rounded-full">
           <Package className="w-8 h-8" />
        </div>
        <p className="text-destructive font-bold">{error}</p>
      </div>
    );
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 100,
        damping: 15
      } 
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10 pb-10"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            مرحباً بك في <span className="gradient-text">القيادة</span>
          </h1>
          <p className="text-muted-foreground font-medium">نظرة شاملة على أداء نظام "فياتيكا" اليوم.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 rounded-full text-sm font-bold border border-indigo-500/20">
          <TrendingUp className="w-4 h-4" />
          الأداء العام: مستقر
        </div>
      </header>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          variants={itemVariants}
          title="إجمالي الطلبات" 
          value={stats?.totalOrders || 0} 
          icon={ShoppingCart} 
          color="indigo" 
          trend="+12%"
        />
        <StatCard 
          variants={itemVariants}
          title="العملاء النشطين" 
          value={stats?.totalUsers || 0} 
          icon={Users} 
          color="emerald"
          trend="+5%"
        />
        <StatCard 
          variants={itemVariants}
          title="مبيعات الشهر" 
          value={`${stats?.totalSales?.toLocaleString() || 0} ل.س`} 
          icon={DollarSign} 
          color="amber"
          trend="0%"
        />
        <StatCard 
          variants={itemVariants}
          title="نقص المخزون" 
          value={stats?.lowStock || 0} 
          icon={Package} 
          color="rose"
          trend={stats?.lowStock ? "يتطلب إجراء" : "مثالي"}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full" />
              أحدث العمليات
            </h2>
            <button className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              عرض الكل <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.map((order: any) => (
                <div key={order._id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-wider">طلب #{order._id.slice(-6)}</p>
                      <p className="text-xs text-muted-foreground font-medium">{new Date(order.createdAt).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 
                      order.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 
                      'bg-slate-500/10 text-slate-600'
                    )}>
                      {order.status === 'pending' ? 'معلق' : order.status === 'delivered' ? 'تم التوصيل' : order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
               <Package className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-sm font-bold">لا توجد طلبات حديثة في السجل</p>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          <div className="glass-card rounded-[2rem] p-8 bg-gradient-to-br from-indigo-500 to-primary text-white border-0 shadow-indigo-500/20">
            <h3 className="text-lg font-black mb-4 uppercase tracking-tighter">بوابة التقارير</h3>
            <p className="text-white/80 text-sm mb-6 font-medium leading-relaxed">قم بتحميل التقارير المالية والتحليلية للمستودع بضغطة واحدة.</p>
            <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 shadow-xl">
              توليد التقرير
            </button>
          </div>
          
          <div className="glass-card rounded-[2rem] p-8">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
               مؤشر الذكاء 🧠
            </h3>
            <div className="space-y-6">
               <HealthMetric label="أداء التوصيل" value={98} color="emerald" />
               <HealthMetric label="رضا الصيادلة" value={92} color="indigo" />
               <HealthMetric label="دقة المخزون" value={100} color="amber" />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, trend, variants }: any) => {
  const colorMap: any = {
    indigo: "bg-indigo-500/10 text-indigo-600 border-indigo-500/10",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/10",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/10",
    rose: "bg-rose-500/10 text-rose-600 border-rose-500/10",
  };

  return (
    <motion.div 
      variants={variants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="glass-card p-8 rounded-[2rem] relative overflow-hidden group"
    >
      <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full -mr-16 -mt-16 opacity-20", 
        color === 'indigo' ? 'bg-indigo-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
      )} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">{title}</p>
          <h4 className="text-3xl font-black tracking-tighter">{value}</h4>
        </div>
        <div className={cn("p-4 rounded-2xl transition-all duration-300 group-hover:scale-110", colorMap[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <div className="mt-8 flex items-center gap-2 relative z-10">
        <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg", colorMap[color])}>
          {trend}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">مقارنة بالأسبوع الماضي</span>
      </div>
    </motion.div>
  );
};

const HealthMetric = ({ label, value, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.5 }}
        className={cn("h-full rounded-full", 
          color === 'emerald' ? 'bg-emerald-500' : color === 'indigo' ? 'bg-indigo-500' : 'bg-amber-500'
        )} 
      />
    </div>
  </div>
);

export default DashboardHome;
