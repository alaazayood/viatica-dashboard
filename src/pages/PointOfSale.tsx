import { useState, useEffect } from 'react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { 
  ShoppingCart, Search, Trash2, AlertCircle, 
  Check, Banknote, CreditCard, Loader2, X
} from 'lucide-react';
import PrintInvoiceModal from '../components/PrintInvoiceModal';

interface Drug {
  _id: string;
  name: string;
  manufacturer: string;
  quantity: number; // available stock
  price: number;
}

interface CartItem extends Drug {
  cartQuantity: number;
}

interface Pharmacist {
  _id: string;
  name: string;
  pharmacyName: string;
  role?: string;
  phone?: string;
}

const PointOfSale = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Drugs & Cart
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [searchDrug, setSearchDrug] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customers
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([]);
  const [searchPharmacist, setSearchPharmacist] = useState('');
  
  // Form State
  const [saleType, setSaleType] = useState('manual_pharmacy');
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' OR 'credit'
  const [selectedPharmacist, setSelectedPharmacist] = useState<Pharmacist | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Invoice Modal State
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null);

  // Quick Add Customer Modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', pharmacyName: '' });
  const [addingCustomer, setAddingCustomer] = useState(false);

  useEffect(() => {
    fetchDrugs();
    fetchPharmacists();
  }, []);

  const fetchDrugs = async () => {
    try {
      const res = await api.get('/drugs');
      setDrugs(res.data.data.drugs);
    } catch (err) {
      console.error('Error fetching drugs:', err);
    }
  };

  const fetchPharmacists = async () => {
    try {
      const res = await api.get('/users');
      setPharmacists(res.data.data.users);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      return showToast('error', 'يجب إدخال اسم ورقم هاتف الزبون');
    }
    setAddingCustomer(true);
    try {
      const res = await api.post('/users', {
        name: newCustomer.name,
        phone: newCustomer.phone,
        pharmacyName: newCustomer.pharmacyName || newCustomer.name,
        role: saleType === 'manual_distributor' ? 'customer' : 'pharmacist',
        password: 'Temp1234!', // temporary password
        status: 'verified'
      });
      const created = res.data.data.user;
      // Add to local list and auto-select
      const newP: Pharmacist = { _id: created._id, name: created.name, pharmacyName: created.pharmacyName || created.name };
      setPharmacists(prev => [newP, ...prev]);
      setSelectedPharmacist(newP);
      setShowAddCustomer(false);
      setNewCustomer({ name: '', phone: '', pharmacyName: '' });
      showToast('success', `تمت إضافة الزبون "${created.name}" بنجاح ✓`);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'فشل إضافة الزبون');
    } finally {
      setAddingCustomer(false);
    }
  };

  const addToCart = (drug: Drug) => {
    if (drug.quantity <= 0) return showToast('error', 'الصنف غير متوفر في المخزون!');
    
    setCart(prev => {
      const existing = prev.find(item => item._id === drug._id);
      if (existing) {
        if (existing.cartQuantity >= drug.quantity) {
          showToast('error', 'لقد وصلت للحد الأقصى المتوفر في المخزون');
          return prev;
        }
        return prev.map(item => item._id === drug._id 
          ? { ...item, cartQuantity: item.cartQuantity + 1 } 
          : item
        );
      }
      return [...prev, { ...drug, cartQuantity: 1 }];
    });
  };

  const updateCartQuantity = (id: string, qty: number) => {
    if (qty < 1) return removeFromCart(id);
    const drug = drugs.find(d => d._id === id);
    if (drug && qty > drug.quantity) {
      return showToast('error', 'الكمية المطلوبة تتجاوز المتوفر في المخزون!');
    }
    setCart(prev => prev.map(item => item._id === id ? { ...item, cartQuantity: qty } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return showToast('error', 'السلة فارغة!');
    if (saleType === 'manual_pharmacy' && !selectedPharmacist) {
      return showToast('error', 'يجب تحديد الصيدلية المسجلة');
    }
    if ((saleType === 'manual_distributor' || saleType === 'manual_other') && !customerName && !selectedPharmacist) {
      return showToast('error', 'يجب إدخال اسم أو اختيار العميل');
    }

    setLoading(true);
    try {
      const payload = {
        source: saleType,
        paymentType,
        pharmacistId: selectedPharmacist?._id,
        customerName: selectedPharmacist ? (selectedPharmacist.pharmacyName || selectedPharmacist.name) : customerName,
        customerPhone: selectedPharmacist ? selectedPharmacist.phone : customerPhone,
        notes,
        drugs: cart.map(item => ({
          drug: item._id,
          quantity: item.cartQuantity,
          price: item.price
        }))
      };

      const res = await api.post('/orders/manual-sale', payload);
      showToast('success', res.data.message);
      // Open the invoice modal if returned
      if (res.data.data.invoiceId) {
        setGeneratedInvoiceId(res.data.data.invoiceId);
      }

      // Reset Form
      setCart([]);
      setSelectedPharmacist(null);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      fetchDrugs(); // refresh stock
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'فشل إتمام عملية البيع');
    } finally {
      setLoading(false);
    }
  };

  const filteredDrugs = drugs.filter(d => d.name.toLowerCase().includes(searchDrug.toLowerCase()));

  const filteredPharmacists = pharmacists.filter(p => {
    if (saleType === 'manual_pharmacy' && p.role === 'customer') return false;
    if (saleType === 'manual_distributor' && p.role === 'pharmacist') return false;
    return (p.name && p.name.includes(searchPharmacist)) || 
           (p.pharmacyName && p.pharmacyName.includes(searchPharmacist)) ||
           (p.phone && p.phone.includes(searchPharmacist));
  });

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-6 overflow-hidden">
      {toast && (
        <div className={cn(
          "fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl font-bold text-sm",
          toast.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        )}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Main Column: Products Selection */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800 mb-4">نقطة البيع (POS)</h2>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث عن دواء بالفاتورة السريعة..."
              value={searchDrug}
              onChange={e => setSearchDrug(e.target.value)}
              className="w-full pr-12 pl-4 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
          {filteredDrugs.slice(0, 50).map(drug => (
            <div 
              key={drug._id} 
              onClick={() => addToCart(drug)}
              className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-lg flex flex-col h-full",
                drug.quantity > 0 
                  ? "bg-white border-slate-100 hover:border-indigo-500/30" 
                  : "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">{drug.name}</h3>
                <p className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block">{drug.manufacturer}</p>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">السعر</p>
                  <p className="font-black text-indigo-600">{drug.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-medium">المخزون</p>
                  <p className={cn("text-xs font-bold", drug.quantity > 0 ? "text-emerald-600" : "text-rose-500")}>
                    {drug.quantity > 0 ? drug.quantity : 'نفذ'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Column: Cart & Checkout */}
      <div className="w-[400px] flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden shrink-0">
        <div className="p-5 border-b border-slate-100 bg-indigo-600 text-white">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="font-black text-lg">سلة البيع</h2>
            <span className="mr-auto bg-white/20 text-xs font-bold px-2 py-1 rounded-full">{cart.length} أصناف</span>
          </div>
          
          <div className="bg-white/10 rounded-2xl p-1 mb-4 flex">
            <button 
              onClick={() => { setSaleType('manual_pharmacy'); setSelectedPharmacist(null); setPaymentType('credit'); }}
              className={cn("flex-1 text-xs font-bold py-2 rounded-xl transition-all", saleType === 'manual_pharmacy' ? "bg-white text-indigo-600 shadow-sm" : "text-indigo-100 hover:bg-white/5")}
            >صيدلية مسجلة</button>
            <button 
              onClick={() => { setSaleType('manual_distributor'); setSelectedPharmacist(null); setPaymentType('cash'); }}
              className={cn("flex-1 text-xs font-bold py-2 rounded-xl transition-all", saleType === 'manual_distributor' ? "bg-white text-indigo-600 shadow-sm" : "text-indigo-100 hover:bg-white/5")}
            >موزع / زبون</button>
          </div>

          <div className="relative">
              {selectedPharmacist ? (
                <div className="flex items-center justify-between bg-indigo-700/50 border border-indigo-500/50 rounded-xl p-3">
                  <div>
                    <p className="text-white font-bold text-sm">{selectedPharmacist.pharmacyName || selectedPharmacist.name}</p>
                    <p className="text-indigo-300 text-xs mt-0.5">{selectedPharmacist.name}</p>
                  </div>
                  <button onClick={() => setSelectedPharmacist(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        placeholder={saleType === 'manual_pharmacy' ? "ابحث باسم الصيدلية..." : "ابحث باسم أو هاتف الزبون/الموزع..."}
                        value={searchPharmacist}
                        onChange={e => setSearchPharmacist(e.target.value)}
                        className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-indigo-700/50 border border-indigo-500/50 text-white placeholder:text-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                      {searchPharmacist && (
                        <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl shadow-xl z-50 py-1 text-slate-800">
                          {filteredPharmacists.map(p => (
                            <button key={p._id} onClick={() => { setSelectedPharmacist(p); setSearchPharmacist(''); }} className="w-full text-right px-4 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                              <p className="text-sm font-bold text-indigo-600">{p.pharmacyName}</p>
                              <p className="text-xs text-slate-500">{p.name}</p>
                            </button>
                          ))}
                          {filteredPharmacists.length === 0 && (
                            <p className="text-center text-slate-400 text-xs py-3">لا توجد نتائج</p>
                          )}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowAddCustomer(true)}
                      className="px-3 py-2.5 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                    >+ جديد</button>
                  </div>
                  
                  {saleType !== 'manual_pharmacy' && (
                    <>
                      <div className="relative flex items-center justify-center py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-indigo-500/30"></div></div>
                        <span className="relative bg-indigo-600 px-2 text-[10px] text-indigo-200">أو عميل غير مسجل</span>
                      </div>
                      <div className="space-y-2">
                        <input 
                          type="text"
                          placeholder="الاسم الحركي للزبون / الموزع..."
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-indigo-700/50 border border-indigo-500/50 text-white placeholder:text-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm font-medium">السلة فارغة</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item._id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                  <p className="text-[10px] text-slate-500">{item.price.toLocaleString()} ل.س</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => updateCartQuantity(item._id, item.cartQuantity - 1)} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 font-bold">-</button>
                  <span className="text-sm font-black w-6 text-center">{item.cartQuantity}</span>
                  <button onClick={() => updateCartQuantity(item._id, item.cartQuantity + 1)} className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 font-bold">+</button>
                </div>
                <button onClick={() => removeFromCart(item._id)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-5 border-t border-slate-100 bg-white space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button 
              onClick={() => setPaymentType('cash')}
              className={cn("flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg transition-all", paymentType === 'cash' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:bg-slate-200")}
            ><Banknote className="w-4 h-4" /> نقدي (كاش)</button>
            <button 
              onClick={() => setPaymentType('credit')}
              className={cn("flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg transition-all", paymentType === 'credit' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:bg-slate-200")}
            ><CreditCard className="w-4 h-4" /> آجل (ذمة)</button>
          </div>

          <div className="flex justify-between items-center py-2 border-y border-slate-100 border-dashed">
            <span className="text-sm text-slate-500 font-bold mb-1">الإجمالي المطلوب:</span>
            <span className="text-2xl font-black text-slate-800">{totalAmount.toLocaleString()} <span className="text-sm text-slate-500">ل.س</span></span>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading || cart.length === 0}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
            تثبيت الفاتورة
          </button>
        </div>
      </div>

      {/* Invoice Modal for Printing */}
      {generatedInvoiceId && (
        <PrintInvoiceModal 
          invoiceId={generatedInvoiceId} 
          onClose={() => setGeneratedInvoiceId(null)} 
        />
      )}

      {/* Quick Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-emerald-50 flex justify-between items-center">
              <h3 className="font-black text-slate-800">إضافة {saleType === 'manual_pharmacy' ? 'صيدلية مسجلة' : 'موزع/زبون'} جديد</h3>
              <button onClick={() => setShowAddCustomer(false)} className="p-2 hover:bg-white/50 rounded-xl">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">اسم الزبون *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer(p => ({...p, name: e.target.value}))}
                  placeholder="مثال: أحمد محمد"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">رقم الهاتف *</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer(p => ({...p, phone: e.target.value}))}
                  placeholder="مثال: 0912345678"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">اسم الصيدلية (اختياري)</label>
                <input
                  type="text"
                  value={newCustomer.pharmacyName}
                  onChange={e => setNewCustomer(p => ({...p, pharmacyName: e.target.value}))}
                  placeholder="مثال: صيدلية النور"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddCustomer}
                  disabled={addingCustomer}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  إضافة وتحديد
                </button>
                <button
                  onClick={() => setShowAddCustomer(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointOfSale;
