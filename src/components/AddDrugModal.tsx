import React, { useState, useEffect } from 'react';
import { X, Loader2, Calculator } from 'lucide-react';
import api from '../services/api';

interface Drug {
  _id?: string;
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

interface AddDrugModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  drugToEdit?: Drug | null;
}

const AddDrugModal: React.FC<AddDrugModalProps> = ({ isOpen, onClose, onSuccess, drugToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(15000);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    priceUSD: '',
    price: '',
    quantity: '',
    category: 'other',
    expiryDate: '',
    batchNumber: ''
  });

  useEffect(() => {
    if (drugToEdit) {
      setFormData({
        name: drugToEdit.name,
        genericName: drugToEdit.genericName,
        manufacturer: drugToEdit.manufacturer,
        priceUSD: drugToEdit.priceUSD?.toString() || '',
        price: drugToEdit.price.toString(),
        quantity: drugToEdit.quantity.toString(),
        category: drugToEdit.category,
        expiryDate: drugToEdit.expiryDate.split('T')[0], // Format date for input
        batchNumber: drugToEdit.batchNumber
      });
    } else {
      setFormData({
        name: '',
        genericName: '',
        manufacturer: '',
        priceUSD: '',
        price: '',
        quantity: '',
        category: 'other',
        expiryDate: '',
        batchNumber: ''
      });
    }
  }, [drugToEdit, isOpen]);

  // Auto-calculate SYP price when USD or Rate changes
  useEffect(() => {
    if (formData.priceUSD && exchangeRate) {
      const sypPrice = parseFloat(formData.priceUSD) * exchangeRate;
      setFormData(prev => ({ ...prev, price: sypPrice.toString() }));
    }
  }, [formData.priceUSD, exchangeRate]);

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
                <option value="other">أخرى</option>
              </select>
            </div>

            {/* Currency Section */}
            <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-600">السعر بالدولار ($)</label>
                <input
                  name="priceUSD"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.priceUSD}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-blue-200 bg-background focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  سعر الصرف
                </label>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-600">السعر النهائي (ل.س)</label>
                <input
                  name="price"
                  type="number"
                  required
                  readOnly
                  value={formData.price}
                  className="w-full px-3 py-2 rounded-md border border-green-200 bg-green-50/50 font-bold text-green-700"
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
