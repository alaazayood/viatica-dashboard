import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { X, Printer, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface PrintInvoiceModalProps {
  invoiceId: string;
  onClose: () => void;
}

const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${invoiceId}`);
        setInvoice(res.data.data.invoice);
      } catch (err) {
        console.error('Error fetching invoice:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
    setTimeout(onClose, 500); // Close modal automatically after print dialog opens
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
    </div>
  );

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block">
      
      {/* Container */}
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        
        {/* Controls (Hidden in Print) */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex justify-between items-center print:hidden">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-indigo-500/20"
            >
              <Printer className="w-4 h-4" />
              طباعة الفاتورة
            </button>
          </div>
        </div>

        {/* ─── INVOICE PAPER ─── */}
        <div className="p-10 print:p-8" id="printable-invoice">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-10 pb-8 border-b-2 border-slate-100">
            <div>
              {invoice.warehouseSnapshot?.logo && invoice.warehouseSnapshot.logo !== 'default-warehouse.png' ? (
                <img src={invoice.warehouseSnapshot.logo.startsWith('http') ? invoice.warehouseSnapshot.logo : (api.defaults.baseURL?.replace('/api/v1', '') + '/' + invoice.warehouseSnapshot.logo.replace(/\\/g, '/'))} alt="Logo" className="w-24 h-24 object-contain rounded-xl mb-4" />
              ) : (
                <div className="w-16 h-16 bg-slate-100 rounded-xl mb-2 flex items-center justify-center text-slate-400 font-bold text-xl">
                  {invoice.warehouseSnapshot?.name?.charAt(0)}
                </div>
              )}
              <h1 className="text-3xl font-black text-slate-800">{invoice.warehouseSnapshot?.name}</h1>
              {invoice.warehouseSnapshot?.managerName && (
                <p className="text-slate-500 text-sm mt-1">بإدارة: {invoice.warehouseSnapshot.managerName}</p>
              )}
              {invoice.warehouseSnapshot?.phone && (
                <p className="text-slate-500 text-sm mt-1">الهاتف: <span className="font-sans" dir="ltr">{invoice.warehouseSnapshot.phone}</span></p>
              )}
              {invoice.warehouseSnapshot?.address && (
                <p className="text-slate-500 text-sm mt-1">العنوان: {invoice.warehouseSnapshot.address}</p>
              )}
            </div>
            <div className="text-left mt-2">
              <h2 className="text-4xl font-black text-slate-200 tracking-wider uppercase">فاتورة مبيعات</h2>
              <div className="mt-6 space-y-1">
                <p className="text-slate-600 font-bold">رقم الفاتورة: <span className="font-sans ml-2 text-slate-800">{invoice.invoiceNumber || invoice._id.toString().slice(-6)}</span></p>
                <p className="text-slate-600 font-bold">التاريخ: <span className="font-sans ml-2 text-slate-800">{new Date(invoice.createdAt).toLocaleDateString('ar-SY')}</span></p>
                <p className="text-slate-600 font-bold">نوع الدفع: <span className={cn("ml-2 font-black px-2 py-0.5 rounded-md text-xs", invoice.paymentType === 'cash' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>{invoice.paymentType === 'cash' ? 'نقدي' : 'آجل'}</span></p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 rounded-2xl p-6 mb-8 flex justify-between items-center print:bg-white print:border print:border-slate-200">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">معلومات العميل المطالب</p>
              <h3 className="text-xl font-black text-slate-800">{invoice.customerName || 'عميل نقدي'}</h3>
              {invoice.customerPhone && <p className="text-slate-600 text-sm font-sans mt-0.5">{invoice.customerPhone}</p>}
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-right mb-10">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-800 text-sm font-black">
                <th className="py-4 px-2 w-12 text-center">#</th>
                <th className="py-4 px-2">اسم الصنف</th>
                <th className="py-4 px-2">الشركة</th>
                <th className="py-4 px-2 text-center">الكمية</th>
                <th className="py-4 px-2">سعر الوحدة</th>
                <th className="py-4 px-2">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {invoice.items.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 print:hover:bg-transparent">
                  <td className="py-4 px-2 text-center text-slate-400 font-sans">{idx + 1}</td>
                  <td className="py-4 px-2 text-slate-800 font-bold">{item.drugName}</td>
                  <td className="py-4 px-2 text-slate-500 text-xs">{item.manufacturer}</td>
                  <td className="py-4 px-2 text-center font-sans font-bold text-slate-800">{item.quantity}</td>
                  <td className="py-4 px-2 font-sans text-slate-600">{item.unitPrice.toLocaleString()} ل.س</td>
                  <td className="py-4 px-2 font-sans font-black text-indigo-700">{item.total.toLocaleString()} ل.س</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end pt-6 border-t-2 border-slate-100">
            <div className="w-72 space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-sans font-bold">{invoice.subtotal.toLocaleString()} ل.س</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>الخصم:</span>
                  <span className="font-sans font-bold">- {invoice.discount.toLocaleString()} ل.س</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xl font-black text-slate-800 pt-3 border-t border-slate-200">
                <span>الإجمالي المطلوب:</span>
                <span className="font-sans text-2xl">{invoice.total.toLocaleString()} ل.س</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-slate-200 text-center text-slate-500 text-xs font-bold leading-loose whitespace-pre-wrap">
            <p>{invoice.warehouseSnapshot?.invoiceFooterText || 'نشكر لكم ثقتكم بنا.'}</p>
            <p className="text-slate-400 mt-2 font-medium">تم إصدار هذه الفاتورة آلياً بواسطة نظام Viatica Pharmacy Management</p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default PrintInvoiceModal;
