import { useEffect, useState } from 'react';
import api from '../services/api';
import { cn } from '../lib/utils';
import {
  AlertTriangle, Clock, Package, Loader2, ShieldAlert,
  Calendar, Pill, RefreshCw
} from 'lucide-react';

interface DrugAlert {
  _id: string;
  name: string;
  manufacturer: string;
  quantity: number;
  expiryDate?: string;
  batchNumber: string;
  price: number;
  costPrice?: number;
  minThreshold?: number;
}

const Alerts = () => {
  const [tab, setTab] = useState<'expiry' | 'stock'>('expiry');
  const [loading, setLoading] = useState(true);

  // Expiry
  const [expirySummary, setExpirySummary] = useState({ expired: 0, within30: 0, within60: 0, within90: 0, total: 0 });
  const [expired, setExpired] = useState<DrugAlert[]>([]);
  const [within30, setWithin30] = useState<DrugAlert[]>([]);
  const [within60, setWithin60] = useState<DrugAlert[]>([]);
  const [within90, setWithin90] = useState<DrugAlert[]>([]);

  // Stock
  const [stockSummary, setStockSummary] = useState({ outOfStock: 0, lowStock: 0, total: 0 });
  const [outOfStock, setOutOfStock] = useState<DrugAlert[]>([]);
  const [lowStock, setLowStock] = useState<DrugAlert[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [expRes, stockRes] = await Promise.all([
        api.get('/admin/alerts/expiry'),
        api.get('/admin/alerts/stock')
      ]);
      const e = expRes.data.data;
      setExpirySummary(e.summary);
      setExpired(e.expired);
      setWithin30(e.within30);
      setWithin60(e.within60);
      setWithin90(e.within90);

      const s = stockRes.data.data;
      setStockSummary(s.summary);
      setOutOfStock(s.outOfStock);
      setLowStock(s.lowStock);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const daysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `منتهي منذ ${Math.abs(diff)} يوم`;
    if (diff === 0) return 'ينتهي اليوم!';
    return `${diff} يوم متبقي`;
  };

  const urgencyColor = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'bg-rose-500 text-white';
    if (diff <= 30) return 'bg-rose-100 text-rose-700';
    if (diff <= 60) return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-500" />
            مركز التنبيهات
          </h1>
          <p className="text-sm text-slate-500 mt-1">مراقبة الصلاحية ومستوى المخزون</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition-colors shadow-sm">
          <RefreshCw className="w-4 h-4" /> تحديث
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={AlertTriangle} label="منتهية الصلاحية" value={expirySummary.expired} color="rose" alert />
        <SummaryCard icon={Clock} label="تنتهي خلال 30 يوم" value={expirySummary.within30} color="amber" alert={expirySummary.within30 > 0} />
        <SummaryCard icon={Package} label="نفذ من المخزون" value={stockSummary.outOfStock} color="slate" alert={stockSummary.outOfStock > 0} />
        <SummaryCard icon={Pill} label="مخزون منخفض" value={stockSummary.lowStock} color="indigo" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setTab('expiry')}
            className={cn("flex-1 py-3.5 text-sm font-black transition-all flex items-center justify-center gap-2",
              tab === 'expiry' ? "text-rose-600 border-b-2 border-rose-500 bg-rose-50/50" : "text-slate-400 hover:bg-slate-50"
            )}
          >
            <Calendar className="w-4 h-4" />
            تنبيهات الصلاحية ({expirySummary.total})
          </button>
          <button
            onClick={() => setTab('stock')}
            className={cn("flex-1 py-3.5 text-sm font-black transition-all flex items-center justify-center gap-2",
              tab === 'stock' ? "text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50" : "text-slate-400 hover:bg-slate-50"
            )}
          >
            <Package className="w-4 h-4" />
            تنبيهات المخزون ({stockSummary.total})
          </button>
        </div>

        <div className="p-4">
          {tab === 'expiry' ? (
            expirySummary.total === 0 ? (
              <EmptyState icon={Calendar} text="لا توجد أدوية قريبة من انتهاء الصلاحية — ممتاز!" />
            ) : (
              <div className="space-y-2">
                {[...expired, ...within30, ...within60, ...within90].map(drug => (
                  <div key={drug._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", urgencyColor(drug.expiryDate!))}>
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{drug.name}</p>
                        <p className="text-[10px] text-slate-400">{drug.manufacturer} · دفعة {drug.batchNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center hidden sm:block">
                        <p className="text-[10px] text-slate-400 font-bold">الكمية</p>
                        <p className="font-black text-slate-700">{drug.quantity}</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-[10px] text-slate-400 font-bold">القيمة</p>
                        <p className="font-black text-slate-700">{(drug.quantity * drug.price).toLocaleString()} ل.س</p>
                      </div>
                      <span className={cn("px-3 py-1.5 rounded-lg text-[11px] font-black", urgencyColor(drug.expiryDate!))}>
                        {daysUntil(drug.expiryDate!)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            stockSummary.total === 0 ? (
              <EmptyState icon={Package} text="جميع الأصناف فوق الحد الأدنى — مخزونك ممتاز!" />
            ) : (
              <div className="space-y-2">
                {[...outOfStock, ...lowStock].map(drug => (
                  <div key={drug._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                        drug.quantity === 0 ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                      )}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{drug.name}</p>
                        <p className="text-[10px] text-slate-400">{drug.manufacturer} · دفعة {drug.batchNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold">المتوفر</p>
                        <p className={cn("font-black", drug.quantity === 0 ? "text-rose-600" : "text-amber-600")}>{drug.quantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold">الحد الأدنى</p>
                        <p className="font-black text-slate-500">{drug.minThreshold}</p>
                      </div>
                      <span className={cn("px-3 py-1.5 rounded-lg text-[11px] font-black",
                        drug.quantity === 0 ? "bg-rose-500 text-white" : "bg-amber-100 text-amber-700"
                      )}>
                        {drug.quantity === 0 ? 'نفذ!' : 'منخفض'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Sub-Components ─── */
const SummaryCard = ({ icon: Icon, label, value, color, alert }: any) => (
  <div className={cn(
    "bg-white rounded-2xl border p-5 flex items-center gap-4 transition-all",
    alert && value > 0 ? `border-${color}-200 bg-${color}-50/30` : "border-slate-100"
  )}>
    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", `bg-${color}-50`)}>
      <Icon className={cn("w-5 h-5", `text-${color}-500`)} />
    </div>
    <div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</p>
      <p className={cn("text-xl font-black", value > 0 && alert ? `text-${color}-600` : "text-slate-800")}>{value}</p>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, text }: any) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-300">
    <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-emerald-400" />
    </div>
    <p className="text-sm font-bold text-slate-400">{text}</p>
  </div>
);

export default Alerts;
