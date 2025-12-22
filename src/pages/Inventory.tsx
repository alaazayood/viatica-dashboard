import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search, Filter, Loader2, AlertCircle, Pencil, Trash2, Upload, Download } from 'lucide-react';
import AddDrugModal from '../components/AddDrugModal';
import { SmartImportModal } from '../components/SmartImportModal';

interface Drug {
  _id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  price: number;
  priceUSD?: number;
  quantity: number;
  category: string;
  expiryDate: string;
  batchNumber: string;
}

const Inventory = () => {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [drugToEdit, setDrugToEdit] = useState<Drug | null>(null);

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

  const filteredDrugs = drugs.filter(drug => 
    drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drug.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            تصدير القالب (Excel)
          </button>
          <button 
            onClick={() => setIsBulkImportOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <Upload className="ml-2 h-4 w-4" />
            استيراد ملف Excel
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Plus className="ml-2 h-4 w-4" />
            إضافة دواء جديد
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

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="بحث عن دواء..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="p-2 border border-input rounded-md hover:bg-accent text-muted-foreground">
          <Filter className="w-4 h-4" />
        </button>
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
                  <th className="px-4 py-3">اسم الدواء</th>
                  <th className="px-4 py-3">الاسم العلمي</th>
                  <th className="px-4 py-3">الشركة المصنعة</th>
                  <th className="px-4 py-3">التصنيف</th>
                  <th className="px-4 py-3">السعر</th>
                  <th className="px-4 py-3">الكمية</th>
                  <th className="px-4 py-3">تاريخ الانتهاء</th>
                  <th className="px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDrugs.length > 0 ? (
                  filteredDrugs.map((drug) => (
                    <tr key={drug._id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{drug.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{drug.genericName}</td>
                      <td className="px-4 py-3">{drug.manufacturer}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                          {drug.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-primary">
                        {new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP' }).format(drug.price)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${drug.quantity < 50 ? 'text-destructive' : 'text-green-600'}`}>
                          {drug.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(drug.expiryDate).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(drug)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(drug._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      لا توجد نتائج مطابقة
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
