import React from 'react';
import { paginationItems } from '@/lib/workspace-usability';
import { useLanguage } from '@/context/LanguageContext';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage: requestedPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsLabel
}) => {
    const { t, language } = useLanguage();

    const currentPage = Math.min(totalPages, Math.max(1, requestedPage));
    if (totalPages <= 1) return null;

    return (
        <nav aria-label={language === 'ar' ? 'صفحات النتائج' : 'Results pages'} className="workspace-pagination px-4 sm:px-8 py-4 border-t border-border flex flex-wrap gap-4 items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-muted-foreground dark:text-slate-400 uppercase tracking-widest">
                    {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages}
                </p>
                {totalItems !== undefined && (
                    <>
                        <span className="w-1 h-1 rounded-full bg-muted" />
                        <p className="text-xs font-medium text-muted-foreground dark:text-slate-400">
                            {totalItems} {itemsLabel || ''}
                        </p>
                    </>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-9 px-4 rounded-xl border border text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 hover:text-slate-900 hover:border-border hover:dark:border-slate-900 disabled:opacity-30 disabled:hover:border disabled:hover:text-muted-foreground disabled:hover:dark:text-slate-400 transition-all flex items-center gap-2"
                >
                    {language === 'ar' ? 'السابق' : 'Previous'}
                </button>
                
                <div className="flex items-center gap-1">
                    {paginationItems(currentPage, totalPages).map((page) => typeof page === 'number' ? (
                        <button type="button" key={page} aria-current={page === currentPage ? 'page' : undefined}
                            aria-label={`${t('pagination.page')} ${page}`} onClick={() => onPageChange(page)}
                            className={`h-9 w-9 rounded-xl text-xs font-semibold transition-colors ${page === currentPage ? 'bg-primary text-primary-foreground dark:bg-slate-900 dark:text-white shadow-sm' : 'text-muted-foreground dark:text-slate-400 hover:bg-muted'}`}>
                            {page}
                        </button>
                    ) : <span key={page} aria-hidden="true" className="text-muted-foreground">…</span>)}
                </div>

                <button
                    type="button"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="h-9 px-4 rounded-xl border border text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 hover:text-slate-900 hover:border-border hover:dark:border-slate-900 disabled:opacity-30 disabled:hover:border disabled:hover:text-muted-foreground disabled:hover:dark:text-slate-400 transition-all flex items-center gap-2"
                >
                    {language === 'ar' ? 'التالي' : 'Next'}
                </button>
            </div>
        </nav>
    );
};
