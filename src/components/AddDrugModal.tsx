import React, { useState, useEffect } from 'react';
import { X, Loader2, Calculator } from 'lucide-react';
import api from '../services/api';

interface Drug {
  _id?: string;
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
  dosage?: string;
  dosageForm?: string;
}

interface AddDrugModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  drugToEdit?: Drug | null;
}

const AddDrugModal: React.FC<AddDrugModalProps> = ({ isOpen, onClose, onSuccess, drugToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    costPrice: '',
    profitMargin: '20', // Default 20%
    priceUSD: '',
    price: '',
    quantity: '',
    category: 'other',
    expiryDate: '',
    batchNumber: '',
    dosage: '',
    dosageForm: 'Tablet'
  });

  useEffect(() => {
    if (drugToEdit) {
      setFormData({
        name: drugToEdit.name,
        genericName: drugToEdit.genericName,
        manufacturer: drugToEdit.manufacturer,
        costPrice: drugToEdit.costPrice?.toString() || '',
        profitMargin: drugToEdit.costPrice && drugToEdit.price 
          ? (((drugToEdit.price - drugToEdit.costPrice) / drugToEdit.costPrice) * 100).toFixed(1) 
          : '20',
        priceUSD: drugToEdit.priceUSD?.toString() || '',
        price: drugToEdit.price.toString(),
        quantity: drugToEdit.quantity.toString(),
        category: drugToEdit.category,
        expiryDate: drugToEdit.expiryDate.split('T')[0], // Format date for input
        batchNumber: drugToEdit.batchNumber,
        dosage: drugToEdit.dosage || '',
        dosageForm: drugToEdit.dosageForm || 'Tablet'
      });
    } else {
      setFormData({
        name: '',
        genericName: '',
        manufacturer: '',
        costPrice: '',
        profitMargin: '20',
        priceUSD: '',
        price: '',
        quantity: '',
        category: 'other',
        expiryDate: '',
        batchNumber: '',
        dosage: '',
        dosageForm: 'Tablet'
      });
    }
  }, [drugToEdit, isOpen]);

  // Auto-calculate SYP price when USD or Rate changes
  useEffect(() => {
    if (formData.priceUSD) {
      const sypPrice = parseFloat(formData.priceUSD) * 15000;
      setFormData(prev => ({ ...prev, price: sypPrice.toString() }));
    }
  }, [formData.priceUSD]);

  // Auto-calculate Price based on Cost and Profit Margin
  useEffect(() => {
    // Only run if costPrice is entered and we are focusing on cost or margin
    if (formData.costPrice && formData.profitMargin) {
      const cost = parseFloat(formData.costPrice);
      const margin = parseFloat(formData.profitMargin);
      if (!isNaN(cost) && !isNaN(margin)) {
        const calculatedPrice = cost + (cost * margin / 100);
        // Avoid overwriting if user is manually typing price (we can trust the last edited field, but simpler is to just set it)
        setFormData(prev => ({ ...prev, price: Math.round(calculatedPrice).toString() }));
      }
    }
  }, [formData.costPrice, formData.profitMargin]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (drugToEdit && drugToEdit._id) {
        await api.put(`/drugs/${drugToEdit._id}`, formData);
      } else {
        await api.post('/drugs', formData);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving drug:", error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء حفظ الدواء');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">
            {drugToEdit ? 'تعديل بيانات الدواء' : 'إضافة دواء جديد'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم التجاري</label>
              <input
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
                placeholder="مثال: Panadol"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم العلمي</label>
              <input
                name="genericName"
                required
                value={formData.genericName}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
                placeholder="مثال: Paracetamol"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">الشركة المصنعة</label>
              <input
                name="manufacturer"
                required
                value={formData.manufacturer}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">العيار (الجرعة)</label>
              <input
                name="dosage"
                required
                value={formData.dosage}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
                placeholder="مثال: 500mg"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">الشكل الصيدلاني</label>
              <select
                name="dosageForm"
                required
                value={formData.dosageForm}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              >
                <option value="Tablet">حبوب (Tablet)</option>
                <option value="Capsule">كبسول (Capsule)</option>
                <option value="Syrup">شراب (Syrup)</option>
                <option value="Injection">حقن (Injection)</option>
                <option value="Ointment">مرهم (Ointment)</option>
                <option value="Cream">كريم (Cream)</option>
                <option value="Drops">قطرات (Drops)</option>
                <option value="Other">أخرى</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">التصنيف</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              >
                <option value="analgesic">مسكنات (Analgesic)</option>
                <option value="antibiotic">مضادات حيوية (Antibiotic)</option>
                <option value="antihistamine">مضادات الحساسية (Antihistamine)</option>
                <option value="cardiovascular">أدوية القلب (Cardiovascular)</option>
                <option value="cosmetics">تجميل / عناية بالبشرة (Cosmetics)</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            {/* Pricing Section */}
            <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">سعر التكلفة (ل.س)</label>
                <input
                  name="costPrice"
                  type="number"
                  min="0"
                  value={formData.costPrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-emerald-500 font-bold"
                  placeholder="مثال: 1000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  نسبة الربح المستهدفة (%)
                </label>
                <input
                  name="profitMargin"
                  type="number"
                  value={formData.profitMargin}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white font-bold text-emerald-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-emerald-700">سعر البيع النهائي (ل.س)</label>
                <input
                  name="price"
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => {
                    // Reverse calculation if user manually types the final price
                    const newPrice = parseFloat(e.target.value);
                    const cost = parseFloat(formData.costPrice);
                    let newMargin = formData.profitMargin;
                    if (!isNaN(newPrice) && !isNaN(cost) && cost > 0) {
                      newMargin = (((newPrice - cost) / cost) * 100).toFixed(1);
                    }
                    setFormData(prev => ({ ...prev, price: e.target.value, profitMargin: newMargin }));
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-emerald-400 bg-white font-black text-emerald-700 text-lg shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الكمية</label>
              <input
                name="quantity"
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">رقم التشغيلة (Batch No)</label>
              <input
                name="batchNumber"
                required
                value={formData.batchNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">تاريخ الانتهاء</label>
              <input
                name="expiryDate"
                type="date"
                required
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-input hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {drugToEdit ? 'حفظ التعديلات' : 'حفظ الدواء'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDrugModal;
