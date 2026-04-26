import { useEffect, useState } from 'react';
import api from '../services/api';
import { cn } from '../lib/utils';
import {
  PackagePlus, Plus, Loader2, Check, AlertCircle, X,
  Filter, Trash2, Search, Download, Building2, Pill
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Supplier { _id: string; name: string; company: string; }
interface Drug { _id: string; name: string; manufacturer: string; price: number; costPrice?: number; quantity: number; packingSize?: number; }
interface PurchaseItem { drug: string; drugName: string; quantity: number; costPrice: number; total: number; unitType: 'unit' | 'carton'; packingSize?: number; }
interface Purchase {
  _id: string; supplier: Supplier; invoiceNumber: string; items: PurchaseItem[];
  subtotal: number; discount: number; total: number; paymentStatus: string; date: string;
}

const Purchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [toast, setToast] = useState<{type:'success'|'error';text:string}|null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);

  // Filters
  const [startDate, setStartDate] = useState(() => { const d=new Date();d.setDate(1);return d.toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterSup, setFilterSup] = useState('all');

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ supplier:'', invoiceNumber:'', paymentStatus:'paid', discount:'0', notes:'', date: new Date().toISOString().split('T')[0] });
  const [cart, setCart] = useState<{drug:string;drugName:string;quantity:number;costPrice:number;unitType:'unit'|'carton';packingSize?:number}[]>([]);
  const [searchDrug, setSearchDrug] = useState('');
  const [saving, setSaving] = useState(false);

  // Quick Add Drug Modal
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickDrug, setQuickDrug] = useState({ name: '', manufacturer: '', price: '', category: 'General', packingSize: '1' });
  const [creatingDrug, setCreatingDrug] = useState(false);

  const showToast = (t:'success'|'error', text:string) => { setToast({type:t,text}); setTimeout(()=>setToast(null),3000); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, dRes] = await Promise.all([
        api.get(`/purchases?startDate=${startDate}&endDate=${endDate}${filterSup!=='all'?'&supplierId='+filterSup:''}`),
        api.get('/suppliers'),
        api.get('/drugs')
      ]);
      setPurchases(pRes.data.data.purchases);
      setTotalSpent(pRes.data.data.totalSpent);
      setSuppliers(sRes.data.data.suppliers);
      setDrugs(dRes.data.data.drugs);
    } catch { showToast('error','فشل تحميل البيانات'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const addToCart = (d: Drug) => {
    if (cart.find(c => c.drug === d._id)) return;
    setCart(prev => [...prev, { drug: d._id, drugName: d.name, quantity: 1, costPrice: d.costPrice || 0, unitType: 'unit', packingSize: d.packingSize || 1 }]);
    setSearchDrug('');
  };

  const handleQuickAddDrug = async () => {
    if (!quickDrug.name || !quickDrug.price) return showToast('error', 'يرجى إكمال بيانات الدواء');
    setCreatingDrug(true);
    try {
      // Create drug with quantity 0 (initial master data)
      const res = await api.post('/drugs', { ...quickDrug, price: Number(quickDrug.price), quantity: 0, packingSize: Number(quickDrug.packingSize) || 1 });
      const newDrug = res.data.data.drug;
      
      // Update local drugs list
      setDrugs(prev => [...prev, newDrug]);
      
      // Add to current purchase cart
      addToCart(newDrug);
      
      showToast('success', 'تم تعريف الصنف الجديد بنجاح ✓');
      setShowQuickAdd(false);
      setQuickDrug({ name: '', manufacturer: '', price: '', category: 'General', packingSize: '1' });
    } catch {
      showToast('error', 'فشل إضافة الصنف الجديد');
    } finally {
      setCreatingDrug(false);
    }
  };

  const cartTotal = cart.reduce((s,i) => s + i.quantity * i.costPrice, 0) - Number(form.discount||0);

  const handleSubmit = async () => {
    if (!form.supplier) return showToast('error','اختر المورد');
    if (cart.length===0) return showToast('error','أضف صنفاً واحداً على الأقل');
    if (cart.some(i => i.costPrice <= 0)) return showToast('error','تأكد من إدخال سعر التكلفة لكل صنف');
    setSaving(true);
    try {
      await api.post('/purchases', { ...form, discount: Number(form.discount||0), items: cart });
      showToast('success','تم تسجيل فاتورة الشراء وتحديث المخزون ✓');
      setShowAdd(false); setCart([]); setForm({supplier:'',invoiceNumber:'',paymentStatus:'paid',discount:'0',notes:'',date:new Date().toISOString().split('T')[0]});
      fetchAll();
    } catch(e:any) { showToast('error', e.response?.data?.message||'فشل التسجيل'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف فاتورة الشراء؟ سيتم عكس الكميات من المخزون.')) return;
    try { await api.delete(`/purchases/${id}`); showToast('success','تم الحذف وعكس المخزون'); fetchAll(); }
    catch { showToast('error','فشل الحذف'); }
  };

  const exportExcel = () => {
    const rows = purchases.flatMap(p => p.items.map(i => ({
      'المورد': p.supplier?.name, 'رقم الفاتورة': p.invoiceNumber||'—', 'الصنف': i.drugName,
      'الكمية': i.quantity, 'سعر التكلفة': i.costPrice, 'الإجمالي': i.total,
      'التاريخ': new Date(p.date).toLocaleDateString('ar-SY')
    })));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المشتريات');
    XLSX.writeFile(wb, `Purchases_${startDate}_${endDate}.xlsx`);
  };

  const filteredDrugs = drugs.filter(d => searchDrug && d.name.toLowerCase().includes(searchDrug.toLowerCase()));

  return (
    <div className="space-y-6">
      {toast && (
        <div className={cn("fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl font-bold text-sm",
          toast.type==='success'?"bg-emerald-500 text-white":"bg-rose-500 text-white"
        )}>{toast.type==='success'?<Check className="w-4 h-4"/>:<AlertCircle className="w-4 h-4"/>}{toast.text}</div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><PackagePlus className="w-7 h-7 text-violet-500"/>المشتريات</h1>
          <p className="text-sm text-slate-500 mt-1">تسجيل فواتير الشراء من الموردين</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} disabled={purchases.length===0} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-bold disabled:opacity-50"><Download className="w-4 h-4"/>Excel</button>
          <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 text-sm font-bold shadow-lg shadow-violet-500/20"><Plus className="w-4 h-4"/>فاتورة شراء</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mb-2">إجمالي المشتريات</p>
          <p className="text-3xl font-black">{totalSpent.toLocaleString()} <span className="text-sm text-violet-200">ل.س</span></p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center"><PackagePlus className="w-5 h-5 text-violet-500"/></div>
          <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">عدد الفواتير</p><p className="text-xl font-black text-slate-800">{purchases.length}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center"><Building2 className="w-5 h-5 text-indigo-500"/></div>
          <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">الموردين</p><p className="text-xl font-black text-slate-800">{suppliers.length}</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-3 items-end">
        <div className="space-y-1 flex-1 min-w-[150px]"><label className="text-xs font-bold text-slate-500">من</label>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"/></div>
        <div className="space-y-1 flex-1 min-w-[150px]"><label className="text-xs font-bold text-slate-500">إلى</label>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"/></div>
        <div className="space-y-1 flex-1 min-w-[150px]"><label className="text-xs font-bold text-slate-500">المورد</label>
          <select value={filterSup} onChange={e=>setFilterSup(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none appearance-none">
            <option value="all">الكل</option>{suppliers.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
          </select></div>
        <button onClick={fetchAll} className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-colors"><Filter className="w-4 h-4"/>فلتر</button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-violet-400"/></div>
        : purchases.length===0 ? <div className="py-16 text-center text-slate-400 text-sm font-bold">لا توجد فواتير شراء حالياً</div>
        : <div className="divide-y divide-slate-50">
          {purchases.map(p => (
            <div key={p._id} className="p-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 font-black text-sm">{p.supplier?.name?.charAt(0)||'م'}</div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{p.supplier?.name} {p.supplier?.company?`(${p.supplier.company})`:''}</p>
                    <p className="text-[10px] text-slate-400">{p.invoiceNumber?`فاتورة #${p.invoiceNumber}`:''} · {new Date(p.date).toLocaleDateString('ar-SY')} · {p.items.length} أصناف</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="font-black text-violet-600">{p.total.toLocaleString()} ل.س</p>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold",
                      p.paymentStatus==='paid'?"bg-emerald-100 text-emerald-700":p.paymentStatus==='credit'?"bg-rose-100 text-rose-700":"bg-amber-100 text-amber-700"
                    )}>{p.paymentStatus==='paid'?'مدفوعة':p.paymentStatus==='credit'?'آجل':'جزئي'}</span>
                  </div>
                  <button onClick={()=>handleDelete(p._id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          ))}
        </div>}
      </div>

      {/* Add Purchase Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-violet-50 sticky top-0 z-10">
              <div><h3 className="font-black text-slate-800 text-lg">فاتورة شراء جديدة</h3><p className="text-xs text-slate-500">سجّل بضاعة واردة من مورد</p></div>
              <button onClick={()=>setShowAdd(false)} className="p-2 hover:bg-white/50 rounded-xl"><X className="w-5 h-5 text-slate-500"/></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-black text-slate-700">المورد *</label>
                  <select value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:ring-2 focus:ring-violet-500/30 outline-none appearance-none">
                    <option value="">— اختر المورد —</option>{suppliers.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                  </select></div>
                <div className="space-y-1"><label className="text-xs font-black text-slate-700">رقم فاتورة المورد</label>
                  <input value={form.invoiceNumber} onChange={e=>setForm(f=>({...f,invoiceNumber:e.target.value}))} placeholder="اختياري" className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-violet-500/30 outline-none"/></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><label className="text-xs font-black text-slate-700">التاريخ</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"/></div>
                <div className="space-y-1"><label className="text-xs font-black text-slate-700">حالة الدفع</label>
                  <select value={form.paymentStatus} onChange={e=>setForm(f=>({...f,paymentStatus:e.target.value}))} className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none">
                    <option value="paid">مدفوع</option><option value="credit">آجل (ذمة)</option><option value="partial">جزئي</option>
                  </select></div>
                <div className="space-y-1"><label className="text-xs font-black text-slate-700">الخصم المكتسب</label>
                  <input type="number" value={form.discount} onChange={e=>setForm(f=>({...f,discount:e.target.value}))} className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-center outline-none"/></div>
              </div>

              {/* Add Items Logic */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700">البحث عن أصناف أو إضافة صنف جديد</label>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                    <input value={searchDrug} onChange={e=>setSearchDrug(e.target.value)} placeholder="ابحث عن دواء موجود..." className="w-full pr-10 pl-3 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-violet-500/30"/>
                    {filteredDrugs.length>0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl shadow-2xl z-50 py-1 border border-slate-100">
                        {filteredDrugs.map(d=>(
                          <button key={d._id} onClick={()=>addToCart(d)} className="w-full text-right px-4 py-2.5 hover:bg-violet-50 text-sm border-b border-slate-50 last:border-0 transition-colors">
                            <span className="font-bold text-slate-800">{d.name}</span> <span className="text-slate-400 text-xs">— {d.manufacturer}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowQuickAdd(true)} type="button" className="px-4 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all">
                    <Plus className="w-4 h-4" /> صنف جديد تماماً
                  </button>
                </div>
              </div>

              {/* Cart Table */}
              {cart.length > 0 ? (
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-xs font-black text-slate-500">الصنف</th>
                        <th className="px-4 py-3 text-xs font-black text-slate-500">الوحدة</th>
                        <th className="px-4 py-3 text-xs font-black text-slate-500">الكمية</th>
                        <th className="px-4 py-3 text-xs font-black text-slate-500 w-32">التكلفة (إفرادي)</th>
                        <th className="px-4 py-3 text-xs font-black text-slate-500">الإجمالي</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {cart.map((item,idx)=>(
                        <tr key={item.drug} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {item.drugName}
                            {item.packingSize && item.packingSize > 1 && <p className="text-[10px] text-slate-400">الكرتونة تحتوي {item.packingSize} علبة</p>}
                          </td>
                          <td className="px-4 py-3">
                            <select value={item.unitType} onChange={e=>setCart(c=>c.map((x,i)=>i===idx?{...x,unitType:e.target.value as 'unit'|'carton'}:x))} className="text-sm px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500/30 font-bold bg-white">
                              <option value="unit">علبة</option>
                              {item.packingSize && item.packingSize > 1 && <option value="carton">كرتونة</option>}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" min="1" value={item.quantity} onChange={e=>setCart(c=>c.map((x,i)=>i===idx?{...x,quantity:Number(e.target.value)}:x))} className="w-20 text-center px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-black"/>
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" min="0" value={item.costPrice} onChange={e=>setCart(c=>c.map((x,i)=>i===idx?{...x,costPrice:Number(e.target.value)}:x))} className="w-28 text-center px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-black text-violet-600"/>
                          </td>
                          <td className="px-4 py-3 font-black text-slate-700">{(item.quantity * item.costPrice).toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={()=>setCart(c=>c.filter((_,i)=>i!==idx))} className="text-rose-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                  <PackagePlus className="w-10 h-10 text-slate-200 mx-auto mb-2"/>
                  <p className="text-sm font-bold text-slate-300">أضف أصنافاً للفاتورة لتبدأ</p>
                </div>
              )}

              {/* Total + Footer */}
              <div className="flex justify-between items-end pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي الفاتورة الصافي</p>
                  <p className="text-3xl font-black text-violet-600">{cartTotal.toLocaleString()} <span className="text-sm text-slate-400">ل.س</span></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={()=>setShowAdd(false)} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">إلغاء</button>
                  <button onClick={handleSubmit} disabled={saving} className="px-8 py-3 bg-violet-600 text-white rounded-xl font-black hover:bg-violet-700 shadow-xl shadow-violet-500/20 flex items-center gap-2 disabled:opacity-50 transition-all">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    تثبيت وترحيل الفاتورة
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Drug Modal (Inner Modal) */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600"/>
                <h3 className="font-black text-slate-800">تعريف صنف جديد</h3>
              </div>
              <button onClick={()=>setShowQuickAdd(false)} className="p-2 hover:bg-white/50 rounded-xl"><X className="w-5 h-5 text-slate-500"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1"><label className="text-sm font-bold text-slate-700">اسم الدواء *</label>
                <input value={quickDrug.name} onChange={e=>setQuickDrug(q=>({...q,name:e.target.value}))} placeholder="مثال: بانادول 500 ملغ" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/></div>
              <div className="space-y-1"><label className="text-sm font-bold text-slate-700">الشركة المصنعة</label>
                <input value={quickDrug.manufacturer} onChange={e=>setQuickDrug(q=>({...q,manufacturer:e.target.value}))} placeholder="اختياري" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-bold text-slate-700">سعر البيع للعموم *</label>
                  <input type="number" value={quickDrug.price} onChange={e=>setQuickDrug(q=>({...q,price:e.target.value}))} placeholder="0" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500/30"/></div>
                <div className="space-y-1"><label className="text-sm font-bold text-slate-700">عدد العلب بالكرتونة (التعبئة)</label>
                  <input type="number" value={quickDrug.packingSize} onChange={e=>setQuickDrug(q=>({...q,packingSize:e.target.value}))} placeholder="1" min="1" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/30"/></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleQuickAddDrug} disabled={creatingDrug} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                  {creatingDrug ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  إضافة للصنف والفاتورة
                </button>
                <button onClick={()=>setShowQuickAdd(false)} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Purchases;
