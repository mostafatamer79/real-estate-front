import React, { useRef, useState } from 'react';
import { Commission } from './types';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal';
import { WATERMARK_BASE64, COVER_BASE64, LOGO_BASE64 } from './pdfAssets';

interface CommissionPdfGeneratorProps {
    commission: Commission;
}

const CommissionPdfGenerator: React.FC<CommissionPdfGeneratorProps> = ({ commission }) => {
    const { t, language } = useLanguage();
    const pdfRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!pdfRef.current) return;
        setIsGenerating(true);
        
        try {
            pdfRef.current.style.display = 'block';
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const pages = pdfRef.current.querySelectorAll('.pdf-page');
            
            for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                
                const page = pages[i] as HTMLElement;
                const dataUrl = await toJpeg(page, { 
                    quality: 0.95,
                    pixelRatio: 2, // Equivalent to scale: 2
                    backgroundColor: '#ffffff'
                });
                pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }
            
            pdf.save(`commission_${commission.commissionNumber}.pdf`);
        } catch (error) {
            console.error('Error generating PDF', error);
        } finally {
            if (pdfRef.current) {
                pdfRef.current.style.display = 'none';
            }
            setIsGenerating(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isGenerating}
                className="text-slate-800 border-blue-200 hover:bg-blue-50 hover:text-blue-800 transition-all flex items-center gap-2 rounded-lg font-bold"
            >
                <Download className="w-4 h-4" />
                {isGenerating ? t('common.loading') || 'جاري التنزيل...' : t('common.download') || 'تنزيل'}
            </Button>

            {/* Hidden PDF Content */}
            
                

            <div 
                ref={pdfRef} 
                style={{ 
                    display: 'none', 
                    position: 'absolute', 
                    top: '-9999px', 
                    left: '-9999px', 
                    width: '210mm', 
                    direction: 'rtl'
                }}
            >
                {/* Page 1: Main Content */}
                <div 
                    className="pdf-page relative overflow-hidden" 
                    style={{ 
                        width: '210mm', 
                        height: '297mm', 
                        backgroundColor: '#ffffff'
                    }}
                >
                    {/* Full page background watermark */}
                    <div 
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `url(${WATERMARK_BASE64})`,
                            backgroundSize: '150mm',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'repeat',
                            zIndex: 0
                        }}
                    />
                    
                    {/* Header Decoration */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 z-10" />
                    
                    <div className="relative z-10 p-12 h-full flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-8 border-b-2 border-slate-200 mb-8 mt-4">
                            <div className="flex items-center gap-4">
                                <img src={LOGO_BASE64} alt="Logo" className="w-20 h-20 object-contain drop-shadow-md" />
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 mb-1">عقد وساطة عقارية</h1>
                                    <p className="text-slate-700 font-semibold text-lg tracking-wide">الوساطة الرقمية</p>
                                </div>
                            </div>
                            <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div className="text-slate-500 font-medium mb-1 text-sm">رقم الطلب</div>
                                <div className="font-mono text-xl font-bold text-slate-900 mb-2">{commission.commissionNumber}</div>
                                <div className="text-slate-500 font-medium mb-1 text-sm">التاريخ</div>
                                <div className="font-semibold text-slate-800">{commission.createdAt ? new Date(commission.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</div>
                            </div>
                        </div>
                        
                        {/* Content Sections */}
                        <div className="space-y-6 flex-1">
                            
                            {/* Parties */}
                            <div className="bg-white/80  border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                                    <div className="w-2 h-6 bg-slate-800 rounded-full" />
                                    <h2 className="text-xl font-bold text-slate-800">بيانات الأطراف</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                        <div className="text-slate-800 font-bold mb-3 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">1</span>
                                            المالك / البائع
                                        </div>
                                        <div className="space-y-3">
                                            <div><span className="text-slate-500 block text-sm">الاسم</span><span className="font-bold text-lg">{commission.owner?.name}</span></div>
                                            <div><span className="text-slate-500 block text-sm">رقم الهوية</span><span className="font-mono font-medium">{commission.owner?.idNumber}</span></div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                        <div className="text-slate-800 font-bold mb-3 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">2</span>
                                            المشتري
                                        </div>
                                        <div className="space-y-3">
                                            <div><span className="text-slate-500 block text-sm">الاسم</span><span className="font-bold text-lg">{commission.buyer?.name}</span></div>
                                            <div><span className="text-slate-500 block text-sm">رقم الهوية</span><span className="font-mono font-medium">{commission.buyer?.idNumber}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Property */}
                            <div className="bg-white/80  border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                                    <div className="w-2 h-6 bg-slate-800 rounded-full" />
                                    <h2 className="text-xl font-bold text-slate-800">بيانات العقار</h2>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <span className="text-slate-500 block text-sm mb-1">نوع العقار</span>
                                        <span className="font-bold text-slate-800">{commission.propertyType}</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <span className="text-slate-500 block text-sm mb-1">المدينة</span>
                                        <span className="font-bold text-slate-800">{commission.city}</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <span className="text-slate-500 block text-sm mb-1">الحي</span>
                                        <span className="font-bold text-slate-800">{commission.neighborhood}</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <span className="text-slate-500 block text-sm mb-1">المساحة</span>
                                        <span className="font-bold text-slate-800">{commission.area} م²</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <span className="text-slate-500 block text-sm mb-1">رقم الصك</span>
                                        <span className="font-mono font-bold text-slate-800">{commission.deedNumber}</span>
                                    </div>
                                </div>
                                {commission.specifications && (
                                    <div className="mt-4 bg-slate-50 p-4 rounded-xl">
                                        <span className="text-slate-500 block text-sm mb-1">المواصفات</span>
                                        <span className="font-medium text-slate-800">{commission.specifications}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Footer Page 1 */}
                        <div className="pt-6 border-t border-slate-200 mt-auto text-center">
                            <p className="text-slate-400 text-sm font-medium">هذه الوثيقة صادرة من منصة الوساطة الرقمية وموثقة إلكترونياً.</p>
                            <p className="text-slate-300 text-xs mt-1">digitalbrokerage.sa</p>
                        </div>
                    </div>
                </div>

                {/* Page 2: Financial Content */}
                <div 
                    className="pdf-page relative overflow-hidden" 
                    style={{ 
                        width: '210mm', 
                        height: '297mm', 
                        backgroundColor: '#ffffff'
                    }}
                >
                    {/* Full page background watermark */}
                    <div 
                        className="absolute inset-0 z-0 opacity-5"
                        style={{
                            backgroundImage: `url(${WATERMARK_BASE64})`,
                            backgroundSize: '150mm',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'repeat',
                            zIndex: 0
                        }}
                    />
                    
                    {/* Header Decoration */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 z-10" />
                    
                    <div className="relative z-10 p-12 h-full flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-8 border-b-2 border-slate-200 mb-8 mt-4">
                            <div className="flex items-center gap-4">
                                <img src={LOGO_BASE64} alt="Logo" className="w-20 h-20 object-contain drop-shadow-md" />
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 mb-1">عقد وساطة عقارية</h1>
                                    <p className="text-slate-700 font-semibold text-lg tracking-wide">الوساطة الرقمية</p>
                                </div>
                            </div>
                            <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div className="text-slate-500 font-medium mb-1 text-sm">رقم الطلب</div>
                                <div className="font-mono text-xl font-bold text-slate-900 mb-2">{commission.commissionNumber}</div>
                            </div>
                        </div>

                        <div className="space-y-6 flex-1 mt-8">

                            {/* Financial */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-lg text-white">
                                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/20">
                                    <div className="w-2 h-6 bg-slate-400 rounded-full" />
                                    <h2 className="text-xl font-bold">البيانات المالية</h2>
                                </div>
                                <div className="grid grid-cols-3 gap-6 mb-6">
                                    <div>
                                        <span className="text-slate-300 block text-sm mb-1">المبلغ الإجمالي</span>
                                        <span className="font-bold text-2xl">{Number(commission.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal">ر.س</span></span>
                                    </div>
                                    <div>
                                        <span className="text-slate-300 block text-sm mb-1">نسبة السعي</span>
                                        <span className="font-bold text-2xl">{commission.commissionPercentage || 0}%</span>
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-xl p-5 border border-white/20 flex justify-between items-center">
                                    <span className="text-lg font-medium text-slate-200">قيمة السعي (شامل الضريبة)</span>
                                    <span className="font-black text-3xl text-white">{Number(commission.commissionAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg font-normal">ر.س</span></span>
                                </div>
                            </div>

                        </div>
                        
                        {/* Footer Page 2 */}
                        <div className="pt-6 border-t border-slate-200 mt-auto text-center">
                            <p className="text-slate-400 text-sm font-medium">هذه الوثيقة صادرة من منصة الوساطة الرقمية وموثقة إلكترونياً.</p>
                            <p className="text-slate-300 text-xs mt-1">digitalbrokerage.sa</p>
                        </div>
                    </div>
                </div>

                {/* Page 3: Cover / Thank You (ends.jpeg) */}
                <div 
                    className="pdf-page relative overflow-hidden flex flex-col justify-center items-center" 
                    style={{ 
                        width: '210mm', 
                        height: '297mm', 
                        backgroundColor: '#0a0f1d'
                    }}
                >
                    <img src="/ends.jpeg" alt="Thank You" className="absolute inset-0 w-full h-full object-cover" />
                </div>

            </div>
        </>
    );
};

export default CommissionPdfGenerator;
