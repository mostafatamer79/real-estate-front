import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { X, Plus, Trash2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { Broker, CommissionFormData } from './types'
import BrokerModal from './BrokerModal'
import CommissionRequestModal from './CommissionRequestModal'
import { commissionApi } from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'

interface CommissionFormProps {
    onClose: () => void;
    onSuccess?: () => void;
}

const CommissionForm: React.FC<CommissionFormProps> = ({ onClose, onSuccess }) => {
    const { t } = useLanguage()

    // Form State
    const [commissionForm, setCommissionForm] = useState<CommissionFormData>({
        status: '',
        name: '',
        license: '',
        ownerName: '',
        ownerId: '',
        ownerStatus: '',
        ownerAgencyNumber: '',
        ownerPropertyType: '',
        ownerPercentage: '',
        buyerName: '',
        buyerId: '',
        buyerStatus: '',
        buyerAgencyNumber: '',
        buyerPercentage: '',
        propertyType: '',
        city: '',
        neighborhood: '',
        streetName: '',
        planNumber: '',
        plotNumber: '',
        area: '',
        deedNumber: '',
        propertyAge: '',
        numberOfFloors: '',
        numberOfUnits: '',
        specifications: '',
        totalAmount: '',
        amountAfterDiscount: '',
        commissionPercentage: '',
        commission: '',
        transferType: '',
    })

    // Broker State
    const [brokers, setBrokers] = useState<Broker[]>([])
    const [showBrokerModal, setShowBrokerModal] = useState(false)
    const [editingBroker, setEditingBroker] = useState<number | null>(null)
    const [brokerForm, setBrokerForm] = useState({
        name: '',
        license: '',
        percentage: '',
        mobile: '',
        email: ''
    })

    // Request Modal State
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [requestStatus, setRequestStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending')
    const [requestNumber, setRequestNumber] = useState('')
    const [requestDate, setRequestDate] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleCommissionSubmit = async () => {
        // Validation
        const requiredFields = [
            { key: 'propertyType', label: t('wallet.commission.propertyType') },
            { key: 'city', label: t('wallet.commission.city') },
            { key: 'neighborhood', label: t('wallet.commission.neighborhood') },
            { key: 'streetName', label: t('wallet.commission.street') },
            { key: 'planNumber', label: t('wallet.commission.planNum') },
            { key: 'plotNumber', label: t('wallet.commission.plotNum') },
            { key: 'area', label: t('wallet.commission.area') },
            { key: 'deedNumber', label: t('wallet.commission.deedNum') },
            { key: 'totalAmount', label: t('wallet.commission.totalAmount') },
            { key: 'commissionPercentage', label: t('wallet.commission.commissionPercentage') },
            { key: 'ownerName', label: t('wallet.commission.ownerData') + ' - ' + t('wallet.commission.form.name') },
            { key: 'ownerId', label: t('wallet.commission.ownerData') + ' - ' + t('wallet.commission.form.id') },
            { key: 'buyerName', label: t('wallet.commission.buyerData') + ' - ' + t('wallet.commission.form.name') },
            { key: 'buyerId', label: t('wallet.commission.buyerData') + ' - ' + t('wallet.commission.form.id') },
        ];

        for (const field of requiredFields) {
            if (!commissionForm[field.key as keyof CommissionFormData]) {
                toast.error(`${t('common.required') || 'مطلوب'}: ${field.label}`);
                return;
            }
        }

        setIsSubmitting(true)
        try {
            // Map the frontend form to CreateCommissionDto
            const payload = {
                type: 'sale', // Default or from form if available
                propertyType: commissionForm.propertyType,
                city: commissionForm.city,
                neighborhood: commissionForm.neighborhood,
                streetName: commissionForm.streetName,
                planNumber: commissionForm.planNumber,
                plotNumber: commissionForm.plotNumber,
                area: parseFloat(commissionForm.area) || 0,
                deedNumber: commissionForm.deedNumber,
                propertyAge: parseInt(commissionForm.propertyAge) || 0,
                numberOfFloors: parseInt(commissionForm.numberOfFloors) || 0,
                numberOfUnits: parseInt(commissionForm.numberOfUnits) || 0,
                specifications: commissionForm.specifications,
                totalAmount: parseFloat(commissionForm.totalAmount) || 0,
                commissionPercentage: parseFloat(commissionForm.commissionPercentage) || 0,
                owner: {
                    name: commissionForm.ownerName,
                    idNumber: commissionForm.ownerId,
                    partyType: commissionForm.ownerStatus || 'owner',
                    agencyNumber: commissionForm.ownerAgencyNumber,
                    propertyType: commissionForm.ownerPropertyType,
                    agreedPercentage: parseFloat(commissionForm.ownerPercentage) || 0,
                },
                buyer: {
                    name: commissionForm.buyerName,
                    idNumber: commissionForm.buyerId,
                    partyType: commissionForm.buyerStatus || 'buyer',
                    agencyNumber: commissionForm.buyerAgencyNumber,
                    agreedPercentage: parseFloat(commissionForm.buyerPercentage) || 0,
                },
                brokers: brokers.map(b => ({
                    name: b.name,
                    license: b.license,
                    percentage: parseFloat(b.percentage) || 0,
                    mobile: b.mobile,
                    email: b.email
                })),
                notes: commissionForm.specifications
            };

            const response = await commissionApi.create(payload);
            
            if (response.data) {
                setRequestStatus('pending')
                setRequestNumber(response.data.commissionNumber)
                setRequestDate(new Date(response.data.createdAt).toLocaleDateString('en-CA'))
                setShowRequestModal(true)
                toast.success(t('wallet.commission.success') || 'تم إرسال الطلب بنجاح');
                if (onSuccess) {
                    onSuccess();
                }
            }
        } catch (error) {
            console.error("Submission failed:", error);
            toast.error(t('common.error') || 'حدث خطأ أثناء إرسال الطلب');
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSaveBroker = (broker: Broker) => {
        if (editingBroker) {
            setBrokers(brokers.map(b => b.id === broker.id ? broker : b))
        } else {
            setBrokers([...brokers, broker])
        }
        setEditingBroker(null)
        setBrokerForm({
            name: '',
            license: '',
            percentage: '',
            mobile: '',
            email: ''
        })
    }

    return (
        <div className='flex-1'>
            <Card className='bg-white rounded-xl shadow-lg p-6 overflow-y-auto max-h-[calc(100vh-2rem)]'>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-black">{t('wallet.commission.title')}</h2>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                    >
                        <span>{t('common.close')}</span>
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Commission Form Content */}
                <div className="space-y-6">
                    {/* 1. Status Section */}
                    <div>
                        <label className="block text-right text-lg font-semibold mb-3">{t('wallet.commission.form.status')}</label>
                        <Select
                            value={commissionForm.status}
                            onValueChange={(value) => setCommissionForm(prev => ({ ...prev, status: value }))}
                        >
                            <SelectTrigger className="w-full text-right">
                                <SelectValue placeholder={t('wallet.commission.select')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="owner_direct">{t('wallet.commission.role.ownerDirect')}</SelectItem>
                                <SelectItem value="agent_direct">{t('wallet.commission.role.agentDirect')}</SelectItem>
                                <SelectItem value="broker">{t('wallet.commission.role.broker')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Name and License Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-right text-sm mb-1">{t('wallet.commission.form.name')}</label>
                            <Input
                                type="text"
                                value={commissionForm.name}
                                onChange={(e) => setCommissionForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={t('wallet.commission.placeholder.brokerName')}
                                className="text-right"
                            />
                        </div>
                        <div>
                            <label className="block text-right text-sm mb-1">{t('wallet.commission.form.license')}</label>
                            <Input
                                type="text"
                                value={commissionForm.license}
                                onChange={(e) => setCommissionForm(prev => ({ ...prev, license: e.target.value }))}
                                placeholder={t('wallet.commission.placeholder.license')}
                                className="text-right"
                            />
                        </div>
                    </div>

                    {/* 2. Party Data Section */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-right border-b pb-2">{t('wallet.commission.form.party')}</h3>
                        
                        {/* Owner/Seller Section */}
                        <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                            <h4 className="font-semibold text-right">{t('wallet.commission.ownerData')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-right text-sm mb-1">{t('wallet.commission.form.name')}</label>
                                    <Input
                                        type="text"
                                        value={commissionForm.ownerName}
                                        onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerName: e.target.value }))}
                                        placeholder={t('wallet.commission.placeholder.brokerName')}
                                        className="text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-right text-sm mb-1">{t('wallet.commission.form.id')}</label>
                                    <Input
                                        type="text"
                                        value={commissionForm.ownerId}
                                        onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerId: e.target.value }))}
                                        placeholder={t('wallet.commission.form.id')}
                                        className="text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-right text-sm mb-1">{t('wallet.commission.form.status')}</label>
                                    <Select
                                        value={commissionForm.ownerStatus}
                                        onValueChange={(value) => setCommissionForm(prev => ({ ...prev, ownerStatus: value }))}
                                    >
                                        <SelectTrigger className="w-full text-right">
                                            <SelectValue placeholder={t('wallet.commission.select')}/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="owner">{t('wallet.commission.role.owner')}</SelectItem>
                                            <SelectItem value="agent">{t('wallet.commission.role.agent')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-right text-sm mb-1">{t('wallet.commission.form.agency')}</label>
                                        <Input
                                        type="text"
                                        value={commissionForm.ownerAgencyNumber}
                                        onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerAgencyNumber: e.target.value }))}
                                        placeholder={t('wallet.commission.form.agency')}
                                        className="text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-right text-sm mb-1">{t('wallet.commission.propertyType')}</label>
                                    <Input
                                        type="text"
                                        value={commissionForm.ownerPropertyType}
                                        onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerPropertyType: e.target.value }))}
                                        placeholder={t('wallet.commission.placeholder.typeProperty')}
                                        className="text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-right text-sm mb-1">{t('wallet.commission.agreedPercentage')}</label>
                                    <Input
                                        type="text"
                                        value={commissionForm.ownerPercentage}
                                        onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerPercentage: e.target.value }))}
                                        placeholder={t('wallet.commission.placeholder.percentage')}
                                        className="text-right"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Buyer Section */}
                        <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                            <h4 className="font-semibold text-right">{t('wallet.commission.buyerData')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-right text-sm mb-1">{t('wallet.commission.form.name')}</label>
                                    <Input
                                        type="text"
                                        value={commissionForm.buyerName}
                                        onChange={(e) => setCommissionForm(prev => ({ ...prev, buyerName: e.target.value }))}
                                        placeholder={t('wallet.commission.placeholder.brokerName')}
                                        className="text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-right text-sm mb-1">{t('wallet.commission.form.id')}</label>
                                    <Input
                                        type="text"
                                        value={commissionForm.buyerId}
                                        onChange={(e) => setCommissionForm(prev => ({ ...prev, buyerId: e.target.value }))}
                                        placeholder={t('wallet.commission.form.id')}
                                        className="text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-right text-sm mb-1">{t('wallet.commission.form.status')}</label>
                                    <Select
                                        value={commissionForm.buyerStatus}
                                        onValueChange={(value) => setCommissionForm(prev => ({ ...prev, buyerStatus: value }))}
                                    >
                                        <SelectTrigger className="w-full text-right">
                                            <SelectValue placeholder={t('wallet.commission.select')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="buyer">{t('wallet.commission.role.buyer')}</SelectItem>
                                            <SelectItem value="agent">{t('wallet.commission.role.agent')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-right text-sm mb-1">{t('wallet.commission.form.agency')}</label>
                                    <Input
                                        type="text"
                                        value={commissionForm.buyerAgencyNumber}
                                        onChange={(e) => setCommissionForm(prev => ({ ...prev, buyerAgencyNumber: e.target.value }))}
                                        placeholder={t('wallet.commission.form.agency')}
                                        className="text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-right text-sm mb-1">{t('wallet.commission.agreedPercentage')}</label>
                                    <Input
                                        type="text"
                                        value={commissionForm.buyerPercentage}
                                        onChange={(e) => setCommissionForm(prev => ({ ...prev, buyerPercentage: e.target.value }))}
                                        placeholder={t('wallet.commission.placeholder.percentage')}
                                        className="text-right"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Brokers Data Section */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-right border-b pb-2">{t('wallet.commission.brokersData')}</h3>
                        <div className="overflow-x-auto">
                            <Table className="border border-gray-200">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">{t('wallet.commission.form.name')}</TableHead>
                                        <TableHead className="text-right">{t('wallet.commission.falLicense')}</TableHead>
                                        <TableHead className="text-right">{t('wallet.commission.percentage')}</TableHead>
                                        <TableHead className="text-right">{t('wallet.commission.mobile')}</TableHead>
                                        <TableHead className="text-right">{t('wallet.commission.email')}</TableHead>
                                        <TableHead className="text-right">{t('wallet.commission.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {brokers.map((broker) => (
                                        <TableRow key={broker.id}>
                                            <TableCell>{broker.name}</TableCell>
                                            <TableCell>{broker.license}</TableCell>
                                            <TableCell>{broker.percentage}%</TableCell>
                                            <TableCell>{broker.mobile}</TableCell>
                                            <TableCell>{broker.email}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        onClick={() => {
                                                            setEditingBroker(broker.id)
                                                            setBrokerForm({
                                                                name: broker.name,
                                                                license: broker.license,
                                                                percentage: broker.percentage,
                                                                mobile: broker.mobile,
                                                                email: broker.email
                                                            })
                                                            setShowBrokerModal(true)
                                                        }}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        {t('common.edit')}
                                                    </Button>
                                                    <Button
                                                        onClick={() => setBrokers(brokers.filter(b => b.id !== broker.id))}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {brokers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-gray-500">
                                                {t('wallet.brokers.empty')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <Button
                            onClick={() => {
                                setEditingBroker(null)
                                setBrokerForm({
                                    name: '',
                                    license: '',
                                    percentage: '',
                                    mobile: '',
                                    email: ''
                                })
                                setShowBrokerModal(true)
                            }}
                            className="w-full mt-4 flex items-center justify-center gap-2"
                            variant="default"
                        >
                            <Plus className="h-5 w-5" />
                            {t('wallet.broker.addNew')}
                        </Button>
                    </div>

                    {/* 4. Property Data Section */}
                    <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                        <h4 className="font-semibold text-right">{t('wallet.commission.propertyData')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.propertyType')}</label>
                                <Select
                                    value={commissionForm.propertyType}
                                    onValueChange={(value) => setCommissionForm(prev => ({ ...prev, propertyType: value }))}
                                >
                                    <SelectTrigger className="w-full text-right">
                                        <SelectValue placeholder={t('wallet.commission.select')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="سكني">{t('wallet.commission.type.residential')}</SelectItem>
                                        <SelectItem value="تجاري">{t('wallet.commission.type.commercial')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.city')}</label>
                                <Input 
                                    value={commissionForm.city}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, city: e.target.value }))}
                                    placeholder={t('wallet.commission.placeholder.city')}
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.neighborhood')}</label>
                                <Input 
                                    value={commissionForm.neighborhood}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                                    placeholder={t('wallet.commission.placeholder.neighborhood')}
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.street')}</label>
                                <Input 
                                    value={commissionForm.streetName}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, streetName: e.target.value }))}
                                    placeholder={t('wallet.commission.placeholder.street')}
                                    className="text-right"
                                />
                            </div>
                             <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.planNum')}</label>
                                <Input 
                                    value={commissionForm.planNumber}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, planNumber: e.target.value }))}
                                    placeholder={t('wallet.commission.placeholder.planNum')}
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.plotNum')}</label>
                                <Input 
                                    value={commissionForm.plotNumber}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, plotNumber: e.target.value }))}
                                    placeholder={t('wallet.commission.placeholder.plotNum')}
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.area')}</label>
                                <Input 
                                    value={commissionForm.area}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, area: e.target.value }))}
                                    placeholder={t('wallet.commission.placeholder.area')}
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.deedNum')}</label>
                                <Input 
                                    value={commissionForm.deedNumber}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, deedNumber: e.target.value }))}
                                    placeholder={t('wallet.commission.placeholder.deedNum')}
                                    className="text-right"
                                />
                            </div>
                               <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.propertyAge')}</label>
                                <Input 
                                    value={commissionForm.propertyAge}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, propertyAge: e.target.value }))}
                                    placeholder={t('wallet.commission.propertyAge')}
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.numFloors')}</label>
                                <Input 
                                    value={commissionForm.numberOfFloors}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, numberOfFloors: e.target.value }))}
                                    placeholder={t('wallet.commission.numFloors')}
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.numUnits')}</label>
                                <Input 
                                    value={commissionForm.numberOfUnits}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, numberOfUnits: e.target.value }))}
                                    placeholder={t('wallet.commission.numUnits')}
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.specs')}</label>
                                <Input 
                                    value={commissionForm.specifications}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, specifications: e.target.value }))}
                                    placeholder={t('wallet.commission.specs')}
                                    className="text-right"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5. Contract Values Section */}
                     <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                        <h4 className="font-semibold text-right">{t('wallet.commission.contractValues')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.totalAmount')}</label>
                                <Input 
                                    value={commissionForm.totalAmount}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                                    placeholder={t('wallet.commission.totalAmount')}
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.amountAfterDiscount')}</label>
                                <Input 
                                    value={commissionForm.amountAfterDiscount}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, amountAfterDiscount: e.target.value }))}
                                    placeholder={t('wallet.commission.amountAfterDiscount')}
                                    className="text-right"
                                />
                                <p className="text-xs text-gray-500 mt-1 text-right">
                                    {t('wallet.commission.calc.after15')}
                                </p>
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.commissionPercentage')}</label>
                                <Input 
                                    value={commissionForm.commissionPercentage}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, commissionPercentage: e.target.value }))}
                                    placeholder={t('wallet.commission.placeholder.percentage')}
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">{t('wallet.commission.commissionValue')}</label>
                                <Input 
                                    value={commissionForm.commission}
                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, commission: e.target.value }))}
                                    placeholder={t('wallet.commission.placeholder.amount')}
                                    className="text-right"
                                />
                                {commissionForm.commission && (
                                    <p className="text-xs text-gray-500 mt-1 text-right">
                                        {t('wallet.commission.valueReal', { amount: commissionForm.commission })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                        onClick={handleCommissionSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 text-lg font-bold rounded-xl shadow-lg mt-8"
                    >
                        {isSubmitting ? t('common.loading') : t('wallet.commission.submit')}
                    </Button>
                </div>

                <BrokerModal 
                    open={showBrokerModal}
                    onOpenChange={setShowBrokerModal}
                    editingBroker={editingBroker}
                    initialData={brokerForm}
                    onSave={handleSaveBroker}
                />

                <CommissionRequestModal
                    open={showRequestModal}
                    onOpenChange={setShowRequestModal}
                    requestNumber={requestNumber}
                    requestDate={requestDate}
                    requestStatus={requestStatus}
                />
            </Card>
        </div>
    )
}

export default CommissionForm
