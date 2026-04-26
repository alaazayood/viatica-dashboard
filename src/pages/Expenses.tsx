import { useEffect, useState } from 'react';
import api from '../services/api';
import { cn } from '../lib/utils';
import {
  Receipt, Plus, Trash2, Loader2, Check, AlertCircle,
  X, Calendar, Filter, Home, Users,
  Truck, Zap, Wrench, MoreHorizontal, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  rent:        { label: 'إيجار',              icon: Home,           color: 'indigo' },
  salaries:    { label: 'رواتب',              icon: Users,          color: 'emerald' },
  transport:   { label: 'نقل وتوصيل',        icon: Truck,          color: 'amber' },
  utilities:   { label: 'خدمات',              icon: Zap,            color: 'blue' },
  maintenance: { label: 'صيانة',              icon: Wrench,         color: 'rose' },
  other:       { label: 'متفرقة',             icon: MoreHorizontal, color: 'slate' },
};

interface Expense {
  _id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Record<string, { total: number; count: number; label: string }>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterCat, setFilterCat] = useState('all');

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: 'rent', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = `/expenses?startDate=${startDate}&endDate=${endDate}`;
      if (filterCat !== 'all') url += `&category=${filterCat}`;
      const res = await api.get(url);
      setExpenses(res.data.data.expenses);
      setTotal(res.data.data.total);
      setSummary(res.data.data.summary);
    } catch {
      showToast('error', 'فشل تحميل المصاريف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleAdd = async () => {
    if (!form.amount || Number(form.amount) <= 0) return showToast('error', 'أدخل مبلغاً صالحاً');
    setSaving(true);
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) });
      showToast('success', 'تم تسجيل المصروف بنجاح ✓');
      setShowAdd(false);
      setForm({ category: 'rent', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch {
      showToast('error', 'فشل تسجيل المصروف');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/expenses/${id}`);
      showToast('success', 'تم حذف المصروف');
      fetchExpenses();
    } catch {
      showToast('error', 'فشل الحذف');
    }
  };

  const exportToExcel = () => {
    const wsData = expenses.map(e => ({
      'الفئة': categoryConfig[e.category]?.label || e.category,
      'المبلغ (ل.س)': e.amount,
      'البيان': e.description,
      'التاريخ': new Date(e.date).toLocaleDateString('ar-SY')
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المصاريف');
    XLSX.writeFile(wb, `Expenses_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl font-bold text-sm",
          toast.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        )}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-amber-500" />
            المصاريف التشغيلية
          </h1>
          <p className="text-sm text-slate-500 mt-1">تتبع جميع نفقات المستودع</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} disabled={expenses.length === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-bold transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> تصدير Excel
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> تسجيل مصروف
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white shadow-lg col-span-2 lg:col-span-1">
          <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mb-2">إجمالي المصاريف</p>
          <p className="text-3xl font-black">{total.toLocaleString()} <span className="text-sm text-amber-200">ل.س</span></p>
        </div>
        {Object.entries(summary).slice(0, 3).map(([key, val]) => {
          const cfg = categoryConfig[key];
          return (
            <div key={key} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", `bg-${cfg?.color || 'slate'}-50`)}>
                {cfg?.icon && <cfg.icon className={cn("w-5 h-5", `text-${cfg.color}-500`)} />}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{val.label}</p>
                <p className="text-xl font-black text-slate-800">{val.total.toLocaleString()} <span className="text-xs text-slate-400">ل.س</span></p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-3 items-end">
        <div className="space-y-1 flex-1 min-w-[160px]">
          <label className="text-xs font-bold text-slate-500">من تاريخ</label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
        </div>
        <div className="space-y-1 flex-1 min-w-[160px]">
          <label className="text-xs font-bold text-slate-500">إلى تاريخ</label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
        </div>
        <div className="space-y-1 flex-1 min-w-[160px]">
          <label className="text-xs font-bold text-slate-500">الفئة</label>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none">
            <option value="all">جميع الفئات</option>
            {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <button onClick={fetchExpenses} disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
          فلتر
        </button>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <Receipt className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-bold text-slate-400">لا توجد مصاريف مسجلة في هذه الفترة</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {expenses.map(exp => {
              const cfg = categoryConfig[exp.category];
              const Icon = cfg?.icon || MoreHorizontal;
              return (
                <div key={exp._id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", `bg-${cfg?.color || 'slate'}-50`)}>
                      <Icon className={cn("w-5 h-5", `text-${cfg?.color || 'slate'}-500`)} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{cfg?.label || exp.category}</p>
                      <p className="text-[10px] text-slate-400">{exp.description || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="font-black text-rose-600 text-sm">{exp.amount.toLocaleString()} ل.س</p>
                      <p className="text-[10px] text-slate-400">{new Date(exp.date).toLocaleDateString('ar-SY')}</p>
                    </div>
                    <button onClick={() => handleDelete(exp._id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50">
              <div>
                <h3 className="font-black text-slate-800">تسجيل مصروف جديد</h3>
                <p className="text-xs text-slate-500 mt-0.5">سجّل مصاريف التشغيل اليومية</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-white/50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">الفئة</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(categoryConfig).map(([key, cfg]) => (
                    <button key={key} onClick={() => setForm(f => ({ ...f, category: key }))}
                      className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-bold",
                        form.category === key ? `border-${cfg.color}-400 bg-${cfg.color}-50 text-${cfg.color}-700` : "border-slate-100 text-slate-400 hover:border-slate-200"
                      )}>
                      <cfg.icon className="w-5 h-5" />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">المبلغ (ل.س)</label>
                <input type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="مثال: 500000"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">التاريخ</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">بيان (اختياري)</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="مثال: إيجار شهر نيسان"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleAdd} disabled={saving}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-black hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  حفظ المصروف
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
