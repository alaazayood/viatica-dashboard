import { useEffect, useState } from 'react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { Building2, Plus, Loader2, Check, AlertCircle, X, Trash2, Pencil, Phone, MapPin } from 'lucide-react';

interface Supplier { _id: string; name: string; company: string; phone: string; address: string; notes: string; }

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{type:'success'|'error';text:string}|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ name:'', company:'', phone:'', address:'', notes:'' });
  const [saving, setSaving] = useState(false);

  const showToast = (t:'success'|'error', text:string) => { setToast({type:t,text}); setTimeout(()=>setToast(null),3000); };

  const fetchSuppliers = async () => {
    setLoading(true);
    try { const res = await api.get('/suppliers'); setSuppliers(res.data.data.suppliers); }
    catch { showToast('error','فشل التحميل'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchSuppliers(); }, []);

  const openAdd = () => { setEditId(null); setForm({name:'',company:'',phone:'',address:'',notes:''}); setShowModal(true); };
  const openEdit = (s: Supplier) => { setEditId(s._id); setForm({name:s.name,company:s.company||'',phone:s.phone||'',address:s.address||'',notes:s.notes||''}); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) return showToast('error','أدخل اسم المورد');
    setSaving(true);
    try {
      if (editId) { await api.patch(`/suppliers/${editId}`, form); showToast('success','تم التعديل ✓'); }
      else { await api.post('/suppliers', form); showToast('success','تمت الإضافة ✓'); }
      setShowModal(false); fetchSuppliers();
    } catch(e:any) { showToast('error', e.response?.data?.message||'فشل الحفظ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا المورد؟')) return;
    try { await api.delete(`/suppliers/${id}`); showToast('success','تم الحذف'); fetchSuppliers(); }
    catch { showToast('error','فشل الحذف — قد يكون مرتبطاً بفواتير شراء'); }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={cn("fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl font-bold text-sm",
          toast.type==='success'?"bg-emerald-500 text-white":"bg-rose-500 text-white"
        )}>{toast.type==='success'?<Check className="w-4 h-4"/>:<AlertCircle className="w-4 h-4"/>}{toast.text}</div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Building2 className="w-7 h-7 text-blue-500"/>الموردين</h1>
          <p className="text-sm text-slate-500 mt-1">إدارة شركات الأدوية والموردين</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-lg shadow-blue-500/20"><Plus className="w-4 h-4"/>إضافة مورد</button>
      </div>

      {loading ? <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-blue-400"/></div>
      : suppliers.length===0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
          <p className="font-bold text-slate-400 text-sm">لم تُضف أي مورد بعد</p>
          <p className="text-xs text-slate-300 mt-1">أضف موردينك (شركات الأدوية) لتبدأ بتسجيل المشتريات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <div key={s._id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-lg">{s.name.charAt(0)}</div>
                  <div>
                    <p className="font-black text-slate-800">{s.name}</p>
                    {s.company && <p className="text-xs text-slate-400">{s.company}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>openEdit(s)} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>handleDelete(s._id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
              {s.phone && <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-1"><Phone className="w-3 h-3 text-slate-300"/>{s.phone}</p>}
              {s.address && <p className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-300"/>{s.address}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50">
              <h3 className="font-black text-slate-800">{editId?'تعديل المورد':'إضافة مورد جديد'}</h3>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-white/50 rounded-xl"><X className="w-5 h-5 text-slate-500"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1"><label className="text-sm font-bold text-slate-700">اسم المورد *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="مثال: تاميكو" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"/></div>
              <div className="space-y-1"><label className="text-sm font-bold text-slate-700">الشركة</label>
                <input value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} placeholder="اختياري" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"/></div>
              <div className="space-y-1"><label className="text-sm font-bold text-slate-700">الهاتف</label>
                <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="اختياري" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"/></div>
              <div className="space-y-1"><label className="text-sm font-bold text-slate-700">العنوان</label>
                <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="اختياري" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"/></div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}{editId?'حفظ التعديل':'إضافة'}
                </button>
                <button onClick={()=>setShowModal(false)} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Suppliers;
