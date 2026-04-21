import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowRight, Calendar, MapPin, User, Package, Truck, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface OrderDetail {
  _id: string;
  pharmacist: { name: string; email: string; phone: string };
  warehouse: { name: string };
  driver?: { _id: string; name: string; phone: string };
  status: string;
  createdAt: string;
  deliveryAddress: { street: string; city: string };
  isFreeDelivery: boolean;
  deliveryFee: number;
  drugs: { drug: { name: string; price: number }; quantity: number; price: number; isBonus?: boolean }[];
}

interface Driver {
  _id: string;
  name: string;
}

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchOrderDetails();
    fetchDrivers();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.data.order);
      if (response.data.data.order.driver) {
        setSelectedDriver(response.data.data.order.driver._id);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      showToast('error', 'فشل تحميل تفاصيل الطلب');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/users?role=driver');
      setDrivers(response.data.data.users);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };


  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus });
      showToast('success', 'تم تحديث حالة الطلب بنجاح ✓');
      fetchOrderDetails();
    } catch (error) {
      console.error("Error updating status:", error);
      showToast('error', 'فشل تحديث حالة الطلب');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!order) return <div className="text-center p-10">الطلب غير موجود</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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

      <button onClick={() => navigate('/orders')} className="flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowRight className="w-4 h-4 ml-1" />
        العودة للطلبات
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Order Info */}
        <div className="flex-1 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1">طلب #{order._id.slice(-6).toUpperCase()}</h1>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Calendar className="w-4 h-4 ml-1" />
                  {new Date(order.createdAt).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {order.status === 'pending' && user?.role !== 'admin' && (
                  <button 
                    onClick={() => handleUpdateStatus('cancelled')}
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-md hover:bg-red-100 transition-colors text-sm font-bold flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    رفض الطلب
                  </button>
                )}
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                  order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                  order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 
                  'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                )}>
                  {order.status === 'pending' ? 'قيد الانتظار' : 
                   order.status === 'confirmed' ? 'تم التأكيد' :
                   order.status === 'assigned' ? 'تم التعيين' :
                   order.status === 'out_for_delivery' ? 'في الطريق' :
                   order.status === 'delivered' ? 'تم التوصيل' : order.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">الصيدلية</h3>
                <div className="flex items-center font-medium">
                  <User className="w-4 h-4 ml-2 text-primary" />
                  {order.pharmacist.name}
                </div>
                <p className="text-sm text-muted-foreground mr-6">{order.pharmacist.phone}</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">عنوان التوصيل</h3>
                <div className="flex items-start font-medium">
                  <MapPin className="w-4 h-4 ml-2 text-primary mt-1" />
                  <span>{order.deliveryAddress?.city} - {order.deliveryAddress?.street}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-muted/30 border-b border-border font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              قائمة الأدوية
            </div>
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">الدواء</th>
                  <th className="px-4 py-3">الكمية</th>
                  <th className="px-4 py-3">السعر الإفرادي</th>
                  <th className="px-4 py-3">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.drugs.map((item, idx) => (
                  <tr key={idx} className={item.isBonus ? 'bg-green-50/30' : ''}>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {item.drug.name}
                        {item.isBonus && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded border border-green-200">هدايا بونص</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">
                      {item.isBonus ? (
                        <span className="text-green-600 font-bold">مجاني</span>
                      ) : (
                        `${item.price.toLocaleString()} ل.س`
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {item.isBonus ? '0 ل.س' : `${(item.quantity * item.price).toLocaleString()} ل.س`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 font-medium">
                <tr className="border-t border-border">
                  <td colSpan={3} className="px-4 py-3 text-left">المجموع الصافي:</td>
                  <td className="px-4 py-3">
                    {order.drugs.reduce((acc, item) => acc + (item.quantity * item.price), 0).toLocaleString()} ل.س
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-left">أجور التوصيل:</td>
                  <td className="px-4 py-3">
                    {order.isFreeDelivery ? (
                      <span className="text-green-600 font-bold">مجاني (عرض خاص)</span>
                    ) : (
                       `${order.deliveryFee?.toLocaleString() || 0} ل.س`
                    )}
                  </td>
                </tr>
                <tr className="bg-primary/5 text-primary text-lg font-bold border-t border-primary/20">
                  <td colSpan={3} className="px-4 py-3 text-left">المجموع النهائي:</td>
                  <td className="px-4 py-3">
                    {(order.drugs.reduce((acc, item) => acc + (item.quantity * item.price), 0) + (order.isFreeDelivery ? 0 : (order.deliveryFee || 0))).toLocaleString()} ل.س
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Sidebar Actions (Only visible to non-admins, i.e., warehouses) */}
        {user?.role !== 'admin' && (
          <div className="w-full md:w-80 space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl">
              <h3 className="font-black text-sm uppercase mb-4 flex items-center gap-2 tracking-widest">
                <Truck className="w-4 h-4 text-primary" />
                إدارة العمليات
              </h3>
              
              <div className="space-y-4">
                {/* Driver Assignment Section (Only if not delivered/cancelled) */}
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <div className="space-y-3 pb-4 border-b border-white/5">
                    <label className="text-[10px] items-center gap-1 font-black text-muted-foreground uppercase tracking-widest flex">
                      التحكم بالسائق
                    </label>
                    <select 
                      className="w-full p-3 rounded-xl border border-white/10 bg-white/5 font-bold text-xs focus:ring-2 focus:ring-primary outline-none appearance-none"
                      value={selectedDriver}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                    >
                      <option value="">-- اختر سائق --</option>
                      {drivers.map(driver => (
                        <option key={driver._id} value={driver._id}>{driver.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={async () => {
                        if (!selectedDriver) return showToast('error', 'يرجى اختيار سائق أولاً');
                        setAssigning(true);
                        try {
                          await api.patch(`/orders/${id}/assign-driver`, { driverId: selectedDriver });
                          showToast('success', 'تم تخصيص السائق بنجاح ✓');
                          fetchOrderDetails();
                        } catch (error) { showToast('error', 'فشل التخصيص'); } 
                        finally { setAssigning(false); }
                      }}
                      disabled={assigning || !selectedDriver}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      {assigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <User className="w-3 h-3" />}
                      تغيير السائق
                    </button>
                  </div>
                )}

                {/* Status Stepper - Smart Actions */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                    الإجراء التالي
                  </label>

                  {order.status === 'pending' && (
                     <button 
                      onClick={() => handleUpdateStatus('confirmed')}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                     >
                       <Check className="w-4 h-4" />
                       تأكيد الطلب وبدء التجهيز
                     </button>
                  )}

                  {order.status === 'confirmed' && (
                     <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                       <p className="text-indigo-800 text-[10px] font-bold mb-2">لبدء التوصيل، يجب إسناد سائق أولاً</p>
                       <p className="text-xs text-muted-foreground">استخدم قائمة "التحكم بالسائق" أعلاه</p>
                     </div>
                  )}

                  {order.status === 'assigned' && (
                     <button 
                      onClick={() => handleUpdateStatus('out_for_delivery')}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                     >
                       <Truck className="w-4 h-4" />
                       بدء التوصيل الفعلي
                     </button>
                  )}

                  {order.status === 'out_for_delivery' && (
                     <button 
                      onClick={() => handleUpdateStatus('delivered')}
                      className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                     >
                       <Check className="w-4 h-4" />
                       تأكيد إتمام التسليم
                     </button>
                  )}

                  {order.status === 'delivered' && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 text-[10px] font-black text-center uppercase tracking-widest">
                      ✅ تم إغلاق الطلب وتحصيل المبلغ
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 text-[10px] font-black text-center uppercase tracking-widest">
                      🛑 الطلب ملغي
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
