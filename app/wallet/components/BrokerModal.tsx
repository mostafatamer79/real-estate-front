import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/context/LanguageContext'
import { Broker } from './types'

interface BrokerFormState {
    name: string;
    license: string;
    percentage: string;
    mobile: string;
    email: string;
}

interface BrokerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingBroker: number | null;
    initialData: BrokerFormState;
    onSave: (broker: Broker) => void;
}

const BrokerModal: React.FC<BrokerModalProps> = ({ open, onOpenChange, editingBroker, initialData, onSave }) => {
    const { t } = useLanguage()
    const [formData, setFormData] = useState<BrokerFormState>(initialData)

    useEffect(() => {
        setFormData(initialData)
    }, [initialData, open])

    const handleSave = () => {
        if (!formData.name || !formData.percentage) return
        
        onSave({
            id: editingBroker || Date.now(),
            ...formData
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-right">
                        {editingBroker ? t('common.edit') : t('wallet.broker.addNew')}
                    </DialogTitle>
                    <DialogDescription className="text-right">
                        {t('wallet.broker.addNewDesc')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-right text-sm font-medium">{t('wallet.commission.form.name')}</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="text-right"
                            placeholder={t('wallet.commission.placeholder.brokerName')}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-right text-sm font-medium">{t('wallet.commission.falLicense')}</label>
                        <Input
                            value={formData.license}
                            onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                            className="text-right"
                            placeholder={t('wallet.commission.placeholder.license')}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-right text-sm font-medium">{t('wallet.commission.percentage')}</label>
                        <Input
                            value={formData.percentage}
                            onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                            className="text-right"
                            type="number"
                            placeholder={t('wallet.commission.placeholder.percentage')}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-right text-sm font-medium">{t('wallet.commission.mobile')}</label>
                        <Input
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            className="text-right"
                            placeholder={t('wallet.commission.placeholder.mobile')}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-right text-sm font-medium">{t('wallet.commission.email')}</label>
                        <Input
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="text-right"
                            placeholder={t('wallet.commission.placeholder.email')}
                        />
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    <Button onClick={() => onOpenChange(false)} variant="outline">
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSave}>
                        {t('common.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default BrokerModal
