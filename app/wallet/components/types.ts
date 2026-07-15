export interface CommissionFormData {
    status: string;
    name: string;
    license: string;
    ownerName: string;
    ownerId: string;
    ownerStatus: string;
    ownerAgencyNumber: string;
    ownerPropertyType: string;
    ownerPercentage: string;
    buyerName: string;
    buyerId: string;
    buyerStatus: string;
    buyerAgencyNumber: string;
    buyerPercentage: string;
    propertyType: string;
    city: string;
    neighborhood: string;
    streetName: string;
    planNumber: string;
    plotNumber: string;
    area: string;
    deedNumber: string;
    propertyAge: string;
    numberOfFloors: string;
    numberOfUnits: string;
    specifications: string;
    totalAmount: string;
    amountAfterDiscount: string;
    commissionPercentage: string;
    commission: string;
    transferType: string;
}

export interface Broker {
    id: number;
    name: string;
    license: string;
    percentage: string;
    mobile: string;
    email: string;
}

export interface BrokerPercentage {
    name: string;
    percentage: string;
    amountAfterTax: string;
}

export interface Commission {
    id: string;
    commissionNumber: string;
    type: string;
    status: string;
    totalAmount: number | string;
    commissionAmount: number | string;
    createdAt: string;
    owner?: {
        name: string;
        idNumber: string;
    };
    buyer?: {
        name: string;
        idNumber: string;
    };
    propertyType?: string;
    city?: string;
    neighborhood?: string;
    area?: string | number;
    deedNumber?: string;
    specifications?: string;
    commissionPercentage?: string | number;
}

export interface Invoice {
    status: string;
    amount: string;
    date: string;
    service: string;
    invoice: string;
    originalStatus: string;
    id: string;
}

export type WalletTab = 'invoices' | 'commission' | 'files' | 'invest';
