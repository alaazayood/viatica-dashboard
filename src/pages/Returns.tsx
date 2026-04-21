import { useState, useEffect } from 'react';
import api from '../services/api';
import { cn } from '../lib/utils';
import {
  RotateCcw, Search, Package, AlertCircle, Check, X,
  ChevronDown, ChevronUp, Loader2, Minus, Plus
} from 'lucide-react';

interface OrderDrug {
  drug: { _id: string; name: string; manufacturer: string };
  quantity: number;
  price: number;
  isBonus: boolean;
}

interface Order {
  _id: string;
  createdAt: string;
  status: string;
  source: string;
  customerName?: string;
  pharmacist?: { _id: string; name: string; pharmacyName: string };
  drugs: OrderDrug[];
}

interface ReturnItem {
  drug: string;
  drugName: string;
  quantity: number;
  maxQuantity: number;
  price: number;
  reason: string;
}

interface ReturnRecord {
  _id: string;
  createdAt: string;
  totalRefundAmount: number;
  status: string;
  notes?: string;
  originalOrder?: { _id: string; createdAt: string; source: string; customerName?: string };
  pharmacist?: { name: string; pharmacyName: string };
  returnedDrugs: { drug: { name: string; manufacturer: string }; quantity: number; price: number; reason: string }[];
}

const Returns = () => {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('history');

  // History state
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedReturn, setExpandedReturn] = useState<string | null>(null);

  // Create return state
  const [searchOrder, setSearchOrder] = useState('');
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnNotes, setReturnNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/returns');
      setReturns(res.data.data.returns);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchDeliveredOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/orders?status=delivered&limit=100');
      setDeliveredOrders(res.data.data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'create') {
      fetchDeliveredOrders();
    }
  }, [activeTab]);

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    setReturnItems(
      order.drugs
        .filter(d => !d.isBonus)
        .map(d => ({
          drug: d.drug._id,
          drugName: d.drug.name,
          quantity: 0,
          maxQuantity: d.quantity,
          price: d.price,
          reason: 'مرتجع عادي'
        }))
    );
  };

  const updateReturnQty = (idx: number, delta: number) => {
    setReturnItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const newQty = Math.max(0, Math.min(item.maxQuantity, item.quantity + delta));
      return { ...item, quantity: newQty };
    }));
  };

  const updateReturnReason = (idx: number, reason: string) => {
    setReturnItems(prev => prev.map((item, i) => i === idx ? { ...item, reason } : item));
  };

  const totalRefund = returnItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const hasItems = returnItems.some(item => item.quantity > 0);

  const handleSubmitReturn = async () => {
    if (!selectedOrder || !hasItems) return;
    setSubmitting(true);
    try {
      const payload = {
        orderId: selectedOrder._id,
        returnedDrugs: returnItems
          .filter(item => item.quantity > 0)
          .map(item => ({
            drug: item.drug,
            quantity: item.quantity,
            reason: item.reason
          })),
        notes: returnNotes
      };
      const res = await api.post('/returns', payload);
      showToast('success', res.data.message);
      setSelectedOrder(null);
      setReturnItems([]);
      setReturnNotes('');
      setActiveTab('history');
      fetchReturns();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'فشل تسجيل المرتجع');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = deliveredOrders.filter(o => {
    const term = searchOrder.toLowerCase();
    const clientName = o.pharmacist?.pharmacyName || o.pharmacist?.name || o.customerName || '';
    return clientName.toLowerCase().includes(term) || o._id.toLowerCase().includes(term);
  });

  const getClientName = (order: Order) => {
    return order.pharmacist?.pharmacyName || order.pharmacist?.name || order.customerName || 'مبيع مباشر';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-orange-500" />
            المرتجعات
          </h1>
          <p className="text-slate-500 font-medium mt-1">إرجاع أصناف من الفواتير المُسلّمة وإعادتها للمخزون تلقائياً</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
            activeTab === 'history' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          سجل المرتجعات
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
            activeTab === 'create' ? "bg-orange-500 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          + إنشاء مرتجع جديد
        </button>
      </div>

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {historyLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : returns.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
              <RotateCcw className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-bold">لا يوجد مرتجعات بعد</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {returns.map(ret => (
                <div key={ret._id}>
                  <div
                    onClick={() => setExpandedReturn(expandedReturn === ret._id ? null : ret._id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center">
                        <RotateCcw className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">
                          مرتجع من طلب #{ret.originalOrder?._id?.slice(-6).toUpperCase() || '---'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {ret.pharmacist?.pharmacyName || ret.pharmacist?.name || ret.originalOrder?.customerName || 'مبيع مباشر'}
                          {' • '}
                          {new Date(ret.createdAt).toLocaleDateString('ar-SY')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="font-black text-orange-600">{ret.totalRefundAmount.toLocaleString()} ل.س</p>
                        <p className="text-[10px] text-slate-400">{ret.returnedDrugs.length} أصناف</p>
                      </div>
                      <span className={cn(
                        "text-[10px] px-2 py-1 rounded-md font-bold",
                        ret.status === 'approved' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      )}>
                        {ret.status === 'approved' ? 'مُعتمد' : 'معلّق'}
                      </span>
                      {expandedReturn === ret._id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {expandedReturn === ret._id && (
                    <div className="px-5 pb-5 bg-slate-50/30">
                      <table className="w-full text-sm text-right">
                        <thead>
                          <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100">
                            <th className="pb-2 pr-2">الصنف</th>
                            <th className="pb-2">الكمية</th>
                            <th className="pb-2">السعر</th>
                            <th className="pb-2">الإجمالي</th>
                            <th className="pb-2">السبب</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {ret.returnedDrugs.map((d, idx) => (
                            <tr key={idx}>
                              <td className="py-2 pr-2 font-bold text-slate-800">{d.drug?.name || 'صنف محذوف'}</td>
                              <td className="py-2">{d.quantity}</td>
                              <td className="py-2">{d.price.toLocaleString()} ل.س</td>
                              <td className="py-2 font-bold text-orange-600">{(d.price * d.quantity).toLocaleString()} ل.س</td>
                              <td className="py-2 text-xs text-slate-500">{d.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {ret.notes && (
                        <p className="mt-3 text-xs text-slate-500 bg-white rounded-lg px-3 py-2 border border-slate-100">
                          <span className="font-bold">ملاحظات:</span> {ret.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Return Tab */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="xl:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[70vh]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" />
                اختر طلباً مُسلّماً
              </h3>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث بالعميل أو رقم الطلب..."
                  value={searchOrder}
                  onChange={e => setSearchOrder(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {ordersLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm font-medium">
                  لا توجد طلبات مُسلّمة
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div
                    key={order._id}
                    onClick={() => selectOrder(order)}
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:bg-indigo-50/50",
                      selectedOrder?._id === order._id && "bg-indigo-50 border-r-4 border-r-indigo-500"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{getClientName(order)}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          #{order._id.slice(-6).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString('ar-SY')}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700">
                        {order.drugs.length} أصناف
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Return Form */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            {!selectedOrder ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
                <RotateCcw className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold text-lg">اختر طلباً من القائمة</p>
                <p className="text-sm">لبدء عملية الإرجاع</p>
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-800">
                      إرجاع من طلب #{selectedOrder._id.slice(-6).toUpperCase()}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getClientName(selectedOrder)} • {new Date(selectedOrder.createdAt).toLocaleDateString('ar-SY')}
                    </p>
                  </div>
                  <button onClick={() => { setSelectedOrder(null); setReturnItems([]); }} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {returnItems.map((item, idx) => (
                    <div key={idx} className={cn(
                      "p-4 rounded-xl border transition-all",
                      item.quantity > 0 ? "bg-orange-50/50 border-orange-200" : "bg-white border-slate-100"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-slate-800">{item.drugName}</p>
                          <p className="text-xs text-slate-500">
                            السعر: {item.price.toLocaleString()} ل.س • الكمية الأصلية: {item.maxQuantity}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Reason */}
                          <select
                            value={item.reason}
                            onChange={e => updateReturnReason(idx, e.target.value)}
                            className="text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
                          >
                            <option value="مرتجع عادي">مرتجع عادي</option>
                            <option value="تالف / مكسور">تالف / مكسور</option>
                            <option value="قريب الانتهاء">قريب الانتهاء</option>
                            <option value="خطأ في الطلب">خطأ في الطلب</option>
                            <option value="عدم مطابقة">عدم مطابقة</option>
                          </select>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                            <button
                              onClick={() => updateReturnQty(idx, -1)}
                              className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-slate-50"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-center font-black text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateReturnQty(idx, 1)}
                              className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-slate-50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Refund for this item */}
                          {item.quantity > 0 && (
                            <span className="text-sm font-black text-orange-600 min-w-[80px] text-left">
                              {(item.price * item.quantity).toLocaleString()} ل.س
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Notes */}
                  <div className="mt-4">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">ملاحظات (اختياري)</label>
                    <textarea
                      value={returnNotes}
                      onChange={e => setReturnNotes(e.target.value)}
                      placeholder="أضف ملاحظة على هذا المرتجع..."
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">إجمالي المبلغ المُسترد:</p>
                    <p className="text-2xl font-black text-orange-600">{totalRefund.toLocaleString()} <span className="text-sm">ل.س</span></p>
                  </div>
                  <button
                    onClick={handleSubmitReturn}
                    disabled={!hasItems || submitting}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
                    {submitting ? 'جارٍ التسجيل...' : 'تأكيد المرتجع'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
