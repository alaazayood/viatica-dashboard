import { useState, useEffect } from 'react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { 
  BarChart3, Calendar, Download, Search, Filter,
  TrendingUp, Package, Banknote, Users
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Types
interface ReportSummary {
  totalRevenue: number;
  totalOrdersCount: number;
}
interface TopDrug {
  _id: string;
  name: string;
  manufacturer: string;
  totalQty: number;
  totalRevenue: number;
}
interface OrderSummary {
  _id: string;
  createdAt: string;
  source: string;
  status: string;
  total: number;
  clientName: string;
  clientPhone: string;
  itemsCount: number;
}

const Reports = () => {
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default last 30 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pharmacistId, setPharmacistId] = useState('all');
  
  // Dropdown data
  const [clients, setClients] = useState<{_id: string, name: string, pharmacyName: string}[]>([]);

  // Report Data
  const [summary, setSummary] = useState<ReportSummary>({ totalRevenue: 0, totalOrdersCount: 0 });
  const [topDrugs, setTopDrugs] = useState<TopDrug[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    fetchClients();
    fetchReport();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/users');
      setClients(res.data.data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/reports/sales?startDate=${startDate}&endDate=${endDate}`;
      if (pharmacistId !== 'all') {
        url += `&pharmacistId=${pharmacistId}`;
      }
      const res = await api.get(url);
      setSummary(res.data.data.summary);
      setTopDrugs(res.data.data.topDrugs);
      setOrders(res.data.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const wsData = orders.map(o => ({
      'رقم الفاتورة': o._id.slice(-6).toUpperCase(),
      'التاريخ': new Date(o.createdAt).toLocaleDateString('ar-SY'),
      'العميل': o.clientName,
      'مصدر الفاتورة': o.source.includes('manual') ? 'نقطة بيع مباشر (POS)' : 'تطبيق عميل',
      'عدد الأصناف': o.itemsCount,
      'إجمالي الفاتورة (ل.س)': o.total
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المبيعات");
    
    // Auto-size columns slightly
    ws['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 12 },
      { wch: 20 }
    ];

    XLSX.writeFile(wb, `Sales_Report_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            تقارير المبيعات
          </h1>
          <p className="text-slate-500 font-medium mt-1">تحليل حركة المبيعات وتصدير السجلات الشاملة</p>
        </div>
        
        <button 
          onClick={exportToExcel}
          disabled={orders.length === 0}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          تصدير إلى Excel
        </button>
      </div>

      {/* Filters Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-slate-500">من تاريخ</label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>
        
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-slate-500">إلى تاريخ</label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-slate-500">العميل المستهدف</label>
          <div className="relative">
            <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={pharmacistId}
              onChange={e => setPharmacistId(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none text-slate-700"
            >
              <option value="all">جميع العملاء</option>
              {clients.map(c => (
                <option key={c._id} value={c._id}>{c.pharmacyName || c.name} ({c.name})</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={fetchReport}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors min-w-[120px] h-[42px] disabled:opacity-50"
        >
          {loading ? "جار الفلترة..." : <><Filter className="w-4 h-4" /> فـلـتـر</>}
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-l from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute left-0 bottom-0 opacity-10">
                <Banknote className="w-32 h-32 -mb-8 -ml-8" />
              </div>
              <p className="text-indigo-200 font-bold mb-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                إجمالي الإيرادات (المبيعات)
              </p>
              <p className="text-4xl font-black">
                {summary.totalRevenue.toLocaleString()} <span className="text-lg opacity-80">ل.س</span>
              </p>
            </div>
            
            <div className="bg-white border text-center border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-center flex-col">
              <p className="text-slate-500 font-bold mb-1 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-500" />
                إجمالي الطلبات المُنفذة
              </p>
              <p className="text-3xl font-black text-slate-800">
                {summary.totalOrdersCount} <span className="text-lg font-medium text-slate-500">طلبية</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Top Drugs */}
            <div className="xl:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  الأدوية الأكثر مبيعاً
                </h3>
              </div>
              <div className="p-2 space-y-1">
                {topDrugs.length === 0 ? (
                  <p className="text-sm font-medium text-slate-400 p-4 text-center">لا يوجد بيانات لعرضها</p>
                ) : (
                  topDrugs.map((d, idx) => (
                    <div key={d._id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-xs">
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{d.name}</h4>
                        <p className="text-[10px] text-slate-500">{d.manufacturer}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-emerald-600">{d.totalQty} علبة</p>
                        <p className="text-[10px] text-slate-400">{d.totalRevenue.toLocaleString()} ل.س</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Invoices List */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-500" />
                  سجل الفواتير ضمن هذه الفترة
                </h3>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase">رقم</th>
                      <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase">العميل</th>
                      <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase">المصدر</th>
                      <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase">المبلغ</th>
                      <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                          لا توجد مبيعات في الفترة المحددة
                        </td>
                      </tr>
                    ) : (
                      orders.map(o => (
                        <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-xs text-indigo-500">#{o._id.slice(-6).toUpperCase()}</td>
                          <td className="px-5 py-4 font-bold text-slate-800">{o.clientName}</td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              "text-[10px] px-2 py-1 rounded-md font-bold", 
                              o.source.includes('manual') ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                            )}>
                              {o.source.includes('manual') ? 'نقطة بيع POS' : 'تطبيق عميل'}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-black text-emerald-600">{o.total.toLocaleString()} ل.س</td>
                          <td className="px-5 py-4 font-medium text-slate-500 text-xs">
                            {new Date(o.createdAt).toLocaleDateString('ar-SY')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
