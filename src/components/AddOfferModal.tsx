import React, { useState, useEffect } from 'react';
import { X, Loader2, Search } from 'lucide-react';
import api from '../services/api';

interface AddOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddOfferModal: React.FC<AddOfferModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [searchDrug, setSearchDrug] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    type: 'discount',
    drug: '',
    endDate: '',
    color: 'blue',
    discountPercentage: '',
    bonusQuantity: '',
    bonusBase: '',
    freeDelivery: false,
    minOrderValue: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchDrugs();
    }
  }, [isOpen]);

  const fetchDrugs = async () => {
    try {
      const response = await api.get('/drugs');
      setDrugs(response.data.data.drugs);
    } catch (err) {
      console.error("Error fetching drugs:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/offers', formData);
      onSuccess();
      onClose();
      setFormData({
        title: '',
        subtitle: '',
        type: 'discount',
        drug: '',
        endDate: '',
        color: 'blue',
        discountPercentage: '',
        bonusQuantity: '',
        bonusBase: '',
        freeDelivery: false,
        minOrderValue: ''
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل إضافة العرض');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredDrugs = drugs.filter(d => 
    d.name.toLowerCase().includes(searchDrug.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-xl rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold">إضافة عرض أو خصم جديد</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-bold">عنوان العرض</label>
            <input 
              required
              placeholder="مثال: عرض الصيف الهائل"
              className="w-full p-2.5 rounded-lg border border-input bg-background text-sm"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">تفاصيل العرض (Subtitle)</label>
            <textarea 
              required
              rows={3}
              placeholder="مثال: خصم 10% على كافة الطلبيات فوق 1 مليون"
              className="w-full p-2.5 rounded-lg border border-input bg-background text-sm"
              value={formData.subtitle}
              onChange={e => setFormData({...formData, subtitle: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">نوع العرض</label>
              <select 
                className="w-full p-2.5 rounded-lg border border-input bg-background text-sm"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="discount">خصم مبلغ أو نسبة</option>
                <option value="bonus">بونص (كمية مجانية)</option>
                <option value="general">إعلان / تنبيه عام</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">لون البطاقة (في التطبيق)</label>
              <select 
                className="w-full p-2.5 rounded-lg border border-input bg-background text-sm"
                value={formData.color}
                onChange={e => setFormData({...formData, color: e.target.value})}
              >
                <option value="blue">أزرق (أساسي)</option>
                <option value="purple">بنفسجي</option>
                <option value="teal">أخضر مزرق (تيل)</option>
                <option value="orange">برتقالي (تحذيري)</option>
              </select>
            </div>
          </div>

          {formData.type === 'discount' && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
               <label className="text-sm font-bold text-blue-700">نسبة الخصم (%)</label>
               <input 
                type="number"
                placeholder="مثال: 15"
                className="w-full p-2.5 rounded-lg border border-blue-200 bg-background text-sm"
                value={formData.discountPercentage}
                onChange={e => setFormData({...formData, discountPercentage: e.target.value})}
               />
            </div>
          )}

          {formData.type === 'bonus' && (
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <label className="text-sm font-bold text-green-700">الكمية المطلوبة</label>
                <input 
                  type="number"
                  placeholder="مثال: 10"
                  className="w-full p-2.5 rounded-lg border border-green-200 bg-background text-sm"
                  value={formData.bonusBase}
                  onChange={e => setFormData({...formData, bonusBase: e.target.value})}
                />
               </div>
               <div className="space-y-2">
                <label className="text-sm font-bold text-green-700">الكمية المجانية (البونص)</label>
                <input 
                  type="number"
                  placeholder="مثال: 2"
                  className="w-full p-2.5 rounded-lg border border-green-200 bg-background text-sm"
                  value={formData.bonusQuantity}
                  onChange={e => setFormData({...formData, bonusQuantity: e.target.value})}
                />
               </div>
            </div>
          )}

          <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                checked={formData.freeDelivery}
                onChange={e => setFormData({...formData, freeDelivery: e.target.checked})}
              />
              <span className="text-sm font-bold text-orange-700">تطبيق عرض توصيل مجاني</span>
            </label>
            
            {formData.freeDelivery && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-orange-600">الحد الأدنى لقيمة الطلب (ل.س)</label>
                <input 
                  type="number"
                  placeholder="مثال: 500000"
                  className="w-full p-2.5 rounded-lg border border-orange-200 bg-background text-sm"
                  value={formData.minOrderValue}
                  onChange={e => setFormData({...formData, minOrderValue: e.target.value})}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">الدواء المستهدف (اختياري)</label>
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
              <input 
                placeholder="ابحث لاختيار الدواء..."
                className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-input bg-background text-sm mb-2"
                value={searchDrug}
                onChange={e => setSearchDrug(e.target.value)}
              />
            </div>
            <select 
              className="w-full p-2.5 rounded-lg border border-input bg-background text-sm"
              value={formData.drug}
              onChange={e => setFormData({...formData, drug: e.target.value})}
            >
              <option value="">-- بدون دواء محدد --</option>
              {filteredDrugs.slice(0, 10).map(d => (
                <option key={d._id} value={d._id}>{d.name} ({d.manufacturer})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">تاريخ انتهاء العرض</label>
            <input 
              required
              type="date"
              className="w-full p-2.5 rounded-lg border border-input bg-background text-sm"
              value={formData.endDate}
              onChange={e => setFormData({...formData, endDate: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ ونشر العرض
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-input text-muted-foreground font-bold hover:bg-muted"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOfferModal;
