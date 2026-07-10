import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsLabel
}) => {
    const { t, language } = useLanguage();

    if (totalPages <= 1) return null;

    return (
        <div className="px-8 py-6 border-t border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages}
                </p>
                {totalItems !== undefined && (
                    <>
                        <span className="w-1 h-1 rounded-full bg-muted" />
                        <p className="text-[10px] font-bold text-slate-400">
                            {totalItems} {itemsLabel || ''}
                        </p>
                    </>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-9 px-4 rounded-xl border border text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 disabled:opacity-30 disabled:hover:border disabled:hover:text-slate-400 transition-all flex items-center gap-2"
                >
                    {language === 'ar' ? 'السابق' : 'Previous'}
                </button>
                
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                            pageNum === 1 || 
                            pageNum === totalPages || 
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`h-9 w-9 rounded-xl text-[10px] font-black transition-all ${
                                        currentPage === pageNum 
                                        ? 'bg-slate-900 text-white shadow-sm' 
                                        : 'text-slate-400 hover:bg-muted'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        } else if (
                            pageNum === currentPage - 2 || 
                            pageNum === currentPage + 2
                        ) {
                            return <span key={pageNum} className="text-slate-300">...</span>;
                        }
                        return null;
                    })}
                </div>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="h-9 px-4 rounded-xl border border text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 disabled:opacity-30 disabled:hover:border disabled:hover:text-slate-400 transition-all flex items-center gap-2"
                >
                    {language === 'ar' ? 'التالي' : 'Next'}
                </button>
            </div>
        </div>
    );
};
