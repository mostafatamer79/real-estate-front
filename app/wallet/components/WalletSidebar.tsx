import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { WalletTab } from './types'

interface WalletSidebarProps {
    activeTab: WalletTab;
    onTabChange: (tab: WalletTab) => void;
}

const WalletSidebar: React.FC<WalletSidebarProps> = ({ activeTab, onTabChange }) => {
    const router = useRouter()
    const { t } = useLanguage()

    const leftSectionItems: {
        icon: string;
        label: string;
        description: string;
        id: WalletTab;
    }[] = [
        {
            icon: '/icons/الفواتير.png',
            label: t('wallet.invoices') || 'الفواتير',
            description: t('wallet.desc.invoices') || 'إدارة الفواتير والمدفوعات',
            id: 'invoices' as WalletTab
        },
        {
            icon: '/icons/العمولات.png',
            label: t('wallet.commission') || 'العمولات',
            description: t('wallet.desc.commission') || 'إدارة رسوم السعي',
            id: 'commission' as WalletTab
        },
        {
            icon: '/icons/files-documents.png',
            label: 'الملفات',
            description: t('wallet.desc.files') || 'المستندات والعقود',
            id: 'files' as WalletTab
        },
        {
            icon: '/icons/الاستثمارات.png',
            label: t('wallet.invest') || 'الاستثمارات',
            description: t('wallet.desc.invest') || 'المحفظة الاستثمارية',
            id: 'invest' as WalletTab
        }
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.div 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className='fixed top-0 right-0 h-screen w-80 lg:w-[360px] p-5 z-10 hidden lg:block'
            >
                <div className='bg-white/10 backdrop-blur-2xl p-6 h-full rounded-[1.25rem] border border-white/20 shadow-2xl flex flex-col gap-6'>
                    <div className='space-y-4'>
                        <motion.button 
                            whileHover={{ x: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2.5 text-slate-400 hover:text-slate-900 transition-colors bg-white/5 hover:bg-white/10 px-4.5 py-2.5 rounded-xl w-full border border-white/10"
                        >
                            <ArrowRight className="w-4 h-4 transform rotate-180" />
                            <span className="font-bold text-[10px] uppercase tracking-widest">{t('wallet.backToHome')}</span>
                        </motion.button>
                        <div className='px-1.5'>
                            <h1 className='text-2xl font-black text-slate-900 tracking-tighter mb-1'>{t('wallet.sidebar.mainMenu')}</h1>
                            <div className='w-10 h-1 bg-slate-900 rounded-full' />
                        </div>
                    </div>

                    <div className='flex flex-col gap-3.5 flex-1 overflow-y-auto pr-1 hide-scrollbar'>
                        {leftSectionItems.map((item, index) => {
                            const isActive = activeTab === item.id;
                            return (
                            <motion.button
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (index * 0.1) }}
                                whileHover={{ scale: 1.015, backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                                whileTap={{ scale: 0.985 }}
                                onClick={() => onTabChange(item.id)}
                                className={`
                                    group relative p-3 border rounded-2xl 
                                    shadow-sm hover:shadow-md text-slate-900
                                    transition-all duration-300 flex items-center gap-3 text-right
                                    ${isActive 
                                        ? 'bg-white/40 border-slate-950/30 ring-1 ring-slate-950/5' 
                                        : 'bg-white/15 border-white/20 hover:border-slate-950/20'
                                    }
                                `}
                            >
                                {/* Icon Container */}
                                <div className={`h-12 w-12 shrink-0 rounded-xl shadow-sm transition-all duration-500 flex items-center justify-center ${isActive ? 'bg-slate-950 shadow-stone-400/20 rotate-6 scale-105' : 'bg-white/20 group-hover:bg-white/40 group-hover:-rotate-3'}`}>
                                    <img
                                        src={item.icon}
                                        alt={item.label}
                                        className={`w-full h-full scale-[3] object-contain transition-all duration-300 ${isActive ? 'brightness-0 invert' : ''}`}
                                    />
                                </div>
                                
                                {/* Text Content */}
                                <div className='flex-1 space-y-0.5 min-w-0'>
                                    <div className='flex items-center gap-2'>
                                        <h3 className='font-black text-sm tracking-tight text-slate-900 truncate'>{item.label}</h3>
                                        {item.id === 'invest' && (
                                            <span className='px-1 py-0.5 bg-orange-50 text-orange-600 text-[8px] font-black rounded-md border border-orange-100 uppercase tracking-tighter shrink-0'>
                                                {t('common.soon')}
                                            </span>
                                        )}
                                    </div>
                                    <p className='text-xs font-semibold text-slate-400 group-hover:text-slate-500 transition-colors truncate'>
                                        {item.description}
                                    </p>
                                </div>

                                {/* Arrow Indicator */}
                                <ArrowRight className={`w-4 h-4 shrink-0 transform rotate-180 transition-all group-hover:-translate-x-1 ${isActive ? 'text-slate-950' : 'text-slate-300 group-hover:text-slate-950'}`} />
                            </motion.button>
                        )})}
                    </div>
                </div>
            </motion.div>

            {/* Mobile Navigation - Clean Bottom Tab Bar */}
            <div className='lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/50 backdrop-blur-xl border-t border-white/40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]' style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className='flex items-end justify-around py-2 px-1 sm:px-2'>
                    {leftSectionItems.map((item, index) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={index}
                                onClick={() => onTabChange(item.id)}
                                className='flex flex-col items-center justify-end gap-1.5 flex-1 pb-1.5 pt-2 transition-all min-w-0'
                            >
                                <div
                                    className='flex items-center justify-center transition-all duration-300'
                                    style={{
                                        width: isActive ? '68px' : '60px',
                                        height: isActive ? '68px' : '60px',
                                        borderRadius: isActive ? '50%' : '20px',
                                        backgroundColor: isActive ? '#0f172a' : 'rgba(255, 255, 255, 0.6)',
                                        border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.7)',
                                        boxShadow: isActive ? '0 12px 28px rgba(0,0,0,0.35)' : 'none',
                                        transform: isActive ? 'translateY(-14px)' : 'none',
                                    }}
                                >
                                    <img
                                        src={item.icon}
                                        alt={item.label}
                                        style={{
                                            width: isActive ? '52px' : '48px',
                                            height: isActive ? '52px' : '48px',
                                            objectFit: 'contain',
                                            filter: isActive ? 'brightness(0) invert(1)' : 'opacity(0.9) grayscale(0)',
                                            transform: 'scale(1.2)',
                                        }}
                                    />
                                </div>
                                <span
                                    className='leading-none text-center font-black transition-all duration-300 truncate w-full px-1'
                                    style={{
                                        fontSize: '12px',
                                        color: isActive ? '#0f172a' : '#334155',
                                        marginTop: isActive ? '8px' : '4px',
                                    }}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    )
}

export default WalletSidebar
