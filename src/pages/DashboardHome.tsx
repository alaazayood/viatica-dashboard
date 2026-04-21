import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  ShoppingCart, DollarSign, Package, Loader2, TrendingUp,
  Clock, Pill, FileText, AlertTriangle, ArrowUpRight, Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface ChartDay {
  date: string;
  label: string;
  total: number;
  count: number;
}

interface TopDrug {
  name: string;
  manufacturer: string;
  totalQty: number;
  totalRevenue: number;
}

const DashboardHome = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setStats(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  );

  if (!stats) return (
    <div className="flex items-center justify-center h-[60vh] text-slate-400">فشل تحميل البيانات</div>
  );

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } }
  };

  const chartMax = Math.max(...(stats.chartData || []).map((d: ChartDay) => d.total), 1);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-10">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">
            مرحباً يا <span className="bg-clip-text text-transparent bg-gradient-to-l from-indigo-600 to-emerald-500">{user?.name || 'شريك'}</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm">نظرة شاملة على أداء مستودعك اليوم</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
          <TrendingUp className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString('ar-SY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </header>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard v={item} title="مبيعات اليوم" value={`${stats.totalSalesToday?.toLocaleString() || 0}`} suffix="ل.س" icon={DollarSign} color="emerald" />
        <KPICard v={item} title="فواتير اليوم" value={stats.invoicesToday || 0} icon={FileText} color="indigo" />
        <KPICard v={item} title="طلبات معلقة" value={stats.pendingOrders || 0} icon={Clock} color="amber" alert={stats.pendingOrders > 0} />
        <KPICard v={item} title="مستحقات الذمم" value={`${stats.outstandingDebts?.toLocaleString() || 0}`} suffix="ل.س" icon={Wallet} color="rose" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center"><Pill className="w-5 h-5 text-indigo-500" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">الأصناف</p>
            <p className="text-xl font-black text-slate-800">{stats.totalDrugs || 0}</p>
          </div>
        </motion.div>
        <motion.div variants={item} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-emerald-500" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">إجمالي الطلبات</p>
            <p className="text-xl font-black text-slate-800">{stats.totalOrders || 0}</p>
          </div>
        </motion.div>
        <motion.div variants={item} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-amber-500" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">مبيعات الشهر</p>
            <p className="text-xl font-black text-slate-800">{stats.totalSalesMonth?.toLocaleString() || 0} <span className="text-xs text-slate-400">ل.س</span></p>
          </div>
        </motion.div>
        <motion.div variants={item} className={cn("bg-white rounded-2xl border p-5 flex items-center gap-4", stats.lowStock > 0 ? "border-rose-200 bg-rose-50/30" : "border-slate-100")}>
          <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center">
            {stats.lowStock > 0 ? <AlertTriangle className="w-5 h-5 text-rose-500" /> : <Package className="w-5 h-5 text-rose-400" />}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">نقص مخزون</p>
            <p className={cn("text-xl font-black", stats.lowStock > 0 ? "text-rose-600" : "text-slate-800")}>{stats.lowStock || 0}</p>
          </div>
        </motion.div>
      </div>

      {/* Charts + Top Drugs Row */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Sales Chart */}
        <motion.div variants={item} className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-7">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-indigo-500 rounded-full" />
              حركة المبيعات (آخر 7 أيام)
            </h2>
          </div>
          <div className="flex items-end gap-3 h-48">
            {(stats.chartData || []).map((day: ChartDay, i: number) => {
              const pct = chartMax > 0 ? (day.total / chartMax) * 100 : 0;
              const isToday = i === (stats.chartData?.length || 0) - 1;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <p className="text-[9px] font-bold text-slate-400 truncate">{day.total > 0 ? (day.total / 1000).toFixed(0) + 'K' : '0'}</p>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pct, 4)}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={cn(
                      "w-full rounded-xl transition-all",
                      isToday
                        ? "bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-500/20"
                        : "bg-slate-100 hover:bg-indigo-100"
                    )}
                  />
                  <p className={cn("text-[10px] font-bold", isToday ? "text-indigo-600" : "text-slate-400")}>{day.label}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Drugs */}
        <motion.div variants={item} className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-7">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            الأكثر مبيعاً
          </h2>
          {(stats.topDrugs || []).length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-300">
              <p className="text-sm">لا توجد مبيعات بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.topDrugs.map((drug: TopDrug, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                    i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-500"
                  )}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{drug.name}</p>
                    <p className="text-[10px] text-slate-400">{drug.totalQty} وحدة</p>
                  </div>
                  <p className="text-sm font-black text-emerald-600 shrink-0">{drug.totalRevenue?.toLocaleString()} <span className="text-[10px] text-slate-400">ل.س</span></p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div variants={item} className="bg-white rounded-3xl border border-slate-100 p-7">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
            آخر العمليات
          </h2>
          <a href="/orders" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
            عرض الكل <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        {(stats.recentOrders || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <Package className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">لا توجد عمليات حديثة</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {stats.recentOrders.map((order: any) => (
              <div key={order._id} className="flex items-center justify-between py-4 hover:bg-slate-50/50 px-3 -mx-3 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                    order.source?.startsWith('manual') ? "bg-indigo-50" : "bg-emerald-50"
                  )}>
                    <ShoppingCart className={cn("w-5 h-5", order.source?.startsWith('manual') ? "text-indigo-500" : "text-emerald-500")} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {order.customerName || order.pharmacist?.pharmacyName || order.pharmacist?.name || `طلب #${order._id.slice(-6)}`}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {order.source === 'app' ? '📱 من التطبيق' : order.source === 'manual_pharmacy' ? '🏪 بيع مباشر' : order.source === 'manual_distributor' ? '🚚 موزع' : ''}
                      {' · '}
                      {new Date(order.createdAt).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                  order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                  order.status === 'confirmed' ? 'bg-indigo-50 text-indigo-600' :
                  order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                  order.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                  'bg-slate-50 text-slate-500'
                )}>
                  {order.status === 'pending' ? 'معلق' : order.status === 'confirmed' ? 'مؤكد' : order.status === 'delivered' ? 'تم' : order.status === 'cancelled' ? 'ملغي' : order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ─── KPI Card Component ─── */
const KPICard = ({ title, value, suffix, icon: Icon, color, alert, v }: any) => {
  const gradients: any = {
    emerald: 'from-emerald-500 to-emerald-700',
    indigo:  'from-indigo-500 to-indigo-700',
    amber:   'from-amber-500 to-amber-600',
    rose:    'from-rose-500 to-rose-700',
  };
  return (
    <motion.div
      variants={v}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 text-white shadow-lg",
        `bg-gradient-to-br ${gradients[color]}`,
        `shadow-${color}-500/20`,
        alert && "animate-pulse ring-2 ring-white/30"
      )}
    >
      <Icon className="absolute -bottom-3 -left-3 w-20 h-20 opacity-10" />
      <div className="relative z-10">
        <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-2">{title}</p>
        <p className="text-3xl font-black">{value} {suffix && <span className="text-sm font-bold text-white/60">{suffix}</span>}</p>
      </div>
    </motion.div>
  );
};

export default DashboardHome;
