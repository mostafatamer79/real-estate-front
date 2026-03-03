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

const WalletPage = () => {
    const { t } = useLanguage()
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
            const [invoicesRes, commissionsRes, filesRes, requestsRes, walletRes] = await Promise.all([
                financialApi.getInvoices(),
                financialApi.getCommissions(),
                financialApi.getFiles(),
                apiClient.get('/service-requests').catch(() => ({ data: [] })),
                financialApi.getWallet().catch(() => ({ data: { balance: 0 } }))
            ]);

            if (walletRes.data) {
                setBalance(walletRes.data.balance || 0);
            }

            let mappedInvoices: any[] = [];

            if (invoicesRes.data) {
                mappedInvoices = invoicesRes.data.map((inv: any) => ({
                    status: inv.status === 'paid' ? t('wallet.paid') : t('wallet.pay'),
                    amount: Number(inv.total).toLocaleString(), // Use 'total' not 'amount'
                    date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-CA') : '',
                    service: inv.description || t('wallet.service.default'),
                    invoice: inv.id.substring(0, 8).toUpperCase(),
                    originalStatus: inv.status,
                    id: inv.id,
                    isPendingDecision: false
                }));
            }

            // Merge pending service requests as invoices requiring decision or under review
            // ONLY for 'legal' and 'marketing' categories, as other categories auto-generate real invoices
            if (requestsRes.data) {
                const requestsData = requestsRes.data.data || requestsRes.data;
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

            setInvoices(mappedInvoices);

            if (commissionsRes.data) {
                // Map commissions if needed, currently direct mapping might work based on types
                setCommissions(commissionsRes.data);
            }

            if (filesRes.data) {
                setFiles(filesRes.data);
            }

        } catch (error) {
            console.error("Failed to fetch wallet data:", error);
        } finally {
            setIsLoading(false);
        }
    }

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleTabChange = (tab: WalletTab) => {
        setActiveTab(tab)
        // Reset commission form view when switching tabs
        if (tab !== 'commission') {
            setIsCommissionFormOpen(false)
        }
    }

    return (
        <div className='w-full min-h-screen bg-slate-50/50 text-black' dir="rtl">
            <div className='flex max-w-[1600px] mx-auto'>
                {/* Fixed Sidebar */}
                <WalletSidebar 
                    activeTab={activeTab} 
                    onTabChange={handleTabChange} 
                />

                {/* Main Content */}
                <div className='flex-1 mr-80 lg:mr-96 p-4'>
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