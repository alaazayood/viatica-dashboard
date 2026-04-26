import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { Plus, Search, Loader2, AlertCircle, Pencil, Trash2, Upload, Download, Building2, Package, PackagePlus } from 'lucide-react';
import AddDrugModal from '../components/AddDrugModal';
import { SmartImportModal } from '../components/SmartImportModal';
import StockReplenishModal from '../components/StockReplenishModal';
import { useAuth } from '../context/AuthContext';

interface Drug {
  _id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  price: number;
  costPrice?: number;
  priceUSD?: number;
  quantity: number;
  category: string;
  expiryDate: string;
  batchNumber: string;
  warehouse?: { _id: string; name: string };
}

const Inventory = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [drugToEdit, setDrugToEdit] = useState<Drug | null>(null);
  const [drugToReplenish, setDrugToReplenish] = useState<Drug | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/import/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting template:", err);
      alert('فشل تصدير القالب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/drugs');
      setDrugs(response.data.data.drugs); 
    } catch (err) {
      console.error("Error fetching drugs:", err);
      setError('فشل تحميل قائمة الأدوية');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (drug: Drug) => {
    setDrugToEdit(drug);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدواء؟')) return;
    
    try {
      await api.delete(`/drugs/${id}`);
      setDrugs(drugs.filter(d => d._id !== id));
    } catch (err) {
      console.error("Error deleting drug:", err);
      alert('فشل حذف الدواء');
    }
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setDrugToEdit(null);
  };

  // Derive unique warehouses from loaded drugs for the admin filter
  const uniqueWarehouses = useMemo(() => {
    if (!isAdmin) return [];
    const warehousesMap = new Map();
    drugs.forEach(d => {
      if (d.warehouse?._id) {
        warehousesMap.set(d.warehouse._id, d.warehouse.name);
      }
    });
    return Array.from(warehousesMap.entries()).map(([id, name]) => ({ id, name }));
  }, [drugs, isAdmin]);

  const filteredDrugs = drugs.filter(drug => {
    const matchesSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          drug.genericName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWarehouse = isAdmin && selectedWarehouseFilter !== 'all' 
      ? drug.warehouse?._id === selectedWarehouseFilter 
      : true;

    return matchesSearch && matchesWarehouse;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">إدارة المخزون</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <Download className="ml-2 h-4 w-4" />
            تصدير القالب
          </button>
          <button 
            onClick={() => setIsBulkImportOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <Upload className="ml-2 h-4 w-4" />
            استيراد
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-md"
          >
            <Plus className="ml-2 h-4 w-4" />
            إضافة دواء
          </button>
        </div>
      </div>

      <AddDrugModal 
        isOpen={isAddModalOpen} 
        onClose={handleModalClose} 
        onSuccess={fetchDrugs}
        drugToEdit={drugToEdit}
      />

      <SmartImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={fetchDrugs}
      />

      <StockReplenishModal 
        isOpen={!!drugToReplenish}
        onClose={() => setDrugToReplenish(null)}
        onSuccess={fetchDrugs}
        drug={drugToReplenish}
      />

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="بحث عن دواء..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        
        {isAdmin && (
          <div className="relative min-w-[200px] w-full sm:w-auto">
            <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select 
              value={selectedWarehouseFilter}
              onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 appearance-none rounded-lg border border-input bg-background font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-indigo-700"
            >
              <option value="all">كل المستودعات</option>
              {uniqueWarehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>
        )}
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
      ) : drugs.length === 0 ? (
        /* ===== EMPTY STATE — لا يوجد أي دواء ===== */
        <div className="flex flex-col items-center justify-center py-24 px-8 bg-white rounded-3xl border border-slate-100 shadow-lg">
          <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6">
            <Package className="w-12 h-12 text-indigo-300" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">مخزونك فارغ حالياً</h3>
          <p className="text-sm text-slate-500 mb-8 text-center max-w-md">
            لم تتم إضافة أي أدوية بعد. ابدأ بإضافة أول دواء لك ليظهر في كتالوج الصيدليات.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all"
            >
              <Plus className="w-5 h-5" />
              أضف أول دواء
            </button>
            <button 
              onClick={() => setIsBulkImportOpen(true)}
              className="flex items-center gap-2 px-6 py-3.5 border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all"
            >
              <Upload className="w-4 h-4" />
              استيراد من ملف
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right align-middle">
              <thead className="bg-[#f8fafc] text-slate-500 font-bold border-b border-border">
                <tr>
                  <th className="px-4 py-4">اسم الدواء</th>
                  {isAdmin && <th className="px-4 py-4">المستودع</th>}
                  <th className="px-4 py-4">الشركة المصنعة</th>
                  <th className="px-4 py-4">التصنيف</th>
                  <th className="px-4 py-4 text-emerald-700">سعر البيع</th>
                  <th className="px-4 py-4 text-orange-700">التكلفة (الشراء)</th>
                  <th className="px-4 py-4">الكمية</th>
                  <th className="px-4 py-4">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDrugs.length > 0 ? (
                  filteredDrugs.map((drug) => (
                    <tr key={drug._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{drug.name}</div>
                        <div className="text-xs text-slate-500">{drug.genericName}</div>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <Building2 className="w-3 h-3 text-indigo-500" />
                            {drug.warehouse?.name || 'غير محدد'}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-4 text-slate-600">{drug.manufacturer}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700">
                          {drug.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-black tracking-tight text-emerald-600">
                        {new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP' }).format(drug.price)}
                      </td>
                      <td className="px-4 py-4 font-black tracking-tight text-orange-600">
                        {drug.costPrice ? new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP' }).format(drug.costPrice) : '---'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-black
                          ${drug.quantity < 50 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}
                        `}>
                          {drug.quantity} عبوة
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Replenish Button */}
                          <button 
                            onClick={() => setDrugToReplenish(drug)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                            title="تجديد الكمية (شراء للمخزن)"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(drug)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                            title="تعديل خصائص الدواء"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(drug._id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center">
                       <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                       <p className="text-slate-500 font-medium">لا توجد نتائج مطابقة للبحث</p>
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

export default Inventory;
