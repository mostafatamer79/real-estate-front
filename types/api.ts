export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface FindAllParams {
  status?: string;
  propertyType?: string;
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  propertyAge?: string;
  direction?: string;
  propertyCondition?: string;
  hasElevator?: boolean;
  hasGarage?: boolean;
  hasPool?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface CreateOfferDto {
  propertyType: string;
  length?: number;
  width?: number;
  area: number;
  propertyAge: string;
  direction: string;
  price: number;
  city: string;
  neighborhood: string;
  streetWidth?: number;
  deedType: string;
  propertyCondition: string;
  rooms?: number;
  bathrooms?: number;
  livingRooms?: number;
  kitchens?: number;
  floors?: number;
  apartments?: number;
  hasMaidRoom?: boolean;
  hasRoof?: boolean;
  hasExternalAnnex?: boolean;
  buildingArea?: number;
  hasGarage?: boolean;
  hasPool?: boolean;
  hasElevator?: boolean;
  furnitureStatus?: string;
  additionalNotes?: string;
  propertyDocuments?: string[];
  checkImage?: string;
  mediaFiles?: string[];
  threeDVideos?: string[];
  video3d?: string;
  locationUrl?: string;
  dealType?: string;
  mainCategory?: string;
  status?: string;
  views?: number;
}

export interface UpdateOfferDto extends Partial<CreateOfferDto> {}

export interface Offer extends CreateOfferDto {
  id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  orderType: string;
  propertyType: string;
  city: string;
  neighborhood: string;
  area: number;
  propertyAge: string;
  deedType: string;
  price: number;
  rooms?: number;
  bathrooms?: number;
  livingRooms?: number;
  kitchens?: number;
  floors?: number;
  apartments?: number;
  hasMaidRoom?: boolean;
  hasRoof?: boolean;
  hasExternalAnnex?: boolean;
  buildingArea?: number;
  hasGarage?: boolean;
  hasPool?: boolean;
  hasElevator?: boolean;
  furnitureStatus?: string;
  additionalDetails?: string;
  status?: string;
}


export interface Order extends CreateOrderDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    email: string;
  };
}

export interface CreateBookingDto {
  offerId: string;
  date: string;
  time: string;
  notes?: string;
}

export interface Booking extends CreateBookingDto {
  id: string;
  status: string;
  createdAt: string;
  offer?: Offer;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface CreatePropertyDto {
    name: string;
    deedNumber?: string;
    type: 'building' | 'compound' | 'land' | 'warehouse';
    locationUrl?: string;
    coordinates?: { lat: number; lng: number };
    constructionDate?: string;
    purchasePrice?: number;
    ownerId?: string;
    units?: CreateUnitDto[];
}

export interface Property extends CreatePropertyDto {
    id: string;
    createdAt: string;
    updatedAt: string;
    units?: Unit[];
}

export interface CreateUnitDto {
    propertyId?: string;
    unitNumber: string;
    type: 'apartment' | 'shop' | 'office' | 'showroom';
    area?: number;
    roomsCount?: number;
    bathroomsCount?: number;
    occupancyStatus?: 'vacant' | 'rented' | 'reserved' | 'maintenance';
    expectedVacancyDate?: string;
    leases?: CreateLeaseDto[];
}

export interface Unit extends CreateUnitDto {
    id: string;
    createdAt: string;
    updatedAt: string;
    property?: Property;
}

export interface CreateTenantDto {
    fullName: string;
    idNumber?: string;
    idDocumentUrl?: string;
    phoneNumber?: string;
    email?: string;
    employer?: string;
    type?: 'individual' | 'company';
    preferredPaymentDay?: number;
    userId?: string;
}

export interface TenantProfile extends CreateTenantDto {
    id: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLeaseDto {
    unitId?: string;
    tenantId?: string;
    tenant?: CreateTenantDto;
    startDate: string;
    endDate: string;
    annualRent: number;
    paymentFrequency?: string;
    securityDeposit?: number;
    securityDepositStatus?: 'held' | 'partially_refunded' | 'fully_refunded';
    deductionReason?: string;
}

export interface Lease extends CreateLeaseDto {
    id: string;
    createdAt: string;
    updatedAt: string;
    tenant?: TenantProfile;
    unit?: Unit;
}

export interface CreatePaymentDto {
    leaseId: string;
    dueDate: string;
    amount: number;
    status?: 'paid' | 'pending' | 'overdue';
    method?: 'bank' | 'electronic' | 'cash';
}

export interface Payment extends CreatePaymentDto {
    id: string;
    createdAt: string;
    updatedAt: string;
    lease?: Lease;
}

export interface MaintenanceRequest {
    id: string;
    propertyId?: string;
    unitId?: string;
    type: 'routine' | 'emergency';
    description: string;
    status: string;
    cost?: number;
    technicianName?: string;
    completedDate?: string;
    createdAt: string;
    updatedAt: string;
    property?: Property;
    unit?: Unit;
}

export interface CreateSubscriptionDto {
    propertyId?: string;
    unitId?: string;
    packageId?: string;
    departmentSlug?: string;
    subscriptionType: string;
    customPeriodMonths?: number;
    amount: number;
    startDate: string;
    paymentMethod: string;
    notes?: string;
    paymentReference?: string;
}

export interface UpdateSubscriptionDto {
    paymentMethod?: string;
    amount?: number;
    notes?: string;
    paymentReference?: string;
}

export interface CancelSubscriptionDto {
    cancellationReason?: string;
}

export interface Subscription {
    id: string;
    userId: string;
    propertyId?: string;
    unitId?: string;
    packageId?: string;
    departmentSlug?: string;
    subscriptionType: string;
    customPeriodMonths?: number;
    amount: number;
    startDate: string;
    endDate: string;
    paymentMethod: string;
    status: string;
    notes?: string;
    paymentReference?: string;
    paidAt?: string;
    autoRenew: boolean;
    cancelledAt?: string;
    cancelledBy?: string;
    cancellationReason?: string;
    createdAt: string;
    updatedAt: string;
    user?: any;
    property?: Property;
    unit?: Unit;
    managementPackage?: any;
}
