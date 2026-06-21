import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
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
            label: 'الملفات والمستندات',
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
            <motion.div 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className='fixed top-0 right-0 h-screen w-80 lg:w-96 p-6 z-10 hidden lg:block'
            >
                <div className='bg-white/90 backdrop-blur-2xl p-8 h-full rounded-[2.5rem] border border-white/50 shadow-2xl flex flex-col gap-8'>
                    <div className='space-y-6'>
                        <motion.button 
                            whileHover={{ x: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push('/')}
                            className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50/50 px-5 py-3 rounded-2xl w-full border border-slate-100/50"
                        >
                            <ArrowRight className="w-5 h-5 transform rotate-180" />
                            <span className="font-bold text-[11px] uppercase tracking-widest">{t('wallet.backToHome')}</span>
                        </motion.button>
                        <div className='px-2'>
                            <h1 className='text-3xl font-black text-slate-900 tracking-tighter mb-1'>{t('wallet.sidebar.mainMenu')}</h1>
                            <div className='w-12 h-1.5 bg-slate-900 rounded-full' />
                        </div>
                    </div>

                    <div className='flex flex-col gap-4 flex-1 overflow-y-auto pr-1 hide-scrollbar'>
                        {leftSectionItems.map((item, index) => {
                            return (
                            <motion.button
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (index * 0.1) }}
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(248, 250, 252, 1)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onTabChange(item.id)}
                                className={`
                                    group relative p-5 bg-white border border-slate-100 rounded-[2rem] 
                                    hover:border-slate-900 shadow-sm hover:shadow-xl text-slate-900
                                    transition-all duration-300 flex items-center gap-5 text-right
                                    ${activeTab === item.id ? 'border-slate-950 bg-slate-50 ring-1 ring-slate-950/10' : ''}
                                `}
                            >
                                {/* Icon Container */}
                                <div className={`h-28 w-28 shrink-0 rounded-[2rem] shadow-lg transition-all duration-500 flex items-center justify-center overflow-hidden ${activeTab === item.id ? 'bg-slate-950 shadow-slate-950/20 rotate-6 scale-105' : 'bg-slate-100 group-hover:bg-slate-200 group-hover:-rotate-3'}`}>
                                    <Image
                                        src={item.icon}
                                        alt={item.label}
                                        width={112}
                                        height={112}
                                        className={`h-[112px] w-[112px] scale-[1.8] object-contain transition-all duration-300 ${activeTab === item.id ? 'brightness-0 invert' : ''}`}
                                    />
                                </div>
                                
                                {/* Text Content */}
                                <div className='flex-1 space-y-0.5'>
                                    <div className='flex items-center gap-2'>
                                        <h3 className='font-black text-sm tracking-tight text-slate-900'>{item.label}</h3>
                                        {item.id === 'invest' && (
                                            <span className='px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[8px] font-black rounded-md border border-orange-100 uppercase tracking-tighter'>
                                                {t('common.soon')}
                                            </span>
                                        )}
                                    </div>
                                    <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors'>
                                        {item.description}
                                    </p>
                                </div>

                                {/* Arrow Indicator */}
                                <ArrowRight className={`w-4 h-4 transform rotate-180 transition-all group-hover:-translate-x-1 ${activeTab === item.id ? 'text-slate-950' : 'text-slate-200 group-hover:text-slate-950'}`} />
                            </motion.button>
                        )})}
                    </div>
                </div>
            </motion.div>

            {/* Mobile Navigation */}
            <div className='lg:hidden fixed top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4'>
                <div className='flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none'>
                    {leftSectionItems.map((item, index) => {
                        return (
                        <button
                            key={index}
                            onClick={() => onTabChange(item.id)}
                            className={`
                                whitespace-nowrap px-5 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3
                                ${activeTab === item.id 
                                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20' 
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }
                            `}
                        >
                            <Image
                                src={item.icon}
                                alt={item.label}
                                width={48}
                                height={48}
                                className={`h-12 w-12 scale-[1.6] object-contain ${activeTab === item.id ? 'brightness-0 invert' : ''}`}
                            />
                            {item.label}
                        </button>
                    )})}
                </div>
            </div>
        </>
    )
}

export default WalletSidebar
