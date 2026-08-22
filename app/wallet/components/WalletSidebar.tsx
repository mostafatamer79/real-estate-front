import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useSettings } from '@/context/SettingsContext'
import { hapticTick } from '@/lib/haptics'
import { WalletTab } from './types'

interface WalletSidebarProps {
    activeTab: WalletTab;
    onTabChange: (tab: WalletTab) => void;
}

const WalletSidebar: React.FC<WalletSidebarProps> = ({ activeTab, onTabChange }) => {
    const router = useRouter()
    const { t } = useLanguage()
    const { settings } = useSettings()

    const leftSectionItems: {
        icon: string;
        label: string;
        description: string;
        id: WalletTab;
        flagKey: string;
    }[] = [
        {
            icon: '/icons/الفواتير.png',
            label: t('wallet.invoices') || 'الفواتير',
            description: t('wallet.desc.invoices') || 'إدارة الفواتير والمدفوعات',
            id: 'invoices' as WalletTab,
            flagKey: 'wallet_invoices'
        },
        {
            icon: '/icons/العمولات.png',
            label: t('wallet.commission') || 'العمولات',
            description: t('wallet.desc.commission') || 'إدارة رسوم السعي',
            id: 'commission' as WalletTab,
            flagKey: 'wallet_commissions'
        },
        {
            icon: '/icons/files-documents.png',
            label: 'الملفات',
            description: t('wallet.desc.files') || 'المستندات والعقود',
            id: 'files' as WalletTab,
            flagKey: 'wallet_files'
        },
        {
            icon: '/icons/الاستثمارات.png',
            label: t('wallet.invest') || 'الاستثمارات',
            description: t('wallet.desc.invest') || 'المحفظة الاستثمارية',
            id: 'invest' as WalletTab,
            flagKey: 'wallet_investments'
        }
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.div 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className='fixed top-0 right-0 h-dvh-safe w-80 lg:w-[360px] p-5 z-10 hidden lg:block'
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
                            const isSoon = settings.moduleFlags[item.flagKey] === 'soon';
                            const isClosed = settings.moduleFlags[item.flagKey] === 'disabled';
                            
                            if (isClosed) return null;

                            return (
                            <motion.button
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (index * 0.1) }}
                                whileHover={!isSoon ? { scale: 1.015, backgroundColor: 'rgba(255, 255, 255, 0.25)' } : {}}
                                whileTap={!isSoon ? { scale: 0.985 } : {}}
                                onClick={() => !isSoon && onTabChange(item.id)}
                                className={`
                                    group relative p-3 border rounded-2xl 
                                    shadow-sm text-slate-900
                                    transition-all duration-300 flex items-center gap-3 text-right
                                    ${isActive 
                                        ? 'bg-white/40 border-slate-950/30 ring-1 ring-slate-950/5' 
                                        : 'bg-white/15 border-white/20'
                                    }
                                    ${isSoon ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-slate-950/20 hover:shadow-md cursor-pointer'}
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
                                        {isSoon && (
                                            <span className='px-1 py-0.5 bg-orange-50 text-orange-600 text-[8px] font-black rounded-md border border-orange-100 uppercase tracking-tighter shrink-0'>
                                                {t('common.soon') || 'قريباً'}
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

            {/* Mobile Navigation - Floating dark glass dock (matches global bottom nav) */}
            <div
                className='lg:hidden fixed z-30 left-3 right-3 rounded-[1.75rem] border border-white/10 bg-slate-950/90 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.45)]'
                style={{ bottom: 'calc(10px + env(safe-area-inset-bottom))' }}
            >
                {/* Hairline top highlight */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <div className='relative flex items-stretch justify-around h-[66px] px-2'>
                    {leftSectionItems.map((item, index) => {
                        const isActive = activeTab === item.id;
                        const isSoon = settings.moduleFlags[item.flagKey] === 'soon';
                        const isClosed = settings.moduleFlags[item.flagKey] === 'disabled';

                        if (isClosed) return null;

                        return (
                            <button
                                key={index}
                                onClick={() => { if (!isSoon) { hapticTick(); onTabChange(item.id); } }}
                                aria-current={isActive ? 'page' : undefined}
                                className={`relative flex flex-col items-center justify-center flex-1 min-w-[48px] py-1.5 transition-transform active:scale-95 ${isSoon ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="wallet-nav-active-pill"
                                        aria-hidden="true"
                                        className='absolute inset-x-0.5 top-1.5 bottom-1.5 rounded-[1.25rem] bg-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                                        transition={{ type: 'spring', stiffness: 480, damping: 40 }}
                                    />
                                )}
                                <span className='relative z-10 flex items-center justify-center h-7 w-7'>
                                    <img
                                        src={item.icon}
                                        alt={item.label}
                                        className='w-[26px] h-[26px] object-contain'
                                        style={{
                                            filter: isActive
                                                ? 'brightness(0) invert(1) drop-shadow(0 0 6px rgba(255,255,255,0.35))'
                                                : 'brightness(0) invert(0.75)',
                                        }}
                                    />
                                </span>
                                <span
                                    className={`relative z-10 mt-1 text-[12px] leading-none line-clamp-1 w-full px-0.5 text-center transition-colors duration-200 ${
                                        isActive ? 'text-white font-bold' : 'text-slate-300 font-medium opacity-90'
                                    }`}
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
