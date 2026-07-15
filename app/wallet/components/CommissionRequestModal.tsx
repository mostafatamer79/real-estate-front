import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, FileText, Calendar, Clock, AlertCircle, ChevronLeft, MapPin, Building, ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface CommissionRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    requestNumber: string;
    requestDate: string;
    requestStatus: 'pending' | 'accepted' | 'rejected' | string;
}

const CommissionRequestModal: React.FC<CommissionRequestModalProps> = ({ 
    open, 
    onOpenChange, 
    requestNumber, 
    requestDate, 
    requestStatus 
}) => {
    const { t } = useLanguage()

    // Determine colors and icons based on status
    const isAccepted = requestStatus === 'approved' || requestStatus === 'paid' || requestStatus === 'accepted';
    const isRejected = requestStatus === 'rejected';
    const isPending = !isAccepted && !isRejected;

    const statusConfig = {
        icon: isAccepted ? <CheckCircle2 className="w-8 h-8 text-white" /> : 
              isRejected ? <AlertCircle className="w-8 h-8 text-white" /> : 
              <Clock className="w-8 h-8 text-white" />,
        color: isAccepted ? 'from-slate-800 to-slate-900' :
               isRejected ? 'from-slate-800 to-slate-900' :
               'from-slate-800 to-slate-900',
        bgGlow: isAccepted ? 'bg-green-500/20' :
                isRejected ? 'bg-red-500/20' :
                'bg-slate-1000/20',
        textColor: isAccepted ? 'text-slate-700' :
                   isRejected ? 'text-slate-700' :
                   'text-slate-700',
        bgSoft: isAccepted ? 'bg-slate-100' :
                isRejected ? 'bg-slate-100' :
                'bg-slate-100',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="wallet-dialog-content w-[95vw] sm:max-w-xl p-0 overflow-hidden bg-white/95 backdrop-blur-3xl border border-white/40 shadow-2xl rounded-3xl" dir="rtl">
                
                {/* Premium Header */}
                <div className={`relative px-8 pt-12 pb-24 text-center overflow-hidden bg-gradient-to-br ${statusConfig.color}`}>
                    <div className="absolute inset-0 bg-[url('/watermark.png')] opacity-10 mix-blend-overlay background-size-cover"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-3xl mix-blend-overlay animate-pulse"></div>
                    <div className="absolute -top-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-2xl mix-blend-overlay"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/30 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            {statusConfig.icon}
                        </div>
                        <DialogTitle className="text-3xl font-black text-white mb-2 tracking-tight drop-shadow-md">
                            {isAccepted ? 'تم الموافقة على الطلب' : isRejected ? 'تم رفض الطلب' : 'الطلب قيد المراجعة'}
                        </DialogTitle>
                        <DialogDescription className="text-white/80 font-medium text-lg">
                            {t('wallet.commissionRequest') || 'طلب عقد وساطة عقارية'}
                        </DialogDescription>
                    </div>
                </div>

                {/* Overlapping Content Card */}
                <div className="relative z-20 px-6 sm:px-8 -mt-16 pb-8">
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100">
                        
                        {/* Status Ribbon */}
                        <div className="flex justify-center -mt-12 mb-8">
                            <div className={`px-6 py-2 rounded-full border-4 border-white shadow-lg flex items-center gap-2 font-bold text-sm ${statusConfig.bgSoft} ${statusConfig.textColor}`}>
                                <span className="relative flex h-3 w-3">
                                  {isPending && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>}
                                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isAccepted ? 'bg-slate-1000' : isRejected ? 'bg-slate-1000' : 'bg-slate-1000'}`}></span>
                                </span>
                                {t(`bm.status.${requestStatus}`) || t(`status.${requestStatus}`) || requestStatus}
                            </div>
                        </div>

                        {/* Request Details Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="group bg-slate-50 hover:bg-slate-100/50 transition-colors p-4 rounded-2xl border border-slate-100/80 hover:border-slate-300">
                                <div className="flex items-center gap-3 mb-2 text-slate-500">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-slate-600 group-hover:scale-110 transition-transform">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider">{t('wallet.commission.table.number') || 'رقم الطلب'}</span>
                                </div>
                                <p className="text-lg font-black text-slate-900 font-mono tracking-tight group-hover:text-slate-800 transition-colors">{requestNumber}</p>
                            </div>
                            
                            <div className="group bg-slate-50 hover:bg-slate-100/50 transition-colors p-4 rounded-2xl border border-slate-100/80 hover:border-slate-300">
                                <div className="flex items-center gap-3 mb-2 text-slate-500">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-slate-600 group-hover:scale-110 transition-transform">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider">{t('wallet.table.date') || 'التاريخ'}</span>
                                </div>
                                <p className="text-lg font-black text-slate-900 font-mono tracking-tight group-hover:text-slate-800 transition-colors">{requestDate}</p>
                            </div>
                        </div>

                        {/* Timeline / Progress Indicator */}
                        <div className="relative mb-8 pt-4 pb-2">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                                <div className={`h-full ${isAccepted ? 'bg-slate-1000 w-full' : isRejected ? 'bg-slate-1000 w-full' : 'bg-slate-800 w-1/2'} transition-all duration-1000`}></div>
                            </div>
                            <div className="relative flex justify-between z-10 px-2">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg shadow-slate-500/30 ring-4 ring-white">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500">تم الاستلام</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white transition-colors duration-500 ${isAccepted || isRejected ? (isAccepted ? 'bg-slate-1000 text-white shadow-slate-500/30' : 'bg-slate-1000 text-white shadow-slate-500/30') : 'bg-white border-2 border-slate-500 text-slate-500'}`}>
                                        {isAccepted ? <ShieldCheck className="w-4 h-4" /> : isRejected ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-spin-slow" />}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500">المراجعة</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white transition-colors duration-500 delay-300 ${isAccepted ? 'bg-slate-1000 text-white shadow-slate-500/30' : 'bg-slate-100 text-slate-400'}`}>
                                        <Building className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500">الاعتماد</span>
                                </div>
                            </div>
                        </div>

                        {/* Note/Disclaimer */}
                        <div className="bg-slate-50 rounded-2xl p-4 flex gap-4 items-start border border-slate-200">
                            <div className="p-2 bg-slate-200 rounded-full text-slate-700 mt-0.5">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                {t('wallet.commissionDisclaimer') || 'سيتم مراجعة طلبك من قبل فريق العمل في الوساطة الرقمية، وسنوافيك بالتحديثات قريباً عبر الإشعارات.'}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex gap-4">
                        <Button 
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl text-lg font-bold shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1 active:translate-y-0"
                            onClick={() => onOpenChange(false)}
                        >
                            {t('common.close') || 'إغلاق نافذة التتبع'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default CommissionRequestModal
