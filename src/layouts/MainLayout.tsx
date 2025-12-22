import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#020617] dark:to-[#0a0a0a] font-sans selection:bg-indigo-100 selection:text-indigo-900" dir="rtl">
      {/* Dynamic Background Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <Header />
        <motion.main 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex-1 p-8 overflow-auto"
        >
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </motion.main>
      </div>
    </div>
  );
};

export default MainLayout;
