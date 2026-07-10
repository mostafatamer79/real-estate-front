"use client";
import React, { useState } from 'react'
import { WalletTab, Commission, Invoice } from './components/types'
import WalletSidebar from './components/WalletSidebar'
import CommissionForm from './components/CommissionForm'
import CommissionList from './components/CommissionList'
import InvoicesSection from './components/InvoicesSection'
import FilesSection from './components/FilesSection'
import InvestmentSection from './components/InvestmentSection'
import { useLanguage } from '@/context/LanguageContext'
import { financialApi } from '@/lib/api'
import { apiClient } from '@/lib/client'
import { useSectionGuard } from '@/hooks/useSectionGuard'
import ComingSoonOverlay from '@/components/ComingSoonOverlay'

const WalletPage = () => {
    const { t } = useLanguage()
    const { isOpen, message, isAdmin } = useSectionGuard('wallet')
    const [activeTab, setActiveTab] = useState<WalletTab>('invoices')
    const [isCommissionFormOpen, setIsCommissionFormOpen] = useState(false)
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [commissions, setCommissions] = useState<Commission[]>([])
    const [files, setFiles] = useState<any[]>([])
    const [balance, setBalance] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [invoicesRes, commissionsRes, filesRes, requestsRes, subscriptionsRes, walletRes] = await Promise.all([
                financialApi.getInvoices(),
                financialApi.getCommissions(),
                financialApi.getFiles(),
                apiClient.get('/service-requests').catch(() => ({ data: [] })),
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
                    isPendingDecision: false
                }));
            }

            if (requestsRes.data) {
                const requestsData = requestsRes.data.items || requestsRes.data.data || requestsRes.data;
                const pendingReqs = Array.isArray(requestsData) 
                    ? requestsData.filter((r: any) => 
                        (r.category === 'legal' || r.category === 'marketing') && 
                        r.clientDecision !== 'accepted'
                      )
                    : [];

                const mappedServiceInvoices = pendingReqs.map((req: any) => ({
                    status: req.clientDecision === 'REJECTED' ? t('legal.decision.rejected') : 
                            (req.invoiceSent ? t('legal.decision.pending') : t('legal.status.underReview') || 'قيد المراجعة والتسعير'),
                    amount: req.invoicePrice ? Number(req.invoicePrice).toLocaleString() : '-',
                    date: req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-CA') : '',
                    service: req.serviceType || 'خدمة عامة',
                    invoice: `REQ-${req.id.substring(0, 5).toUpperCase()}`,
                    originalStatus: req.invoiceSent ? 'pending_decision' : 'under_review',
                    originalDecision: req.clientDecision.toLowerCase(),
                    id: req.id,
                    isPendingDecision: req.invoiceSent && (req.clientDecision === 'PENDING' || req.clientDecision === 'REJECTED'),
                    isUnderReview: !req.invoiceSent
                }));
                mappedInvoices = [...mappedServiceInvoices, ...mappedInvoices];
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
        <div className='w-full min-h-screen bg-muted/50 text-black' dir="rtl">
            <div className='flex max-w-[1600px] mx-auto'>
                <WalletSidebar 
                    activeTab={activeTab} 
                    onTabChange={handleTabChange} 
                />

                <div className='flex-1 lg:mr-[360px] p-4 pt-28 lg:pt-4'>
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
    )
}

export default WalletPage
