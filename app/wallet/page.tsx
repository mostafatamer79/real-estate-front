"use client";
import MobileAppHeader from '@/app/src/components/MobileAppHeader';

import React, { useState, useEffect } from 'react'
import { WalletTab, Commission, Invoice } from './components/types'
import WalletSidebar from './components/WalletSidebar'
import CommissionForm from './components/CommissionForm'
import CommissionList from './components/CommissionList'
import CommissionRequestModal from './components/CommissionRequestModal'
import InvoicesSection from './components/InvoicesSection'
import FilesSection from './components/FilesSection'
import InvestmentSection from './components/InvestmentSection'
import { useLanguage } from '@/context/LanguageContext'
import { useSettings } from '@/context/SettingsContext'
import { financialApi } from '@/lib/api'
import { apiClient } from '@/lib/client'
import { useSectionGuard } from '@/hooks/useSectionGuard'
import ComingSoonOverlay from '@/components/ComingSoonOverlay'

const WalletPage = () => {
    const { t } = useLanguage()
    const { settings } = useSettings()
    const { isOpen, message, isAdmin } = useSectionGuard('wallet')
    
    // Determine the first available tab to act as default
    const getFirstAvailableTab = (): WalletTab => {
        const order: { id: WalletTab, key: string }[] = [
            { id: 'invoices', key: 'wallet_invoices' },
            { id: 'commission', key: 'wallet_commissions' },
            { id: 'files', key: 'wallet_files' },
            { id: 'invest', key: 'wallet_investments' }
        ];
        for (const item of order) {
            const flag = settings.moduleFlags[item.key];
            if (flag !== 'soon' && flag !== 'disabled') {
                return item.id;
            }
        }
        return 'invoices'; // Fallback
    };

    const [activeTab, setActiveTab] = useState<WalletTab>(getFirstAvailableTab())
    const [isCommissionFormOpen, setIsCommissionFormOpen] = useState(false)
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [commissions, setCommissions] = useState<Commission[]>([])
    const [files, setFiles] = useState<any[]>([])
    const [balance, setBalance] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)
    const [trackingCommission, setTrackingCommission] = useState<Commission | null>(null)

    // Ensure active tab is updated if settings load later
    useEffect(() => {
        const flagKey = `wallet_${activeTab === 'commission' ? 'commissions' : activeTab === 'invest' ? 'investments' : activeTab}`;
        const flag = settings.moduleFlags[flagKey];
        if (flag === 'soon' || flag === 'disabled') {
            setActiveTab(getFirstAvailableTab());
        }
    }, [settings.moduleFlags]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [invoicesRes, commissionsRes, filesRes, subscriptionsRes, walletRes] = await Promise.all([
                financialApi.getInvoices(),
                financialApi.getCommissions(),
                financialApi.getFiles(),
                apiClient.get('/subscriptions/my').catch(() => ({ data: [] })),
                financialApi.getWallet().catch(() => ({ data: { balance: 0 } }))
            ]);

            if (walletRes.data) {
                setBalance(walletRes.data.balance || 0);
            }

            let mappedInvoices: any[] = [];

            if (invoicesRes.data) {
                mappedInvoices = invoicesRes.data.map((inv: any) => ({
                    status: inv.status === 'paid' ? t('wallet.paid') : t('wallet.pay'),
                    amount: Number(inv.total).toLocaleString(),
                    date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-CA') : '',
                    service: inv.description || t('wallet.service.default'),
                    invoice: inv.id.substring(0, 8).toUpperCase(),
                    originalStatus: inv.status,
                    id: inv.id,
                    isPendingDecision: false,
                    raw: inv
                }));
            }

            if (subscriptionsRes.data) {
                const subscriptionItems = Array.isArray(subscriptionsRes.data) ? subscriptionsRes.data : [];
                const mappedSubscriptions = subscriptionItems.map((sub: any) => ({
                    status: sub.status,
                    amount: Number(sub.amount || 0).toLocaleString(),
                    date: sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-CA') : '',
                    service: `اشتراك ${sub.managementPackage?.name || sub.departmentSlug || ''}`.trim(),
                    invoice: `SUB-${String(sub.id).substring(0, 5).toUpperCase()}`,
                    originalStatus: sub.status,
                    id: sub.id,
                    isSubscription: true,
                    isSubscriptionActive: sub.status === 'نشط',
                    subscriptionId: sub.id,
                    raw: sub
                }));
                mappedInvoices = [...mappedSubscriptions, ...mappedInvoices];
            }

            setInvoices(mappedInvoices);
            if (commissionsRes.data) setCommissions(commissionsRes.data);
            if (filesRes.data) setFiles(filesRes.data);

        } catch (error) {
            console.error("Failed to fetch wallet data:", error);
        } finally {
            setIsLoading(false);
        }
    }

    React.useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const tab = new URLSearchParams(window.location.search).get('tab') as WalletTab | null;
        if (tab && ['invoices', 'commission', 'files', 'invest'].includes(tab)) {
            setActiveTab(tab);
        }
    }, []);

    const handleTabChange = (tab: WalletTab) => {
        setActiveTab(tab)
        if (tab !== 'commission') {
            setIsCommissionFormOpen(false)
        }
    }



    if (!isOpen) {
        return <ComingSoonOverlay sectionName={t('wallet.wallet')} message={message} isAdmin={isAdmin} />
    }

    return (
        <div className='wallet-page-root w-full min-h-dvh-safe bg-gradient-to-br from-slate-50 to-slate-100/90 text-slate-950 relative overflow-hidden' dir="rtl">
            <MobileAppHeader theme="light" title={t('action.wallet')} />
            {/* Ambient Background Glows */}
            <div className='absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none' />
            <div className='absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 pointer-events-none' />
            <div className='absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-purple-400/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none' />

            {/* Mobile aurora effect */}
            <div className="wow-aurora md:hidden pointer-events-none" aria-hidden="true" />

            {/* Loading skeleton */}
            {isLoading && (
                <div className='max-w-[1600px] mx-auto relative z-10 px-4 pt-20 pb-32'>
                    <div className="space-y-4">
                        <div className="wow-skeleton h-12 w-48 rounded-xl" />
                        <div className="wow-skeleton h-8 w-32 rounded-lg" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="wow-skeleton h-32 rounded-2xl" style={{ animationDelay: `${i * 100}ms` }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && (
            <div className='flex max-w-[1600px] mx-auto relative z-10'>
                <div className="wow-reveal" style={{ animationDelay: '100ms' }}>
                <WalletSidebar 
                    activeTab={activeTab} 
                    onTabChange={handleTabChange} 
                />
                </div>

                <div className='flex-1 lg:mr-[360px] p-4 pb-32 lg:pb-4 lg:pt-4'>
                    <div className="wow-reveal" style={{ animationDelay: '200ms' }}>
                    {activeTab === 'invoices' && (
                        <InvoicesSection invoices={invoices} onRefresh={fetchData} balance={balance} />
                    )}

                    {activeTab === 'commission' && (
                        isCommissionFormOpen ? (
                            <CommissionForm 
                                onClose={() => setIsCommissionFormOpen(false)} 
                                onSuccess={() => {
                                    setIsCommissionFormOpen(false);
                                    fetchData();
                                }}
                            />
                        ) : (
                            <CommissionList 
                                commissions={commissions} 
                                onNewRequest={() => setIsCommissionFormOpen(true)} 
                                onTrackRequest={(commission) => setTrackingCommission(commission)}
                            />
                        )
                    )}

                    {activeTab === 'files' && (
                        <FilesSection files={files} />
                    )}

                    {activeTab === 'invest' && (
                        <InvestmentSection />
                    )}
                    </div>
                </div>
            </div>
            )}
            <CommissionRequestModal 
                open={!!trackingCommission} 
                onOpenChange={(open) => !open && setTrackingCommission(null)} 
                requestNumber={trackingCommission?.commissionNumber || ''} 
                requestDate={trackingCommission?.createdAt ? new Date(trackingCommission.createdAt).toLocaleDateString('ar-SA') : ''} 
                requestStatus={trackingCommission?.status as any || 'pending'} 
            />
        </div>
    )
}

export default WalletPage
