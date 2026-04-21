import { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Megaphone, 
  Trash2, 
  Plus, 
  Loader2, 
  AlertTriangle, 
  Lightbulb, 
  Info, 
  Clock, 
  X,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface FeedItem {
  _id: string;
  type: 'news' | 'warning' | 'tip' | 'update';
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

const FeedManagement = () => {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'news' | 'warning' | 'tip' | 'update'>('news');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/feed');
      setFeeds(response.data.data.feeds);
    } catch (err) {
      console.error('Error fetching feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    setFormLoading(true);
    try {
      await api.post('/feed', { title, content, type });
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      setType('news');
      fetchFeeds();
    } catch (err) {
      console.error('Error creating feed:', err);
      alert('فشل إنشاء الإعلان.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟ سيختفي فوراً من هواتف المستخدمين.')) return;
    
    setDeletingId(id);
    try {
      await api.delete(`/feed/${id}`);
      setFeeds(feeds.filter(f => f._id !== id));
    } catch (err) {
      console.error('Error deleting feed:', err);
      alert('حدث خطأ أثناء החذف.');
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeIcon = (feedType: string) => {
    switch (feedType) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'tip': return <Lightbulb className="w-5 h-5 text-emerald-500" />;
      case 'news': return <Megaphone className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };
  
  const getTypeColor = (feedType: string) => {
    switch (feedType) {
      case 'warning': return "bg-rose-50 text-rose-700 border-rose-100";
      case 'tip': return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case 'news': return "bg-blue-50 text-blue-700 border-blue-100";
      default: return "bg-indigo-50 text-indigo-700 border-indigo-100";
    }
  };

  const getTypeLabel = (feedType: string) => {
    switch (feedType) {
      case 'warning': return "تحذير هام";
      case 'tip': return "نصيحة طبية";
      case 'news': return "خبر حصري";
      default: return "تحديث نظام";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
             <Activity className="w-8 h-8 text-indigo-500" />
             إدارة نبض فارمجي
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-sm">
            قم بنشر التحذيرات، الأخبار الدوائية، أو الإعلانات لتظهر فوراً على شاشات الصيادلة والمستودعات.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 px-6 py-3 font-black text-sm transition-all"
        >
          <Plus className="ml-2 w-5 h-5" />
          إضافة نشرة جديدة
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
      ) : feeds.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-20 text-center border border-slate-100 dark:border-white/10 rounded-[2rem]">
           <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6">
             <Activity className="w-12 h-12 text-indigo-300" />
           </div>
           <h3 className="text-xl font-black text-slate-800 mb-2">منصة النبض فارغة!</h3>
           <p className="text-sm text-slate-500 font-medium max-w-md">
             لم تقم بنشر أي خبر أو تحذير بعد. ابدأ الآن بالضغط على "إضافة نشرة جديدة" للتواصل مع مستخدميك.
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feeds.map((item) => (
            <div key={item._id} className="glass-card rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all p-6 group">
               <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${getTypeColor(item.type)}`}>
                     {getTypeIcon(item.type)}
                     {getTypeLabel(item.type)}
                  </div>
                  <button 
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId === item._id}
                    className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="حذف النشرة"
                  >
                    {deletingId === item._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
               </div>
               <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-tight">
                 {item.title}
               </h3>
               <p className="text-sm text-slate-500 leading-relaxed font-medium mb-6 line-clamp-3">
                 {item.content}
               </p>
               <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <div className="flex items-center gap-1.5">
                     <Clock className="w-3.5 h-3.5" />
                     {format(new Date(item.createdAt), 'dd MMMM yyyy', { locale: ar })}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded">
                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                     نشط ويظهر للمستخدمين
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 border border-slate-100 dark:border-white/10">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-6 left-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500">
               <X className="w-5 h-5" />
             </button>
             
             <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">نشرة جديدة</h2>
             
             <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 block">نوع النشرة</label>
                  <div className="grid grid-cols-2 gap-3">
                     {[
                       { id: 'news', label: 'خبر حصري', icon: Megaphone, color: "text-blue-600 bg-blue-50 border-blue-200" },
                       { id: 'warning', label: 'تحذير هام', icon: AlertTriangle, color: "text-rose-600 bg-rose-50 border-rose-200" },
                       { id: 'tip', label: 'نصيحة طبية', icon: Lightbulb, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                       { id: 'update', label: 'تحديث نظام', icon: Info, color: "text-indigo-600 bg-indigo-50 border-indigo-200" }
                     ].map(t => (
                       <button
                         key={t.id}
                         type="button"
                         onClick={() => setType(t.id as any)}
                         className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                           type === t.id ? t.color + " ring-2 ring-offset-1" : "border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                         }`}
                       >
                         <t.icon className="w-4 h-4" />
                         {t.label}
                       </button>
                     ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 block">عنوان النشرة الأساسي</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: إطلاق دواء جديد في الأسواق..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 block">تفاصيل النشرة والمحتوى</label>
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    placeholder="اكتب التفاصيل التي ستظهر للمستخدم عند الضغط على الخبر..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={formLoading || !title || !content}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'البث إلى الأجهزة فوراً 🚀'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedManagement;
