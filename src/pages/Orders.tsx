import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { 
  Search, Loader2, AlertCircle, Eye, Truck, ShoppingCart,
  Check, X, Clock, Package, CheckCircle2, Ban
} from 'lucide-react';

interface Order {
  _id: string;
  pharmacist: { name: string; phone?: string; pharmacyName?: string };
  warehouse: { name: string };
  driver?: { name: string };
  status: 'pending' | 'confirmed' | 'processing' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled';
  createdAt: string;
  drugs: { drug: string; quantity: number; price: number; isBonus?: boolean }[];
  customerName?: string;
  source?: string;
}

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending:          { label: 'بانتظار الموافقة', icon: Clock,         color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200'   },
  confirmed:        { label: 'تم التأكيد',      icon: Check,         color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'     },
  processing:       { label: 'جاري التجهيز',    icon: Package,       color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200' },
  assigned:         { label: 'تم إسناد سائق',   icon: Truck,         color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200' },
  out_for_delivery: { label: 'جاري التوصيل',    icon: Truck,         color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200' },
  delivered:        { label: 'تم التسليم',       icon: CheckCircle2,  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200'},
  cancelled:        { label: 'ملغي',            icon: Ban,           color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200'     },
};

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isWarehouse = user?.role === 'warehouse';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data.data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError('فشل تحميل قائمة الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (orderId: string, newStatus: string, actionLabel: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      showToast('success', `تم ${actionLabel} بنجاح ✓`);
      fetchOrders();
    } catch {
      showToast('error', `فشل ${actionLabel}`);
    }
  };

  // Filters
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      order.pharmacist?.name?.includes(searchTerm) || 
      order._id.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  // Stats
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const activeCount = orders.filter(o => ['confirmed', 'processing', 'assigned', 'out_for_delivery'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  const calcTotal = (drugs: Order['drugs']) => 
    drugs.reduce((sum, d) => sum + (d.price * d.quantity), 0);

  return (
    <div className="space-y-6">

      {/* Floating Toast */}
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
          <h1 className="text-2xl font-black text-slate-800">إدارة الطلبات</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isWarehouse ? 'الطلبات الواردة من الصيدليات' : 'جميع طلبات المنصة'}
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'بانتظار الموافقة', value: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
          { label: 'طلبات نشطة', value: activeCount, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Package },
          { label: 'تم التسليم', value: deliveredCount, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg, color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">{value}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث باسم الصيدلية أو رقم الطلب..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2.5 px-4 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="all">جميع الحالات</option>
          <option value="pending">بانتظار الموافقة</option>
          <option value="confirmed">تم التأكيد</option>
          <option value="assigned">تم إسناد سائق</option>
          <option value="out_for_delivery">جاري التوصيل</option>
          <option value="delivered">تم التسليم</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-rose-500 gap-2">
          <AlertCircle className="w-5 h-5" />
          <p className="font-bold">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-lg">
          <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6">
            <ShoppingCart className="w-12 h-12 text-indigo-300" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">لا توجد طلبات بعد</h3>
          <p className="text-sm text-slate-500 text-center max-w-md">
            {isWarehouse 
              ? 'ستظهر هنا الطلبات الواردة من الصيدليات فور إرسالها عبر التطبيق.'
              : 'ستظهر هنا جميع طلبات الشراء من الصيدليات.'}
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-100">
          <Search className="w-10 h-10 text-slate-200 mb-3" />
          <p className="text-slate-400 font-bold">لا توجد نتائج مطابقة</p>
        </div>
      ) : (
        /* Orders Table */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">رقم الطلب</th>
                  <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">الصيدلية</th>
                  {isAdmin && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">المستودع</th>}
                  <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">الحالة</th>
                  <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">المبلغ</th>
                  <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">التاريخ</th>
                  <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map((order) => {
                  const sc = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = sc.icon;
                  const total = calcTotal(order.drugs);
                  return (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <span className="font-mono font-black text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            {order.customerName 
                              ? order.customerName 
                              : order.pharmacist?.pharmacyName 
                                ? order.pharmacist.pharmacyName 
                                : order.pharmacist?.name 
                                  ? order.pharmacist.name 
                                  : 'مبيع مباشر'}
                          </span>
                          {order.source && order.source.startsWith('manual') && (
                            <span className="text-[10px] font-bold text-indigo-500 mt-0.5">مبيعات نقطة البيع (POS)</span>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-4 text-slate-500 text-xs font-bold">
                          {order.warehouse?.name || '-'}
                        </td>
                      )}
                      <td className="px-5 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border",
                          sc.bg, sc.color
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-slate-800">
                        {total > 0 ? `${total.toLocaleString()} ل.س` : '-'}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs font-medium">
                        {new Date(order.createdAt).toLocaleDateString('ar-SY')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {/* View Details */}
                          <button 
                            onClick={() => navigate(`/orders/${order._id}`)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Accept (for pending orders) */}
                          {order.status === 'pending' && (isWarehouse || isAdmin) && (
                            <>
                              <button 
                                onClick={() => handleQuickAction(order._id, 'confirmed', 'قبول الطلب')}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="قبول الطلب"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleQuickAction(order._id, 'cancelled', 'رفض الطلب')}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="رفض الطلب"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
