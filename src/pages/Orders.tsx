import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Search, Filter, Loader2, AlertCircle, Eye, Truck } from 'lucide-react';

interface Order {
  _id: string;
  pharmacist: { name: string; email: string };
  warehouse: { name: string };
  driver?: { name: string };
  status: 'pending' | 'processing' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled';
  createdAt: string;
  drugs: { drug: string; quantity: number; price: number }[];
}

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data.data.orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError('فشل تحميل قائمة الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };

    const labels: Record<string, string> = {
      pending: 'قيد الانتظار',
      processing: 'جاري التجهيز',
      assigned: 'تم إسناد سائق',
      out_for_delivery: 'جاري التوصيل',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">إدارة الطلبات</h1>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="بحث برقم الطلب أو اسم الصيدلية..." 
            className="w-full pr-10 pl-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">جميع الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="processing">جاري التجهيز</option>
          <option value="assigned">تم إسناد سائق</option>
          <option value="out_for_delivery">جاري التوصيل</option>
          <option value="delivered">تم التسليم</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-destructive gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/50 text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3">رقم الطلب</th>
                  <th className="px-4 py-3">الصيدلية</th>
                  <th className="px-4 py-3">السائق</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">عدد المواد</th>
                  <th className="px-4 py-3">تاريخ الطلب</th>
                  <th className="px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium font-mono text-xs">{order._id.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3">{order.pharmacist?.name || 'غير معروف'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.driver?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {order.drugs.length}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <button 
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status === 'processing' && (
                          <button className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="إسناد سائق">
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      لا توجد طلبات مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
