import React, { useState } from 'react';
import { X, PackagePlus, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';

interface StockReplenishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  drug: any;
}

const StockReplenishModal: React.FC<StockReplenishModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  drug
}) => {
  const [quantity, setQuantity] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !drug) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) {
      setError('يرجى إدخال كمية صحيحة موجبة.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.put(`/drugs/${drug._id}`, { quantity: drug.quantity + Number(quantity) });
      onSuccess();
      onClose();
      setQuantity('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'فشل تحديث الكمية. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-200 border border-slate-100 dark:border-white/10 m-4">
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-8">
           <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
             <PackagePlus className="w-7 h-7" />
           </div>
           <div>
             <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">تجديد المخزون</h2>
             <p className="text-xs font-bold text-slate-500 leading-relaxed mt-1">تحديث مبسط وسريع لكميات الأدوية</p>
           </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm font-bold rounded-lg">
            {error}
          </div>
        )}

        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 mb-6 flex justify-between items-center">
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">الدواء المحدد</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{drug.name}</p>
           </div>
           <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">الكمية الحالية</p>
              <p className="font-black text-xl text-emerald-600">{drug.quantity} عبوة</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
              الكمية الجديدة (المُشتراة / المُضافة)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full text-center text-2xl font-black bg-white dark:bg-black border-2 border-slate-200 dark:border-white/10 rounded-2xl px-4 py-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 dark:text-white"
                placeholder="أدخل العدد..."
              />
            </div>
            <p className="text-center text-[11px] font-bold text-slate-400 mt-2">
              ستضاف هذه الكمية إلى رصيد المخزون الحالي فوراً
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || !quantity}
              className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <PackagePlus className="w-5 h-5" />
                  تأكيد الإضافة
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockReplenishModal;
