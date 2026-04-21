import { useEffect, useState } from 'react';
import api from '../services/api';
import { cn } from '../lib/utils';
import {
  Wallet, AlertCircle, Check, Loader2, ChevronDown, ChevronUp,
  DollarSign, CreditCard, FileText, X, RefreshCw
} from 'lucide-react';

interface Balance {
  _id: string;
  pharmacistName: string;
  pharmacistPhone: string;
  pharmacyName: string;
  totalDebt: number;
  totalPayments: number;
  currentBalance: number;
}

interface StatementEntry {
  id: string;
  date: string;
  type: 'debt' | 'payment';
  amount: number;
  description: string;
  orderId?: string;
  runningBalance: number;
}

const Finance = () => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statement, setStatement] = useState<{ [key: string]: StatementEntry[] }>({});
  const [stmtLoading, setStmtLoading] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<Balance | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchBalances(); }, []);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ledger/balances');
      setBalances(res.data.data.balances);
    } catch (err) {
      setError('فشل تحميل الحسابات');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatement = async (pharmacistId: string) => {
    if (expandedId === pharmacistId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(pharmacistId);
    if (statement[pharmacistId]) return; // already loaded

    setStmtLoading(pharmacistId);
    try {
      const res = await api.get(`/ledger/statement/${pharmacistId}`);
      setStatement(prev => ({ ...prev, [pharmacistId]: res.data.data.statement }));
    } catch {
      showToast('error', 'فشل تحميل كشف الحساب');
    } finally {
      setStmtLoading(null);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentModal || !paymentAmount || Number(paymentAmount) <= 0) {
      return showToast('error', 'يرجى إدخال مبلغ صالح');
    }
    setPaymentLoading(true);
    try {
      await api.post('/ledger/payment', {
        pharmacistId: paymentModal._id,
        amount: Number(paymentAmount),
        description: paymentDesc || 'تسديد دفعة نقدية'
      });
      showToast('success', `تم تسجيل دفعة ${Number(paymentAmount).toLocaleString()} ل.س بنجاح ✓`);
      setPaymentModal(null);
      setPaymentAmount('');
      setPaymentDesc('');
      // Refresh both balances and the expanded statement
      const refreshId = expandedId;
      fetchBalances();
      if (refreshId) {
        setStatement(prev => { const next = { ...prev }; delete next[refreshId]; return next; });
      }
    } catch {
      showToast('error', 'فشل تسجيل الدفعة');
    } finally {
      setPaymentLoading(false);
    }
  };

  const totalOutstanding = balances.reduce((s, b) => s + b.currentBalance, 0);

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
          <h1 className="text-2xl font-black text-slate-800">الحسابات المالية</h1>
          <p className="text-sm text-slate-500 mt-1">تتبع ديون الصيدليات وسندات القبض</p>
        </div>
        <button
          onClick={fetchBalances}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-5 shadow-lg shadow-indigo-500/20 col-span-1 sm:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">إجمالي المستحقات</p>
            <Wallet className="w-5 h-5 text-indigo-300" />
          </div>
          <p className="text-3xl font-black">{totalOutstanding.toLocaleString()}</p>
          <p className="text-indigo-300 text-xs mt-1 font-bold">ل.س</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">صيدليات مدينة</p>
            <FileText className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-800">{balances.length}</p>
          <p className="text-slate-400 text-xs mt-1">لديهم رصيد مستحق</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">متوسط الدين</p>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-slate-800">
            {balances.length > 0 ? Math.round(totalOutstanding / balances.length).toLocaleString() : 0}
          </p>
          <p className="text-slate-400 text-xs mt-1">ل.س لكل صيدلية</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-rose-500 gap-2 font-bold">
          <AlertCircle className="w-5 h-5" />{error}
        </div>
      ) : balances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-1">حساباتك صافية!</h3>
          <p className="text-sm text-slate-400">لا توجد ديون مستحقة على أي صيدلية حالياً.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {balances.map((b) => (
            <div key={b._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg shrink-0">
                    {b.pharmacistName?.charAt(0) || 'ص'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 truncate">{b.pharmacyName || b.pharmacistName}</p>
                    <p className="text-xs text-slate-400 font-medium">{b.pharmacistPhone || '—'}</p>
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center hidden sm:block">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">إجمالي المشتريات</p>
                    <p className="font-black text-slate-600">{b.totalDebt.toLocaleString()} ل.س</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">المسدد</p>
                    <p className="font-black text-emerald-600">{b.totalPayments.toLocaleString()} ل.س</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">المتبقي</p>
                    <p className="font-black text-rose-600 text-lg">{b.currentBalance.toLocaleString()} ل.س</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setPaymentModal(b); setPaymentAmount(''); setPaymentDesc(''); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-black transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    تسجيل دفعة
                  </button>
                  <button
                    onClick={() => toggleStatement(b._id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-black transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    الكشف
                    {expandedId === b._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Statement Drawer */}
              {expandedId === b._id && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                  {stmtLoading === b._id ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
                  ) : (statement[b._id] || []).length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-4">لا توجد حركات مالية مسجلة</p>
                  ) : (
                    <table className="w-full text-sm text-right">
                      <thead>
                        <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-200">
                          <th className="pb-2 font-bold">التاريخ</th>
                          <th className="pb-2 font-bold">البيان</th>
                          <th className="pb-2 font-bold">مدين</th>
                          <th className="pb-2 font-bold">دائن</th>
                          <th className="pb-2 font-bold">الرصيد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {statement[b._id].map(entry => (
                          <tr key={entry.id} className="py-1">
                            <td className="py-2 text-slate-400 text-xs">{new Date(entry.date).toLocaleDateString('ar-SY')}</td>
                            <td className="py-2 text-slate-600 font-medium">{entry.description}</td>
                            <td className="py-2 font-bold text-rose-600">
                              {entry.type === 'debt' ? entry.amount.toLocaleString() + ' ل.س' : '—'}
                            </td>
                            <td className="py-2 font-bold text-emerald-600">
                              {entry.type === 'payment' ? entry.amount.toLocaleString() + ' ل.س' : '—'}
                            </td>
                            <td className="py-2 font-black text-slate-800">{entry.runningBalance.toLocaleString()} ل.س</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <div>
                <h3 className="font-black text-slate-800">تسجيل دفعة</h3>
                <p className="text-xs text-slate-500 mt-0.5">{paymentModal.pharmacyName || paymentModal.pharmacistName}</p>
              </div>
              <button onClick={() => setPaymentModal(null)} className="p-2 hover:bg-white/50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-rose-50 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-rose-500 mb-1">الرصيد المستحق</p>
                <p className="text-2xl font-black text-rose-600">{paymentModal.currentBalance.toLocaleString()} ل.س</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">المبلغ المسدَّد (ل.س)</label>
                <input
                  type="number"
                  min="1"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="مثال: 500000"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">بيان (اختياري)</label>
                <input
                  type="text"
                  value={paymentDesc}
                  onChange={e => setPaymentDesc(e.target.value)}
                  placeholder="مثال: تسديد فاتورة شهر أبريل"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddPayment}
                  disabled={paymentLoading}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  تأكيد وحفظ السند
                </button>
                <button
                  onClick={() => setPaymentModal(null)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
                >
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

export default Finance;
