import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Building2, MapPin, Phone, FileText, Package,
  ShoppingCart, ArrowRight, Loader2, AlertCircle,
  Pencil, Check, X, Mail, User, Clock, TrendingUp,
  ShieldCheck, BadgeCheck, Warehouse, DollarSign, UploadCloud, Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface WarehouseData {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  managerName?: string;
  commercialRegister?: string;
  warehouseType?: string;
  addressText?: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  invoiceFooterText?: string;
  logo?: string;
}

interface Stats {
  totalDrugs: number;
  totalOrders: number;
  pendingOrders: number;
}

// Inline editable field component
const EditableField = ({
  label, value, icon: Icon, onSave, dir = 'rtl', type = 'text', options
}: {
  label: string;
  value: string;
  icon: any;
  onSave: (val: string) => Promise<void>;
  dir?: string;
  type?: string;
  options?: string[];
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
      <div className="flex-shrink-0 mt-1 w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            {options ? (
              <select
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className="flex-1 text-sm font-bold text-slate-800 border border-indigo-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={type}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                dir={dir}
                className="flex-1 text-sm font-bold text-slate-800 border border-indigo-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
              />
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { setEditing(false); setDraft(value); }}
              className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-bold text-slate-800", !value && "text-slate-400 italic")} dir={dir}>
              {value || 'غير مدرج — اضغط للتعديل'}
            </span>
            <button
              onClick={() => { setEditing(true); setDraft(value); }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const WarehouseProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [wh, setWh] = useState<WarehouseData | null>(null);
  const [stats, setStats] = useState<Stats>({ totalDrugs: 0, totalOrders: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const targetId = user?.role === 'warehouse' ? user._id : id;
  const isAdmin = user?.role === 'admin';

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      const res = await api.get(`/users/warehouse/${targetId}`);
      setWh(res.data.data.user);
      setStats(res.data.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل تحميل بيانات المستودع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) fetchData();
  }, [targetId]);

  const updateField = async (field: string, value: string) => {
    try {
      await api.patch(`/users/${targetId}`, { [field]: value });
      setWh(prev => prev ? { ...prev, [field]: value } : prev);
      showToast('success', 'تم الحفظ بنجاح ✓');
    } catch {
      showToast('error', 'فشل الحفظ، حاول مجدداً');
      throw new Error('save failed');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    setSavingStatus(true);
    try {
      // Must use /users/updateMe endpoint because /:id might not support upload via multer in our setup
      // Note: Admin changing warehouse logo needs a different approach, but usually warehouse edits its own.
      const endpoint = isAdmin && targetId !== user?._id ? `/users/${targetId}` : `/users/updateMe`;
      
      const res = await api.patch(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setWh(prev => prev ? { ...prev, logo: res.data.data.user.logo } : prev);
      showToast('success', 'تم تحديث شعار الفاتورة بنجاح ✓');
    } catch {
      showToast('error', 'فشل رفع الشعار');
    } finally {
      setSavingStatus(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setSavingStatus(true);
    try {
      await api.patch(`/users/${targetId}/status`, { status: newStatus });
      setWh(prev => prev ? { ...prev, status: newStatus, isVerified: newStatus === 'verified' } : prev);
      showToast('success', `تم تغيير الحالة إلى "${statusLabels[newStatus]}" ✓`);
    } catch {
      showToast('error', 'فشل تحديث الحالة');
    } finally {
      setSavingStatus(false);
    }
  };

  const statusLabels: Record<string, string> = {
    verified: 'موثق ومعتمد',
    pending_review: 'قيد المراجعة',
    rejected: 'مرفوض',
    suspended: 'موقف'
  };

  const statusColors: Record<string, string> = {
    verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending_review: 'bg-amber-100 text-amber-700 border-amber-200',
    rejected: 'bg-rose-100 text-rose-700 border-rose-200',
    suspended: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500/60" />
    </div>
  );

  if (error || !wh) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <AlertCircle className="w-12 h-12 text-rose-400" />
      <p className="text-rose-600 font-bold">{error || 'لم يتم العثور على المستودع'}</p>
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-800 font-bold">العودة</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">

      {/* Floating Toast */}
      {toast && (
        <div className={cn(
          "fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl font-bold text-sm transition-all",
          toast.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        )}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        {isAdmin && (
          <button onClick={() => navigate('/users')} className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-sm transition-all">
            <ArrowRight className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/30">
              {wh.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">{wh.name}</h1>
              <p className="text-xs text-slate-500 font-medium">انضم في {new Date(wh.createdAt).toLocaleDateString('ar-SY')}</p>
            </div>
          </div>
        </div>
        {/* Status Badge */}
        <span className={cn("px-4 py-2 rounded-full text-xs font-black border tracking-wide", statusColors[wh.status])}>
          {statusLabels[wh.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===== LEFT COLUMN ===== */}
        <div className="lg:col-span-1 space-y-4">

          {/* Info Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">بيانات المستودع</h2>
              <span className="text-[10px] font-bold text-slate-400">اضغط على أي حقل للتعديل</span>
            </div>
            <div className="p-2">
              <EditableField label="اسم المستودع" value={wh.name} icon={Building2} onSave={v => updateField('name', v)} />
              <EditableField label="رقم الهاتف" value={wh.phone} icon={Phone} onSave={v => updateField('phone', v)} dir="ltr" />
              <EditableField label="البريد الإلكتروني" value={wh.email || ''} icon={Mail} onSave={v => updateField('email', v)} dir="ltr" type="email" />
              <EditableField label="اسم المدير المسؤول" value={wh.managerName || ''} icon={User} onSave={v => updateField('managerName', v)} />
              <EditableField label="رقم السجل التجاري" value={wh.commercialRegister || ''} icon={FileText} onSave={v => updateField('commercialRegister', v)} dir="ltr" />
              <EditableField
                label="نوع المستودع"
                value={wh.warehouseType || 'مستودع عام'}
                icon={Warehouse}
                onSave={v => updateField('warehouseType', v)}
                options={['مستودع عام', 'موزع معتمد', 'شركة مصنعة']}
              />
              <EditableField label="العنوان التفصيلي" value={wh.addressText || ''} icon={MapPin} onSave={v => updateField('addressText', v)} />
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">إعدادات الفاتورة للطباعة</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">شعار المستودع (يظهر في أعلى الفاتورة)</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
                    {wh.logo && wh.logo !== 'default-warehouse.png' ? (
                      <img src={api.defaults.baseURL?.replace('/api/v1', '') + '/' + wh.logo.replace(/\\/g, '/')} alt="Logo" className="w-full h-full object-contain p-2" onError={(e: any) => e.target.style.display = 'none'} />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-slate-500 font-medium">يفضل استخدام صورة شفافة (PNG) بحجم مربع.</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
                      <UploadCloud className="w-4 h-4" />
                      تغيير الشعار
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer Text */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">تذييل الفاتورة (ملاحظات أو شروط)</label>
                <EditableField 
                  label="" 
                  value={wh.invoiceFooterText || ''} 
                  icon={Pencil} 
                  onSave={v => updateField('invoiceFooterText', v)} 
                />
              </div>
            </div>
          </div>

          {/* Status Control (Admin only) */}
          {isAdmin && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/80 p-6">
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">حالة الحساب</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'verified', label: 'تفعيل', className: 'bg-emerald-600 text-white hover:bg-emerald-700' },
                  { key: 'suspended', label: 'تعليق', className: 'bg-amber-500 text-white hover:bg-amber-600' },
                  { key: 'rejected', label: 'رفض', className: 'bg-rose-500 text-white hover:bg-rose-600' },
                  { key: 'pending_review', label: 'مراجعة', className: 'bg-slate-200 text-slate-700 hover:bg-slate-300' },
                ].map(({ key, label, className }) => (
                  <button
                    key={key}
                    onClick={() => updateStatus(key)}
                    disabled={wh.status === key || savingStatus}
                    className={cn(
                      "py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                      className
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Package, label: 'أدوية مدرجة', value: stats.totalDrugs, color: 'from-indigo-500 to-indigo-700', light: 'bg-indigo-50 text-indigo-600' },
              { icon: ShoppingCart, label: 'إجمالي الطلبات', value: stats.totalOrders, color: 'from-emerald-500 to-emerald-700', light: 'bg-emerald-50 text-emerald-600' },
              { icon: Clock, label: 'طلبات معلقة', value: stats.pendingOrders, color: 'from-amber-400 to-orange-500', light: 'bg-amber-50 text-amber-600' },
            ].map(({ icon: Icon, label, value, color, light }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-lg p-5 hover:-translate-y-0.5 transition-transform">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", light)}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-3xl font-black text-slate-800">{value}</p>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-slate-900 to-slate-900" />
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-500 opacity-10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <h3 className="text-base font-black text-white mb-5 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-indigo-500 rounded-full" />
                إدارة عمليات المستودع
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: Package, title: 'إدارة المخزون', desc: 'عرض وتعديل أدوية هذا المستودع', color: 'text-indigo-400', bg: 'bg-indigo-500/10 hover:bg-indigo-500/20', path: '/inventory' },
                  { icon: ShoppingCart, title: 'سجل الطلبات', desc: 'مراجعة طلبات هذا المستودع', color: 'text-emerald-400', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', path: '/orders' },
                  { icon: TrendingUp, title: 'تقرير الأداء', desc: 'مبيعات ومؤشرات الأداء', color: 'text-violet-400', bg: 'bg-violet-500/10 hover:bg-violet-500/20', path: '/orders' },
                  { icon: DollarSign, title: 'الفواتير', desc: 'عرض وإنشاء فواتير المستودع', color: 'text-amber-400', bg: 'bg-amber-500/10 hover:bg-amber-500/20', path: '/orders' },
                ].map(({ icon: Icon, title, desc, color, bg, path }) => (
                  <button
                    key={title}
                    onClick={() => navigate(path)}
                    className={cn("flex items-center gap-4 p-4 rounded-2xl transition-all group text-right border border-white/5", bg)}
                  >
                    <div className="p-2.5 bg-white/5 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
                      <Icon className={cn("w-5 h-5", color)} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-0.5">{title}</h4>
                      <p className="text-slate-400 text-xs">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Verification Info */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-indigo-500" />
              معلومات الحساب
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'حالة التوثيق', value: wh.isVerified ? 'موثق' : 'غير موثق', ok: wh.isVerified },
                { label: 'حالة الحساب', value: statusLabels[wh.status], ok: wh.status === 'verified' },
                { label: 'تاريخ الإنشاء', value: new Date(wh.createdAt).toLocaleDateString('ar-SY'), ok: true },
                { label: 'نوع المستودع', value: wh.warehouseType || 'مستودع عام', ok: true },
              ].map(({ label, value, ok }) => (
                <div key={label} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />
                    <p className="text-sm font-bold text-slate-700">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseProfile;
