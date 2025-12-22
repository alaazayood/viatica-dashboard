import React, { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle, Loader2, FileSpreadsheet, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '../services/api';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FIELD_MAPPING_DEFAULTS: Record<string, string> = {
  name: 'الاسم التجاري',
  genericName: 'الاسم العلمي',
  manufacturer: 'الشركة المصنعة',
  price: 'السعر',
  quantity: 'الكمية',
  category: 'التصنيف',
  expiryDate: 'تاريخ الانتهاء',
  batchNumber: 'رقم الطبخة',
  dosage: 'العيار',
  dosageForm: 'الشكل الصيدلاني',
};

const MODAL_FIELDS = Object.keys(FIELD_MAPPING_DEFAULTS);

export const SmartImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setError('');
    
    // Auto-upload for preview
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setLoading(true);
      const response = await api.post('/import/preview', formData);
      setHeaders(response.data.data.headers);
      setSampleData(response.data.data.sampleData);
      
      // AI Mapping Emulation: fuzzy match headers to fields
      const initialMapping: Record<string, string> = {};
      const fileHeaders = response.data.data.headers as string[];
      
      MODAL_FIELDS.forEach(field => {
        const fieldLabel = FIELD_MAPPING_DEFAULTS[field].toLowerCase().trim();
        const found = fileHeaders.find(h => {
          const header = h.toLowerCase().trim();
          return header === fieldLabel || 
                 header.includes(fieldLabel) || 
                 fieldLabel.includes(header) ||
                 header === field.toLowerCase();
        });
        if (found) initialMapping[field] = found;
      });
      
      setMapping(initialMapping);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل قراءة الملف');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));

    try {
      setLoading(true);
      await api.post('/import/commit', formData);
      onSuccess();
      onClose();
      // Reset state for next time
      setStep(1);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل استيراد البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              استيراد مجمع للأدوية
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              الخطوة {step} من 3: {step === 1 ? 'اختيار الملف' : step === 2 ? `مطابقة الأعمدة (تم تحديد ${Object.values(mapping).filter(v => !!v).length} من ${MODAL_FIELDS.length})` : 'مراجعة وتأكيد'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange}
              />
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">اسحب ملف Excel أو اضغط هنا</h3>
              <p className="text-sm text-muted-foreground text-center">
                يدعم الملفات بتنسيق .xlsx, .xls, .csv<br/>
                تأكد من أن الصف الأول يحتوي على أسماء الأعمدة
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-left duration-300">
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <p className="text-xs text-yellow-700">يرجى التأكد من مطابقة حقل "الاسم التجاري" على الأقل لتتمكن من المتابعة.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MODAL_FIELDS.map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-bold flex items-center justify-between">
                      {FIELD_MAPPING_DEFAULTS[field]}
                      {mapping[field] ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-[10px] text-destructive">مطلوب*</span>
                      )}
                    </label>
                    <select 
                      value={mapping[field] || ''}
                      onChange={(e) => setMapping({...mapping, [field]: e.target.value})}
                      className="w-full p-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="">-- اختر العمود المقابل --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                   <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">تم تحليل الملف بنجاح</h4>
                  <p className="text-xs text-muted-foreground">راجع عينة من البيانات أدناه قبل المتابعة</p>
                </div>
              </div>

              <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-muted font-bold text-muted-foreground uppercase tracking-wider">
                      <tr>
                        {headers.map(h => (
                          <th key={h} className="px-4 py-3 border-b border-border">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sampleData.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-3 whitespace-nowrap">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20 flex justify-between items-center rounded-b-2xl">
          <button 
            onClick={() => setStep(prev => prev - 1)}
            disabled={step === 1 || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all font-outfit"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </button>
          
          <div className="flex gap-3">
            {step < 3 ? (
              <button
                disabled={step === 1 || loading || Object.values(mapping).filter(v => !!v).length < 1}
                onClick={() => setStep(3)}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg disabled:opacity-50 transition-all"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={handleCommit}
                className="bg-primary text-primary-foreground px-8 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                بدء الاستيراد الفعلي
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartImportModal;
