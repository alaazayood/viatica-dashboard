import { useState, useEffect } from 'react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { 
  BarChart3, Calendar, Filter, TrendingUp, TrendingDown,
  Banknote, Receipt, DollarSign, PieChart, Activity
} from 'lucide-react';

interface ProfitLossData {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  expensesBreakdown: { _id: string; total: number }[];
}

const ProfitLoss = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [error, setError] = useState('');

  // Filters (Default: This Month)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchProfitAndLoss();
  }, []);

  const fetchProfitAndLoss = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/admin/profit-loss?startDate=${startDate}&endDate=${endDate}`);
      setData(res.data.data);
    } catch (err: any) {
      console.error(err);
      setError('فشل تحميل بيانات الأرباح والخسائر');
    } finally {
      setLoading(false);
    }
  };

  const getExpenseLabel = (cat: string) => {
    const map: Record<string, string> = {
      rent: 'الإيجار',
      salaries: 'الرواتب والأجور',
      transport: 'نقل وشحن',
      utilities: 'فواتير (كهرباء/ماء)',
      maintenance: 'صيانة',
      other: 'مصاريف أخرى'
    };
    return map[cat] || cat;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-emerald-600" />
            الأرباح والخسائر (P&L)
          </h1>
          <p className="text-slate-500 font-medium mt-1">اللوحة المالية الشاملة لصافي أرباح المستودع</p>
        </div>
      </div>

      {/* Filters Form */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-slate-500">من تاريخ</label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold text-slate-700"
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
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold text-slate-700"
            />
          </div>
        </div>

        <button 
          onClick={fetchProfitAndLoss}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-black flex items-center justify-center gap-2 transition-colors h-[42px] disabled:opacity-50 shadow-lg shadow-emerald-500/20"
        >
          {loading ? "جاري الحساب..." : <><Filter className="w-4 h-4" /> عرض التقرير</>}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl font-bold border border-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Revenue */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-2 h-full bg-blue-500 rounded-r-3xl"></div>
              <div className="flex justify-between items-start mb-4 pr-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Banknote className="w-6 h-6" />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-bold pr-3">إجمالي المبيعات (الإيرادات)</p>
              <h3 className="text-2xl font-black text-slate-800 pr-3 mt-1">
                {data.totalRevenue.toLocaleString()} <span className="text-sm text-slate-500">ل.س</span>
              </h3>
            </div>

            {/* COGS */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-2 h-full bg-orange-500 rounded-r-3xl"></div>
              <div className="flex justify-between items-start mb-4 pr-3">
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                  <Receipt className="w-6 h-6" />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-bold pr-3">تكلفة البضاعة المباعة (COGS)</p>
              <h3 className="text-2xl font-black text-slate-800 pr-3 mt-1">
                {data.totalCOGS.toLocaleString()} <span className="text-sm text-slate-500">ل.س</span>
              </h3>
            </div>

            {/* Expenses */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-2 h-full bg-rose-500 rounded-r-3xl"></div>
              <div className="flex justify-between items-start mb-4 pr-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-bold pr-3">المصاريف التشغيلية</p>
              <h3 className="text-2xl font-black text-slate-800 pr-3 mt-1 text-rose-600">
                {data.totalExpenses.toLocaleString()} <span className="text-sm text-rose-400">ل.س</span>
              </h3>
            </div>

            {/* Net Profit */}
            <div className={cn(
              "p-5 rounded-3xl border shadow-lg relative overflow-hidden",
              data.netProfit >= 0 
                ? "bg-gradient-to-br from-emerald-600 to-emerald-800 border-emerald-500 text-white shadow-emerald-500/30" 
                : "bg-gradient-to-br from-rose-600 to-rose-800 border-rose-500 text-white shadow-rose-500/30"
            )}>
              <div className="absolute left-0 bottom-0 opacity-10">
                <DollarSign className="w-32 h-32 -mb-6 -ml-6" />
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm text-white">
                  {data.netProfit >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
              </div>
              <p className="text-white/80 text-sm font-bold">الربح الصافي (Net Profit)</p>
              <h3 className="text-3xl font-black mt-1">
                {data.netProfit.toLocaleString()} <span className="text-sm opacity-80 font-medium">ل.س</span>
              </h3>
            </div>
            
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Profit Margin Analysis */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <PieChart className="w-6 h-6 text-indigo-500" />
                <h3 className="text-lg font-black text-slate-800">تحليل هوامش الربح</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-600">الربح الإجمالي (قبل المصاريف)</span>
                    <span className="text-emerald-600">{data.grossProfit.toLocaleString()} ل.س</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (data.grossProfit / (data.totalRevenue || 1)) * 100))}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    هامش الربح الإجمالي: {((data.grossProfit / (data.totalRevenue || 1)) * 100).toFixed(1)}% من المبيعات
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-600">الربح الصافي (النهائي)</span>
                    <span className={data.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {data.netProfit.toLocaleString()} ل.س
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div className={cn("h-3 rounded-full", data.netProfit >= 0 ? "bg-emerald-600" : "bg-rose-500")} 
                         style={{ width: `${Math.min(100, Math.max(0, (data.netProfit / (data.totalRevenue || 1)) * 100))}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    هامش الربح الصافي: {((data.netProfit / (data.totalRevenue || 1)) * 100).toFixed(1)}% من المبيعات
                  </p>
                </div>
              </div>
            </div>

            {/* Expenses Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <BarChart3 className="w-6 h-6 text-rose-500" />
                <h3 className="text-lg font-black text-slate-800">توزع المصاريف التشغيلية</h3>
              </div>

              {data.expensesBreakdown.length === 0 ? (
                <p className="text-center text-slate-500 font-medium py-8">لا توجد مصاريف مسجلة في هذه الفترة</p>
              ) : (
                <div className="space-y-4">
                  {data.expensesBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                        <span className="font-bold text-slate-700">{getExpenseLabel(item._id)}</span>
                      </div>
                      <span className="font-black text-slate-800">
                        {item.total.toLocaleString()} <span className="text-xs text-slate-400 font-normal">ل.س</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      ) : null}

    </div>
  );
};

export default ProfitLoss;
