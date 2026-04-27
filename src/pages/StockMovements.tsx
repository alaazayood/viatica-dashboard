import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Filter, Loader2, RefreshCw, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

type MovementType = 'purchase_in' | 'purchase_cancel' | 'sale_out' | 'order_out' | 'return_in' | 'adjustment';

interface Movement {
  _id: string;
  warehouse: string;
  drug: { _id: string; name: string; manufacturer?: string; barcode?: string } | string;
  type: MovementType;
  direction: 'in' | 'out';
  quantity: number;
  unitType: 'unit' | 'carton';
  packingSize: number;
  quantityUnits: number;
  beforeQty: number;
  afterQty: number;
  referenceModel?: string;
  referenceId?: string;
  actor?: { _id: string; name: string; role: string } | string;
  notes?: string;
  createdAt: string;
}

const typeLabel: Record<MovementType, string> = {
  purchase_in: 'شراء (إدخال)',
  purchase_cancel: 'إلغاء شراء (إخراج)',
  sale_out: 'بيع مباشر (إخراج)',
  order_out: 'طلب (إخراج)',
  return_in: 'مرتجع (إدخال)',
  adjustment: 'تعديل'
};

const typeColor: Record<MovementType, string> = {
  purchase_in: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  purchase_cancel: 'bg-rose-50 text-rose-700 border-rose-200',
  sale_out: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  order_out: 'bg-amber-50 text-amber-700 border-amber-200',
  return_in: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  adjustment: 'bg-slate-50 text-slate-700 border-slate-200'
};

export default function StockMovements() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movements, setMovements] = useState<Movement[]>([]);

  const [page, setPage] = useState(1);
  const limit = 30;

  const [type, setType] = useState<MovementType | 'all'>('all');
  const [drugId, setDrugId] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [warehouseId, setWarehouseId] = useState(''); // admin only

  const params = useMemo(() => {
    const p: any = { page, limit };
    if (type !== 'all') p.type = type;
    if (drugId.trim()) p.drug = drugId.trim();
    if (referenceId.trim()) p.referenceId = referenceId.trim();
    if (startDate) p.startDate = startDate;
    if (endDate) p.endDate = endDate;
    if (isAdmin && warehouseId.trim()) p.warehouse = warehouseId.trim();
    return p;
  }, [page, type, drugId, referenceId, startDate, endDate, isAdmin, warehouseId]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/stock/movements', { params });
      setMovements(res.data.data.movements || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'فشل تحميل سجل الحركات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">سجل حركات المخزون</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            كل دخول/خروج من المخزون موثّق بالوقت والسبب والمرجع.
          </p>
        </div>
        <button
          onClick={() => fetchMovements()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-black text-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-700 font-black mb-3">
          <Filter className="w-4 h-4" />
          فلاتر البحث
        </div>

        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <label className="text-[11px] font-black text-slate-500">النوع</label>
            <select
              value={type}
              onChange={(e) => { setPage(1); setType(e.target.value as any); }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
            >
              <option value="all">الكل</option>
              <option value="purchase_in">شراء (إدخال)</option>
              <option value="purchase_cancel">إلغاء شراء</option>
              <option value="sale_out">بيع مباشر</option>
              <option value="order_out">طلبات</option>
              <option value="return_in">مرتجعات</option>
              <option value="adjustment">تعديل</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="text-[11px] font-black text-slate-500">معرّف الدواء</label>
            <div className="relative mt-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={drugId}
                onChange={(e) => { setPage(1); setDrugId(e.target.value); }}
                placeholder="drugId"
                className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 py-2 text-sm font-bold"
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <label className="text-[11px] font-black text-slate-500">مرجع العملية</label>
            <input
              value={referenceId}
              onChange={(e) => { setPage(1); setReferenceId(e.target.value); }}
              placeholder="orderId / purchaseId"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="text-[11px] font-black text-slate-500">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setPage(1); setStartDate(e.target.value); }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="text-[11px] font-black text-slate-500">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setPage(1); setEndDate(e.target.value); }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
            />
          </div>

          {isAdmin && (
            <div className="lg:col-span-1">
              <label className="text-[11px] font-black text-slate-500">warehouseId</label>
              <input
                value={warehouseId}
                onChange={(e) => { setPage(1); setWarehouseId(e.target.value); }}
                placeholder="اختياري للأدمن"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl p-4 font-bold">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-[#f8fafc] text-slate-500 font-black border-b border-slate-100">
                <tr>
                  <th className="px-4 py-4">التاريخ</th>
                  <th className="px-4 py-4">الدواء</th>
                  <th className="px-4 py-4">النوع</th>
                  <th className="px-4 py-4">الاتجاه</th>
                  <th className="px-4 py-4">الكمية (وحدات)</th>
                  <th className="px-4 py-4">قبل → بعد</th>
                  <th className="px-4 py-4">الفاعل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-400 font-bold">
                      لا توجد حركات
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const drugName = typeof m.drug === 'string' ? m.drug : m.drug?.name;
                    const actorName = typeof m.actor === 'string' ? m.actor : m.actor?.name;
                    return (
                      <tr key={m._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-4 text-slate-500 font-bold">
                          {new Date(m.createdAt).toLocaleString('ar-SY')}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-black text-slate-900">{drugName || '—'}</div>
                          {typeof m.drug !== 'string' && m.drug?.manufacturer && (
                            <div className="text-xs text-slate-400 font-bold">{m.drug.manufacturer}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("inline-flex px-2.5 py-1 rounded-full border text-[11px] font-black", typeColor[m.type])}>
                            {typeLabel[m.type]}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-black">
                          <span className={cn(
                            "inline-flex px-2.5 py-1 rounded-full border text-[11px] font-black",
                            m.direction === 'in' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                          )}>
                            {m.direction === 'in' ? 'دخول' : 'خروج'}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-black text-slate-900">
                          {Number(m.quantityUnits || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 font-black text-slate-700">
                          {m.beforeQty?.toLocaleString?.() ?? m.beforeQty} → {m.afterQty?.toLocaleString?.() ?? m.afterQty}
                        </td>
                        <td className="px-4 py-4 text-slate-500 font-bold">
                          {actorName || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-slate-100">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-black border",
                page <= 1 ? "bg-slate-50 text-slate-300 border-slate-100" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              )}
            >
              السابق
            </button>
            <div className="text-xs font-black text-slate-500">صفحة {page}</div>
            <button
              disabled={movements.length < limit}
              onClick={() => setPage(p => p + 1)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-black border",
                movements.length < limit ? "bg-slate-50 text-slate-300 border-slate-100" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              )}
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

