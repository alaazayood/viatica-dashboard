import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Loader2, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import AddOfferModal from '../components/AddOfferModal';

interface Offer {
  _id: string;
  title: string;
  subtitle: string;
  type: 'bonus' | 'discount' | 'general';
  drug?: { name: string };
  warehouse?: { name: string };
  endDate: string;
  color: string;
  isActive: boolean;
  discountPercentage?: number;
  bonusQuantity?: number;
  bonusBase?: number;
}

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/offers');
      setOffers(response.data.data.offers);
    } catch (err) {
      console.error("Error fetching offers:", err);
      setError('فشل تحميل العروض');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    try {
      await api.delete(`/offers/${id}`);
      setOffers(offers.filter(o => o._id !== id));
    } catch (err) {
      alert('فشل حذف العرض');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">إدارة العروض والخصومات</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة عرض جديد
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-destructive gap-2 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.length > 0 ? (
            offers.map((offer) => (
              <div key={offer._id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col group">
                <div className={`h-2 ${
                  offer.color === 'purple' ? 'bg-purple-500' :
                  offer.color === 'teal' ? 'bg-teal-500' :
                  offer.color === 'orange' ? 'bg-orange-500' : 'bg-primary'
                }`} />
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-muted px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {offer.type === 'bonus' ? 'هدية / بونص' : offer.type === 'discount' ? 'خصم مادي' : 'إعلان عام'}
                    </div>
                    <button 
                      onClick={() => handleDelete(offer._id)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-1">{offer.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{offer.subtitle}</p>
                  
                  {offer.type === 'discount' && offer.discountPercentage && (
                    <div className="mb-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      خصم {offer.discountPercentage}%
                    </div>
                  )}
                  {offer.type === 'bonus' && offer.bonusBase && offer.bonusQuantity && (
                    <div className="mb-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                       بونص {offer.bonusBase} + {offer.bonusQuantity} مجاناً
                    </div>
                  )}

                  <div className="mt-auto space-y-2">
                    {offer.drug && (
                      <div className="flex items-center gap-2 text-xs text-primary font-medium">
                        <CheckCircle className="w-3 h-3" />
                        صنف مرغوب: {offer.drug.name}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                      <Clock className="w-3 h-3" />
                      ينتهي في: {new Date(offer.endDate).toLocaleDateString('ar-SY')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
               لا توجد عروض حالياً، ابدأ بإضافة عرضك الأول!
            </div>
          )}
        </div>
      )}

      <AddOfferModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchOffers}
      />
    </div>
  );
};

export default Offers;
