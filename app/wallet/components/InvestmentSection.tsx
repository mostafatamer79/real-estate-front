import React from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

const InvestmentSection = () => {
    const { t } = useLanguage()

    const investments = [
        { key: 'long', icon: TrendingUp },
        { key: 'short', icon: TrendingUp },
        { key: 'partnership', icon: TrendingUp },
        { key: 'redevelopment', icon: TrendingUp }
    ]

    return (
        <div className='relative'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 pointer-events-none grayscale'>
                {investments.map((item) => (
                    <button
                        key={item.key}
                        disabled
                        className='group relative bg-card border-2 border rounded-2xl shadow-lg text-black flex flex-col items-center justify-center gap-4 p-8'
                    >
                        <div className='p-4 bg-muted rounded-xl'>
                            <item.icon className='h-8 w-8 text-slate-400' />
                        </div>
                        <h3 className='text-slate-400 font-bold text-lg'>{t(`wallet.investment.${item.key}`)}</h3>
                    </button>
                ))}
            </div>

            {/* Coming Soon Overlay */}
            <div className='absolute inset-0 flex items-center justify-center z-10'>
                <div className='bg-card/80 backdrop-blur-md px-10 py-6 rounded-3xl border border shadow-2xl shadow-stone-400 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500'>
                    <div className='p-4 bg-slate-900 rounded-2xl'>
                        <TrendingUp className='h-8 w-8 text-white' />
                    </div>
                    <div className='text-center'>
                        <h2 className='text-2xl font-black text-slate-900 tracking-tight mb-1'>
                            {t('wallet.invest')}
                        </h2>
                        <p className='text-slate-500 font-bold'>
                            {t('wallet.invest.comingSoon')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InvestmentSection
