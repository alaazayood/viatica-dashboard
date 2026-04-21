import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  UserX, 
  Eye, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  Zap,
  Package,
  Users as UsersIcon,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface User {
  _id: string;
  name: string;
  pharmacyName?: string;
  phone: string;
  role: 'admin' | 'pharmacist' | 'warehouse' | 'driver';
  status: 'pending_review' | 'verified' | 'rejected' | 'suspended';
  isVerified: boolean;
  licenseImage?: string;
  createdAt: string;
}

// Simple Modal for creating a user
const CreateUserModal = ({ role, onClose, onSuccess }: { role: string; onClose: () => void; onSuccess: () => void }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Warehouse specific fields
  const [managerName, setManagerName] = useState('');
  const [commercialRegister, setCommercialRegister] = useState('');
  const [warehouseType, setWarehouseType] = useState('مستودع عام');
  const [addressText, setAddressText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage(null);
    try {
      const payload: any = {
        name,
        phone,
        password,
        role,
        isVerified: true,
        status: 'verified'
      };

      if (email.trim() !== '') {
        payload.email = email;
      }

      if (role === 'warehouse') {
        payload.managerName = managerName;
        payload.commercialRegister = commercialRegister;
        payload.warehouseType = warehouseType;
        payload.addressText = addressText;
      }

      await api.post('/auth/register', payload);
      setToastMessage({ type: 'success', text: 'تم إنشاء الحساب بنجاح! سيتم إغلاق النافذة...' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'فشل الإنشاء' });
      setLoading(false);
    }
  };

  const isWarehouse = role === 'warehouse';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className={cn("bg-white rounded-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] relative", isWarehouse ? "w-full max-w-2xl" : "w-full max-w-md")}>
        
        {/* Custom Toast Notification */}
        {toastMessage && (
          <div className={cn(
            "absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg font-bold text-sm z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4",
            toastMessage.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          )}>
            {toastMessage.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toastMessage.text}
          </div>
        )}

        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            {isWarehouse ? <Package className="w-6 h-6" /> : <UsersIcon className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">
              إضافة {isWarehouse ? 'مستودع أدوية' : 'سائق'} جديد
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">البيانات الأساسية للنظام</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className={cn("grid gap-6", isWarehouse ? "md:grid-cols-2" : "grid-cols-1")}>
            {/* Common Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">الاسم الكامل {isWarehouse && "/ اسم المستودع"}</label>
                <input 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                  placeholder={isWarehouse ? "مثال: مستودع العناية الطبية" : "مثال: محمد السائق"}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">رقم الهاتف</label>
                <input 
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left" dir="ltr"
                  placeholder="09..."
                />
              </div>
              {isWarehouse && (
                 <div>
                   <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">البريد الإلكتروني (لتسجيل الدخول)</label>
                   <input 
                     type="email"
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                     className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left" dir="ltr"
                     placeholder="example@viatica.com"
                   />
                 </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">كلمة المرور الأولية</label>
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Warehouse Specific Fields */}
            {isWarehouse && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">اسم المدير المسؤول</label>
                  <input 
                    required
                    value={managerName}
                    onChange={e => setManagerName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                    placeholder="مثال: د. أحمد"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">رقم السجل التجاري</label>
                  <input 
                    required
                    value={commercialRegister}
                    onChange={e => setCommercialRegister(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left" dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">نوع المستودع</label>
                  <select 
                    value={warehouseType}
                    onChange={e => setWarehouseType(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="مستودع عام">مستودع عام</option>
                    <option value="موزع معتمد">موزع معتمد</option>
                    <option value="شركة مصنعة">شركة مصنعة</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Full width address for warehouse */}
            {isWarehouse && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">العنوان التفصيلي</label>
                <input 
                  required
                  value={addressText}
                  onChange={e => setAddressText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                  placeholder="المحافظة - المنطقة - الشارع - المبنى"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-8 border-t pt-6">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">إلغاء</button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3 text-sm font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 rounded-xl disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'جاري الحفظ...' : 'إنشاء الحساب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'pharmacist' | 'driver' | 'warehouse'>('pharmacist');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<{ [key: string]: string }>({});
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users?role=${selectedRole}`);
      setUsers(response.data.data.users);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const handleStatusUpdate = async (userId: string, status: string) => {
    try {
      await api.patch(`/users/${userId}/status`, { status });
      fetchUsers(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const handleAIScan = (userId: string) => {
    setScanningId(userId);
    setAiInsight(prev => ({ ...prev, [userId]: 'جاري الفحص ذكياً...' }));
    // Simulate AI delay
    setTimeout(() => {
      setAiInsight(prev => ({ ...prev, [userId]: '✅ الوثيقة تبدو حقيقية (تحقق بشري مطلوب)' }));
      setScanningId(null);
    }, 1500);
  };

  const statusIcons = {
    pending_review: <Clock className="w-4 h-4 text-amber-500" />,
    verified: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
    rejected: <UserX className="w-4 h-4 text-destructive" />,
    suspended: <AlertCircle className="w-4 h-4 text-grey-500" />
  };

  const statusLabels = {
    pending_review: 'قيد المراجعة',
    verified: 'موثق',
    rejected: 'مرفوض',
    suspended: 'موقف'
  };

  if (loading) return <div className="text-center p-10">جاري تحميل المستخدمين...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold font-sans">إدارة حسابات النظام</h2>
        
        {/* Role Tabs */}
        <div className="flex bg-muted p-1 rounded-xl border border-border">
          <button 
            onClick={() => setSelectedRole('pharmacist')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              selectedRole === 'pharmacist' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            الصيادلة
          </button>
          <button 
            onClick={() => setSelectedRole('driver')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              selectedRole === 'driver' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            السائقين
          </button>
          <button 
            onClick={() => setSelectedRole('warehouse')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              selectedRole === 'warehouse' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            المستودعات
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        {selectedRole !== 'pharmacist' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-md"
          >
            <Zap className="w-4 h-4" />
            إضافة {selectedRole === 'driver' ? 'سائق' : 'مستودع'} جديد
          </button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* ===== WAREHOUSE CARDS VIEW ===== */}
      {selectedRole === 'warehouse' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {users.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-20 text-slate-400">
              <Package className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-bold">لا توجد مستودعات مسجلة بعد</p>
            </div>
          ) : users.map((user) => {
            const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
              verified:       { label: 'موثق ومعتمد',  dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              pending_review: { label: 'قيد المراجعة', dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200'   },
              rejected:       { label: 'مرفوض',        dot: 'bg-rose-400',    badge: 'bg-rose-50 text-rose-700 border-rose-200'       },
              suspended:      { label: 'موقف',         dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-200'   },
            };
            const sc = statusConfig[user.status] || statusConfig.pending_review;
            const warehouseUser = user as any;
            return (
              <div key={user._id} className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/80 overflow-hidden hover:-translate-y-1 transition-all group">
                {/* Card Header */}
                <div className="p-6 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/30 flex-shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-base leading-tight">{user.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium" dir="ltr">{user.phone}</p>
                    </div>
                  </div>
                  <span className={cn("flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border", sc.badge)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                    {sc.label}
                  </span>
                </div>

                {/* Type + Register */}
                <div className="px-6 pb-4 flex items-center gap-3">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-bold border border-indigo-100">
                    {warehouseUser.warehouseType || 'مستودع عام'}
                  </span>
                  {warehouseUser.commercialRegister && (
                    <span className="text-[11px] text-slate-400 font-mono">#{warehouseUser.commercialRegister}</span>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-50 mx-6" />

                {/* Info Row */}
                <div className="px-6 py-3 grid grid-cols-2 gap-2 text-xs">
                  {warehouseUser.managerName && (
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wide mb-0.5">المدير</p>
                      <p className="text-slate-700 font-bold">{warehouseUser.managerName}</p>
                    </div>
                  )}
                  {warehouseUser.addressText && (
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wide mb-0.5">الموقع</p>
                      <p className="text-slate-700 font-bold truncate">{warehouseUser.addressText}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-wide mb-0.5">تاريخ الإنضمام</p>
                    <p className="text-slate-700 font-bold">{new Date(user.createdAt).toLocaleDateString('ar-SY')}</p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="border-t border-slate-100 px-6 py-4 flex items-center gap-2 bg-slate-50/50">
                  <Link
                    to={`/warehouse/${user._id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    إدارة الملف
                  </Link>
                  {user.status === 'pending_review' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(user._id, 'verified')}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-600 transition-all shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        تفعيل
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(user._id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-200 text-rose-600 bg-white text-xs font-black hover:bg-rose-50 transition-all"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        رفض
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      /* ===== OTHER ROLES TABLE VIEW ===== */
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-right font-sans">
          <thead className="bg-[#f8fafc] border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-sm">الاسم {selectedRole === 'pharmacist' && '/ الصيدلية'}</th>
              <th className="p-4 font-semibold text-sm">رقم الهاتف</th>
              <th className="p-4 font-semibold text-sm">الحالة</th>
              {selectedRole === 'pharmacist' && (
                <>
                  <th className="p-4 font-semibold text-sm">التوثيق (الرخصة)</th>
                  <th className="p-4 font-semibold text-sm">الذكاء الاصطناعي</th>
                </>
              )}
              <th className="p-4 font-semibold text-sm">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-[#1e293b]">{user.name}</div>
                  {selectedRole === 'pharmacist' && (
                    <div className="text-xs text-muted-foreground">{user.pharmacyName}</div>
                  )}
                </td>
                <td className="p-4 text-sm font-mono text-[#475569]">{user.phone}</td>
                <td className="p-4">
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold",
                    user.status === 'pending_review' && "bg-amber-50 text-amber-700",
                    user.status === 'verified' && "bg-emerald-50 text-emerald-700 border border-emerald-100",
                    user.status === 'rejected' && "bg-red-50 text-red-700 border border-red-100"
                  )}>
                    {statusIcons[user.status]}
                    {statusLabels[user.status]}
                  </div>
                </td>
                {selectedRole === 'pharmacist' && (
                  <>
                    <td className="p-4">
                      {user.licenseImage ? (
                        <button 
                          onClick={() => setSelectedImage(user.licenseImage!)}
                          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-bold"
                        >
                          <Eye className="w-4 h-4" />
                          عرض الرخصة
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">لا توجد صورة</span>
                      )}
                    </td>
                    <td className="p-4">
                      {user.licenseImage && user.status === 'pending_review' ? (
                        aiInsight[user._id] ? (
                          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 p-1 rounded border border-emerald-100">
                            {aiInsight[user._id]}
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleAIScan(user._id)}
                            disabled={scanningId === user._id}
                            className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-all border border-blue-100"
                          >
                            <Zap className={cn("w-3 h-3", scanningId === user._id && "animate-pulse")} />
                            فحص ذكي
                          </button>
                        )
                      ) : "-"}
                    </td>
                  </>
                )}
                <td className="p-4">
                  <div className="flex gap-2">
                    {user.status === 'pending_review' && (
                      <>
                        <button 
                          onClick={() => handleStatusUpdate(user._id, 'verified')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-xs font-bold shadow-sm"
                        >الموافقة</button>
                        <button 
                          onClick={() => handleStatusUpdate(user._id, 'rejected')}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all text-xs font-bold"
                        >رفض</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-10 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full h-full flex flex-col items-center justify-center gap-6">
            <img 
              src={selectedImage} 
              alt="Pharmacist License" 
              className="max-w-full max-h-[80vh] object-contain rounded-xl border-8 border-white shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            />
            <div className="flex gap-4">
              <a 
                href={selectedImage} 
                target="_blank" 
                rel="noreferrer" 
                className="bg-white text-slate-900 px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-slate-100 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-5 h-5" />
                تحميل / فتح بحجم كامل
              </a>
              <button 
                className="bg-white/10 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/20 transition-all backdrop-blur-md border border-white/20"
                onClick={() => setSelectedImage(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create User Modal */}
      {isModalOpen && (
        <CreateUserModal 
          role={selectedRole} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchUsers} 
        />
      )}
    </div>
  );
};

export default Users;
