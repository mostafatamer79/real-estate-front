import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, FileText, Calendar, Clock, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface CommissionRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    requestNumber: string;
    requestDate: string;
    requestStatus: 'pending' | 'accepted' | 'rejected';
}

const CommissionRequestModal: React.FC<CommissionRequestModalProps> = ({ 
    open, 
    onOpenChange, 
    requestNumber, 
    requestDate, 
    requestStatus 
}) => {
    const { t } = useLanguage()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-2xl p-0 overflow-hidden bg-card">
                <div className="bg-slate-900 px-8 py-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-card/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-card/5 rounded-full -ml-24 -mb-24 blur-2xl" />
                    
                    <div className="relative">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ring-4 ring-green-400/30 animate-in zoom-in duration-500">
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>
                        <DialogTitle className="text-xl sm:text-3xl font-black text-white mb-2 tracking-tight">{t('wallet.requestSent')}</DialogTitle>
                        <DialogDescription className="text-slate-300 font-medium text-lg">{t('wallet.commissionRequest')}</DialogDescription>
                    </div>
                </div>

                <div className="p-4 sm:p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-3 sm:p-6 bg-muted rounded-2xl border border transition-all hover:shadow-md hover:border group">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 bg-card rounded-xl shadow-sm group-hover:bg-blue-50 transition-colors">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('wallet.commission.table.number')}</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">{requestNumber}</p>
                        </div>
                        <div className="p-3 sm:p-6 bg-muted rounded-2xl border border transition-all hover:shadow-md hover:border group">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 bg-card rounded-xl shadow-sm group-hover:bg-purple-50 transition-colors">
                                    <Calendar className="w-6 h-6 text-purple-600" />
                                </div>
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('wallet.table.date')}</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">{requestDate}</p>
                        </div>
                    </div>

                    <div className="bg-card border rounded-2xl p-3 sm:p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg">
                                    <Clock className="w-5 h-5 text-slate-600" />
                                </div>
                                <span className="font-bold text-slate-700">{t('wallet.table.status')}</span>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-black ${
                                requestStatus === 'accepted' ? 'bg-green-100 text-green-700' :
                                requestStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {t(`wallet.status.${requestStatus}`)}
                            </span>
                        </div>
                        
                        <div className="flex gap-4">
                            <AlertCircle className="w-6 h-6 text-slate-400 flex-shrink-0" />
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                {t('wallet.commissionDisclaimer')}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button 
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-xl text-lg font-bold shadow-lg shadow-stone-400/20 transition-all hover:scale-[1.02]"
                            onClick={() => onOpenChange(false)}
                        >
                            {t('common.close')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default CommissionRequestModal
