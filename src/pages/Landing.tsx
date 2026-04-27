import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  BarChart3, 
  Sparkles, 
  Zap, 
  Package, 
  Database,
  PhoneCall,
  CheckCircle2,
  Globe,
  MessagesSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FeatureCard = ({ icon: Icon, title, desc }: any) => (
  <div className="group relative bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-10 rounded-[2.5rem] hover:bg-white/[0.04] transition-all duration-700 hover:-translate-y-2 overflow-hidden">
    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity opacity-0 group-hover:opacity-100" />
    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform duration-500">
      <Icon className="w-8 h-8 text-indigo-400" />
    </div>
    <h3 className="text-2xl text-white font-black mb-4 tracking-tight">{title}</h3>
    <p className="text-slate-400 leading-relaxed font-medium text-lg">{desc}</p>
  </div>
);

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const phoneNumber = "0966262458";

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30 overflow-x-hidden font-sans" dir="rtl">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-900/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-6 lg:px-12">
        {/* Navigation */}
        <header className="flex items-center justify-between py-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/20 border border-white/10 transition-transform hover:scale-105">
                <img src="/viatica_logo.jpeg" alt="Viatica Logo" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block">
              <div className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">Viatica</div>
              <div className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] opacity-80 mt-0.5">Enterprise ERP</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10 bg-white/5 px-8 py-3.5 rounded-full border border-white/5 backdrop-blur-md">
            <a href="#features" className="text-sm font-bold text-slate-300 hover:text-white transition-colors">المميزات</a>
            <a href="#about" className="text-sm font-bold text-slate-300 hover:text-white transition-colors">عن النظام</a>
            <a href="#contact" className="text-sm font-bold text-slate-300 hover:text-white transition-colors">اتصل بنا</a>
          </nav>

          <Link
            to={isAuthenticated ? '/app' : '/login'}
            className="group relative px-8 py-4 rounded-full bg-white text-slate-950 font-black text-sm hover:scale-105 active:scale-95 transition-all overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isAuthenticated ? 'لوحة التحكم' : 'دخول النظام'}
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </span>
          </Link>
        </header>

        {/* Hero Section */}
        <main className="pt-24 pb-32 text-center relative">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md mb-10 animate-fade-in-up">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
            <span className="text-sm font-black text-indigo-300 tracking-wide">الإصدار الأحدث V2.0 متوفر الآن</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-[1.1] mb-10">
            إدارة مستودعات <br/>
            <span className="relative">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">لا تعرف المستحيل.</span>
                <svg className="absolute -bottom-4 w-full h-4 text-indigo-500/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" />
                </svg>
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-400 font-medium leading-relaxed mb-16 px-4">
            المنصة السحابية الأقوى لإدارة سلسلة التوريد الدوائية. 
            سيطرة مطلقة على المخزون، تتبع مالي بالقرش، وتقارير لحظية تدفع نمو أعمالك بثقة.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to={isAuthenticated ? '/app' : '/login'}
              className="w-full sm:w-auto px-12 py-6 rounded-full bg-indigo-600 text-white font-black text-xl hover:bg-indigo-500 shadow-[0_0_60px_rgba(79,70,229,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
            >
              ابدأ تجربتك فوراً
              <Zap className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
            </Link>
            <a 
              href="#contact"
              className="w-full sm:w-auto px-12 py-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-white font-black text-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
            >
              تحدث إلى خبير
              <PhoneCall className="w-6 h-6" />
            </a>
          </div>
        </main>

        {/* Brand Trust Section */}
        <section className="py-10 border-y border-white/5 bg-white/[0.02]">
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                <div className="flex items-center gap-3 text-xl font-black tracking-tight"><ShieldCheck className="w-8 h-8"/> أمان بنكي</div>
                <div className="flex items-center gap-3 text-xl font-black tracking-tight"><Database className="w-8 h-8"/> حوسبة سحابية</div>
                <div className="flex items-center gap-3 text-xl font-black tracking-tight"><Globe className="w-8 h-8"/> وصول من أي مكان</div>
            </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 relative">
            <div className="text-center mb-20">
                <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">كل ما تحتاجه للنجاح.</h2>
                <p className="text-xl text-slate-400 font-medium">أدوات متطورة مصممة خصيصاً لقطاع الأدوية والمستودعات.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={Package}
                    title="مخزون حي وذكي"
                    desc="تتبع دقيق بالعلبة والكرتونة، تنبيهات قبل انتهاء الصلاحية، وجرد لحظي يمنع أي تسرب مالي."
                />
                <FeatureCard 
                    icon={BarChart3}
                    title="محاسبة وتقارير P&L"
                    desc="لوحة بيانات تعرض صافي الأرباح، المصاريف، المديونيات، ومعدلات النمو بضغطة زر واحدة."
                />
                <FeatureCard 
                    icon={ShieldCheck}
                    title="تدقيق Audit Trail"
                    desc="حماية مطلقة لحقوقك. كل عملية إضافة أو حذف مسجلة بالتاريخ والوقت والمستخدم."
                />
                <FeatureCard 
                    icon={CheckCircle2}
                    title="دقة المعاملات المالية"
                    desc="نظام Transactions يضمن عدم خصم أي بضاعة دون تسجيل قيمتها المالية لتفادي الأخطاء البشرية."
                />
                <FeatureCard 
                    icon={Sparkles}
                    title="عروض تسويقية"
                    desc="محرك عروض يتيح لك برمجة خصومات وبونص تلقائي للصيدليات لرفع حجم المبيعات."
                />
                <FeatureCard 
                    icon={Zap}
                    title="نقطة بيع POS طيارة"
                    desc="واجهة مبيعات سريعة تدعم الباركود والبحث المتقدم لإصدار فواتير ضخمة في ثوانٍ."
                />
            </div>
        </section>

        {/* Contact CTA Section */}
        <section id="contact" className="py-32">
            <div className="relative rounded-[4rem] bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-12 lg:p-24 overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.2)]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full" />
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
                    <div className="lg:w-1/2 text-right">
                        <h2 className="text-5xl lg:text-7xl font-black mb-8 leading-tight tracking-tighter">نحن هنا <br/><span className="text-indigo-400">لخدمتك.</span></h2>
                        <p className="text-2xl text-indigo-100/70 font-medium mb-12 leading-relaxed">
                            هل لديك استفسار؟ هل ترغب في حجز عرض توضيحي (Demo) مخصص لمستودعك؟ تواصل معنا مباشرة!
                        </p>
                        
                        <div className="flex flex-col gap-6">
                            <a href={`tel:${phoneNumber}`} className="flex items-center gap-6 group">
                                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                    <PhoneCall className="w-8 h-8 text-indigo-300 group-hover:text-white" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-indigo-300/80 mb-1">اتصال هاتفي</div>
                                    <div className="text-3xl font-black text-white tracking-widest dir-ltr">{phoneNumber}</div>
                                </div>
                            </a>
                            
                            <a href={`https://wa.me/${phoneNumber}`} target="_blank" rel="noreferrer" className="flex items-center gap-6 group mt-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                                    <MessagesSquare className="w-8 h-8 text-emerald-400 group-hover:text-white" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-emerald-400/80 mb-1">واتساب مباشر</div>
                                    <div className="text-2xl font-black text-white">تحدث معنا عبر WhatsApp</div>
                                </div>
                            </a>
                        </div>
                    </div>
                    
                    <div className="lg:w-1/2 w-full">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-12 text-center relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
                             <h3 className="text-3xl font-black mb-6">احصل على نسختك الآن</h3>
                             <p className="text-slate-400 mb-10 text-lg">جاهز لنقل أعمالك للمستوى التالي؟ احصل على حساب تجريبي فوري.</p>
                             <Link
                                to="/login"
                                className="inline-flex w-full px-10 py-6 rounded-full bg-white text-indigo-950 font-black text-2xl hover:scale-105 transition-all shadow-2xl items-center justify-center gap-4"
                            >
                                دخول النظام
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100">
                <img src="/viatica_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-right">
               <span className="text-2xl font-black tracking-tight text-white block mb-1">Viatica ERP</span>
               <span className="text-sm font-bold text-slate-500">منصة إدارة المستودعات المتكاملة.</span>
            </div>
          </div>

          <div className="text-center md:text-left">
             <div className="text-sm font-bold text-slate-500 mb-2">الدعم الفني والمبيعات</div>
             <div className="text-xl font-black text-white tracking-wider dir-ltr">{phoneNumber}</div>
          </div>
        </footer>
        
        <div className="py-6 text-center border-t border-white/5">
             <div className="text-sm text-slate-600 font-black">© {new Date().getFullYear()} Viatica Systems. All rights reserved.</div>
        </div>
      </div>

      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
        .dir-ltr { direction: ltr; display: inline-block; }
      `}</style>
    </div>
  );
}

