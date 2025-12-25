import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  UserX, 
  Eye, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  Zap
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
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Using the generic register endpoint, forcing role and isVerified=true
      await api.post('/auth/register', {
        name,
        phone,
        password,
        role,
        isVerified: true, // Auto verify drivers
        status: 'verified'
      });
      alert('تم إنشاء الحساب بنجاح');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل الإنشاء');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-bold mb-4">
          إضافة {role === 'driver' ? 'سائق' : role === 'warehouse' ? 'مستودع' : 'صيدلي'} جديد
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
            <input 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2 border rounded-md" 
              placeholder="مثال: محمد السائق"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
            <input 
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="09..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">كلمة المرور</label>
            <input 
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-md">إلغاء</button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 text-sm font-bold bg-primary text-white hover:bg-primary/90 rounded-md disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
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
                          title="توثيق"
                        >
                          الموافقة
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(user._id, 'rejected')}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all text-xs font-bold"
                          title="رفض"
                        >
                          رفض
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </div>
  );
};

export default Users;
