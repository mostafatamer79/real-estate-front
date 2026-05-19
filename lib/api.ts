import axios, { AxiosRequestConfig } from 'axios';
import { 
  ApiResponse, 
  CreateOfferDto, 
  UpdateOfferDto, 
  Offer, 
  FindAllParams, 
  CreateOrderDto, 
  Order,
  CreateBookingDto,
  Booking,
  CreatePropertyDto,
  Property,
  CreateUnitDto,
  Unit,
  CreateTenantDto,
  TenantProfile,
  CreateLeaseDto,
  Lease,
  CreatePaymentDto,
  Payment,
  MaintenanceRequest,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CancelSubscriptionDto,
  Subscription
} from '@/types/api';

export type CustomerServiceFaq = {
  id: string;
  categoryAr: string;
  categoryEn: string;
  categoryId?: string | null;
  questionAr: string;
  answerAr: string;
  questionEn: string;
  answerEn: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerServiceFaqCategory = {
  id: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerServiceFeedback = {
  id: string;
  name: string;
  contactMethod: 'email' | 'phone';
  email?: string | null;
  phoneNumber?: string | null;
  question: string;
  userId?: string | null;
  pagePath?: string | null;
  status: 'new' | 'resolved';
  createdAt: string;
  updatedAt: string;
};

export type InfoTab = {
  id: string;
  key: string;
  titleAr: string;
  titleEn: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type InfoBlock = {
  id: string;
  tabId: string;
  labelAr: string;
  labelEn: string;
  textAr: string;
  textEn: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const getApiUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030/api';
  if (url && !url.startsWith('http') && !url.startsWith('https')) {
    url = `https://${url}`;
  }
  // Normalize trailing slash
  url = url.replace(/\/+$/, '');
  // Ensure global prefix (/api) exists (Nest setsGlobalPrefix('api'))
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const API_URL = getApiUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => { 
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Offers API
export const offersApi = {
  // Create new offer
  create: (data: CreateOfferDto): Promise<ApiResponse<Offer>> =>
    api.post('/offers', data),

  // Get all offers with filters
  findAll: (params?: FindAllParams): Promise<ApiResponse<Offer[]>> =>
    api.get('/offers', { params }),

  // Search offers
  search: (query: string): Promise<ApiResponse<Offer[]>> =>
    api.get('/offers/search', { params: { q: query } }),

  // Get single offer
  findOne: (id: string): Promise<ApiResponse<Offer>> =>
    api.get(`/offers/${id}`),

  // Update offer
  update: (id: string, data: UpdateOfferDto): Promise<ApiResponse<Offer>> =>
    api.patch(`/offers/${id}`, data),

  // Update offer status
  updateStatus: (id: string, status: string): Promise<ApiResponse<Offer>> =>
    api.patch(`/offers/${id}/status`, { status }),

  // Soft delete (deactivate) offer
  // Soft delete (deactivate) offer
  remove: (id: string): Promise<ApiResponse<Offer>> =>
    api.delete(`/offers/${id}`),
  
  // Get my offers
  findMyOffers: (): Promise<ApiResponse<Offer[]>> =>
    api.get('/offers/my-offers'),

  // Hard delete offer (admin only)
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/offers/${id}/hard`),

  // Admin: Update any offer status
  adminUpdateStatus: (id: string, status: string): Promise<ApiResponse<Offer>> =>
    api.patch(`/offers/${id}/status`, { status }),

  // Admin: Hide/show offer without deleting
  setActive: (id: string, isActive: boolean): Promise<ApiResponse<Offer>> =>
    api.patch(`/offers/${id}/active`, { isActive }),

  // Upload media files
  uploadMedia: (id: string, files: File[]): Promise<ApiResponse<Offer>> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post(`/offers/${id}/upload/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Upload 3D videos
  upload3DVideos: (id: string, files: File[]): Promise<ApiResponse<Offer>> => {
    const formData = new FormData();
    files.forEach(file => formData.append('videos', file));
    return api.post(`/offers/${id}/upload/3d-videos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Get filtered offers
  getFilteredOffers: (filters: FindAllParams): Promise<ApiResponse<Offer[]>> =>
    api.get('/offers/filter', { params: filters }),

  // Create Purchase Request
  createPurchase: (id: string): Promise<ApiResponse<any>> =>
    api.post(`/offers/${id}/purchase`),

  // Create Visit Request
  createVisit: (id: string, data: any): Promise<ApiResponse<any>> =>
    api.post(`/offers/${id}/visit`, data),

  // Increment view count
  incrementViews: (id: string): Promise<void> =>
    api.post(`/offers/${id}/view`),
};

export const customerServiceFaqApi = {
  list: (): Promise<{ success: boolean; data: CustomerServiceFaq[] }> =>
    api.get('/customer-service/faqs').then((r) => r.data),

  create: (data: Omit<CustomerServiceFaq, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data: CustomerServiceFaq }> =>
    api.post('/customer-service/faqs', data).then((r) => r.data),

  update: (id: string, data: Partial<Omit<CustomerServiceFaq, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ success: boolean; data: CustomerServiceFaq }> =>
    api.patch(`/customer-service/faqs/${id}`, data).then((r) => r.data),

  remove: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/customer-service/faqs/${id}`).then((r) => r.data),

  resetDefaults: (): Promise<{ success: boolean; data: CustomerServiceFaq[] }> =>
    api.post('/customer-service/faqs/reset-defaults', {}).then((r) => r.data),

  reorder: (categoryId: string, ids: string[]): Promise<{ success: boolean; data: CustomerServiceFaq[] }> =>
    api.post(`/customer-service/faqs/reorder/${categoryId}`, { ids }).then((r) => r.data),
};

export const customerServiceFaqCategoryApi = {
  list: (): Promise<{ success: boolean; data: CustomerServiceFaqCategory[] }> =>
    api.get('/customer-service/faq-categories').then((r) => r.data),

  create: (data: { nameAr: string; nameEn: string; sortOrder?: number }): Promise<{ success: boolean; data: CustomerServiceFaqCategory }> =>
    api.post('/customer-service/faq-categories', data).then((r) => r.data),

  update: (id: string, data: Partial<{ nameAr: string; nameEn: string; sortOrder: number }>): Promise<{ success: boolean; data: CustomerServiceFaqCategory }> =>
    api.patch(`/customer-service/faq-categories/${id}`, data).then((r) => r.data),

  remove: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/customer-service/faq-categories/${id}`).then((r) => r.data),

  reorder: (ids: string[]): Promise<{ success: boolean; data: CustomerServiceFaqCategory[] }> =>
    api.post('/customer-service/faq-categories/reorder', { ids }).then((r) => r.data),
};

export const customerServiceFeedbackApi = {
  create: (data: {
    name: string;
    contactMethod: 'email' | 'phone';
    email?: string;
    phoneNumber?: string;
    question: string;
    pagePath?: string;
  }): Promise<{ success: boolean; data: CustomerServiceFeedback }> =>
    api.post('/customer-service/feedback', data).then((r) => r.data),

  list: (): Promise<{ success: boolean; data: CustomerServiceFeedback[] }> =>
    api.get('/customer-service/feedback').then((r) => r.data),

  updateStatus: (id: string, status: 'new' | 'resolved'): Promise<{ success: boolean; data: CustomerServiceFeedback }> =>
    api.patch(`/customer-service/feedback/${id}`, { status }).then((r) => r.data),

  remove: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/customer-service/feedback/${id}`).then((r) => r.data),
};

export const infoContentApi = {
  getAll: (): Promise<{ success: boolean; data: { tabs: InfoTab[]; blocks: InfoBlock[] } }> =>
    api.get('/info-content').then((r) => r.data),

  resetDefaults: (): Promise<{ success: boolean; data: { tabs: InfoTab[]; blocks: InfoBlock[] } }> =>
    api.post('/info-content/reset-defaults', {}).then((r) => r.data),

  createTab: (data: { key: string; titleAr: string; titleEn: string; sortOrder?: number }): Promise<{ success: boolean; data: InfoTab }> =>
    api.post('/info-content/tabs', data).then((r) => r.data),
  updateTab: (id: string, data: Partial<{ key: string; titleAr: string; titleEn: string; sortOrder: number }>): Promise<{ success: boolean; data: InfoTab }> =>
    api.patch(`/info-content/tabs/${id}`, data).then((r) => r.data),
  deleteTab: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/info-content/tabs/${id}`).then((r) => r.data),
  reorderTabs: (ids: string[]): Promise<{ success: boolean; data: { tabs: InfoTab[]; blocks: InfoBlock[] } }> =>
    api.post('/info-content/tabs/reorder', { ids }).then((r) => r.data),

  createBlock: (data: { tabId: string; labelAr: string; labelEn: string; textAr: string; textEn: string; sortOrder?: number }): Promise<{ success: boolean; data: InfoBlock }> =>
    api.post('/info-content/blocks', data).then((r) => r.data),
  updateBlock: (id: string, data: Partial<{ tabId: string; labelAr: string; labelEn: string; textAr: string; textEn: string; sortOrder: number }>): Promise<{ success: boolean; data: InfoBlock }> =>
    api.patch(`/info-content/blocks/${id}`, data).then((r) => r.data),
  deleteBlock: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/info-content/blocks/${id}`).then((r) => r.data),
  reorderBlocks: (tabId: string, ids: string[]): Promise<{ success: boolean; data: { tabs: InfoTab[]; blocks: InfoBlock[] } }> =>
    api.post(`/info-content/blocks/reorder/${tabId}`, { ids }).then((r) => r.data),
};


export const ordersApi = {
  create: (data: CreateOrderDto): Promise<ApiResponse<Order>> =>
    api.post('/orders', data),
    
  findAll: (): Promise<ApiResponse<Order[]>> =>
    api.get('/orders'),

  findMyOrders: (): Promise<ApiResponse<Order[]>> =>
    api.get('/orders/my-orders'),
    
  findOne: (id: string): Promise<ApiResponse<Order>> =>
    api.get(`/orders/${id}`),

  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/orders/${id}`),

  update: (id: string, data: any): Promise<ApiResponse<Order>> =>
    api.patch(`/orders/${id}`, data),

  assign: (id: string, assignedToId: string | null): Promise<ApiResponse<Order>> =>
    api.patch(`/orders/${id}/assign`, { assignedToId }),

  updateStatus: (id: string, status: string): Promise<ApiResponse<Order>> =>
    api.patch(`/orders/${id}/status`, { status }),
};

export const usersApi = {
  findAll: (): Promise<ApiResponse<any[]>> =>
    api.get('/user'),
    
  create: (data: any): Promise<ApiResponse<any>> =>
    api.post('/user', data),
};

export const bookingsApi = {
  create: (data: CreateBookingDto): Promise<ApiResponse<Booking>> =>
    api.post('/booking', data),
    
  findAll: (): Promise<ApiResponse<Booking[]>> =>
    api.get('/booking'),
    
  findIncoming: (): Promise<ApiResponse<Booking[]>> =>
    api.get('/booking/incoming'),

  getUserBookings: (userId: string): Promise<ApiResponse<Booking[]>> =>
    api.get(`/booking/user/${userId}`),

  getOfferBookings: (offerId: string): Promise<ApiResponse<Booking[]>> =>
    api.get(`/booking/offer/${offerId}`),
};

export const propertiesApi = {
  // Properties
  create: (data: CreatePropertyDto): Promise<ApiResponse<Property>> =>
    api.post('/properties', data),

  findAll: (ownerId?: string): Promise<ApiResponse<Property[]>> =>
    api.get('/properties', { params: { ownerId } }),

  findOne: (id: string): Promise<ApiResponse<Property>> =>
    api.get(`/properties/${id}`),

  update: (id: string, data: Partial<CreatePropertyDto>): Promise<ApiResponse<Property>> =>
    api.patch(`/properties/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/properties/${id}`),

  // Units
  createUnit: (data: CreateUnitDto): Promise<ApiResponse<Unit>> =>
    api.post('/properties/units', data),

  getUnits: (propertyId: string): Promise<ApiResponse<Unit[]>> =>
    api.get(`/properties/${propertyId}/units`),

  updateUnit: (id: string, data: Partial<CreateUnitDto>): Promise<ApiResponse<Unit>> =>
    api.patch(`/properties/units/${id}`, data),

  // Tenants
  createTenant: (data: CreateTenantDto): Promise<ApiResponse<TenantProfile>> =>
    api.post('/properties/tenants', data),

  getTenants: (ownerId?: string): Promise<ApiResponse<TenantProfile[]>> =>
    api.get('/properties/tenants/all', { params: { ownerId } }),

  deleteTenant: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/properties/tenants/${id}`),

  // Leases
  createLease: (data: CreateLeaseDto): Promise<ApiResponse<Lease>> =>
    api.post('/properties/leases', data),

  getLeases: (ownerId?: string): Promise<ApiResponse<Lease[]>> =>
    api.get('/properties/leases/all', { params: { ownerId } }),

  // Payments
  createPayment: (data: CreatePaymentDto): Promise<ApiResponse<Payment>> =>
    api.post('/properties/payments', data),

  getPayments: (ownerId?: string): Promise<ApiResponse<Payment[]>> =>
    api.get('/properties/payments/all', { params: { ownerId } }),

  getMaintenanceLogs: (ownerId?: string): Promise<ApiResponse<MaintenanceRequest[]>> =>
    api.get('/properties/maintenance/all', { params: { ownerId } }),

  createMaintenanceLog: (data: Partial<MaintenanceRequest>): Promise<ApiResponse<MaintenanceRequest>> =>
    api.post('/properties/maintenance', data),
};

// File upload helper
export const uploadFile = async (file: File, type: 'media' | 'check' | 'document'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/upload/${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.url;
};

// Utility function to convert frontend form data to API format
export const prepareOfferData = (formData: any): CreateOfferDto => {
  return {
    propertyType: formData.propertyType,
    length: formData.length ? parseFloat(formData.length) : undefined,
    width: formData.width ? parseFloat(formData.width) : undefined,
    area: parseFloat(formData.area),
    propertyAge: formData.propertyAge,
    direction: formData.direction,
    price: parseFloat(formData.price),
    city: formData.city,
    neighborhood: formData.neighborhood,
    streetWidth: formData.streetWidth ? parseFloat(formData.streetWidth) : undefined,
    deedType: formData.deedType,
    propertyCondition: formData.propertyCondition,
    rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
    bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
    livingRooms: formData.livingRooms ? parseInt(formData.livingRooms) : undefined,
    kitchens: formData.kitchens ? parseInt(formData.kitchens) : undefined,
    floors: formData.floors ? parseInt(formData.floors) : undefined,
    apartments: formData.apartments ? parseInt(formData.apartments) : undefined,
    hasMaidRoom: formData.hasMaidRoom === 'نعم',
    hasRoof: formData.hasRoof === 'نعم',
    hasExternalAnnex: formData.hasExternalAnnex === 'نعم',
    buildingArea: formData.buildingArea ? parseFloat(formData.buildingArea) : undefined,
    hasGarage: formData.hasGarage === 'نعم',
    hasPool: formData.hasPool === 'نعم',
    hasElevator: formData.hasElevator === 'نعم',
    furnitureStatus: formData.furnitureStatus,
    additionalNotes: formData.additionalNotes,
    propertyDocuments: [], // Will be populated after file upload
    checkImage: '', // Will be populated after file upload
    mediaFiles: [], // Will be populated after file upload
    threeDVideos: [], // Will be populated after file upload
    video3d: formData.video3d || undefined,
    locationUrl: formData.locationUrl || undefined,
    dealType: formData.dealType || undefined,
    mainCategory: formData.mainCategory || undefined,
    status: 'draft',
  };
};

export const subscriptionsApi = {
  create: (data: CreateSubscriptionDto): Promise<ApiResponse<Subscription>> =>
    api.post('/subscriptions', data),

  findAll: (): Promise<ApiResponse<Subscription[]>> =>
    api.get('/subscriptions'),

  findMySubscriptions: (): Promise<ApiResponse<Subscription[]>> =>
    api.get('/subscriptions/my'),

  findActiveSubscriptions: (): Promise<ApiResponse<Subscription[]>> =>
    api.get('/subscriptions/my/active'),

  findOne: (id: string): Promise<ApiResponse<Subscription>> =>
    api.get(`/subscriptions/${id}`),

  update: (id: string, data: UpdateSubscriptionDto): Promise<ApiResponse<Subscription>> =>
    api.put(`/subscriptions/${id}`, data),

  cancel: (id: string, data: CancelSubscriptionDto): Promise<ApiResponse<Subscription>> =>
    api.delete(`/subscriptions/${id}`, { data }),

  activate: (id: string): Promise<ApiResponse<Subscription>> =>
    api.post(`/subscriptions/${id}/activate`),

  getByProperty: (propertyId: string): Promise<ApiResponse<Subscription[]>> =>
    api.get(`/subscriptions/property/${propertyId}`),

  getByUnit: (unitId: string): Promise<ApiResponse<Subscription[]>> =>
    api.get(`/subscriptions/unit/${unitId}`),
};

export const financialApi = {
  getWallet: (): Promise<ApiResponse<any>> =>
    api.get('/financial/my-wallet'),

  getInvoices: (): Promise<ApiResponse<any[]>> =>
    api.get('/financial/invoices/my'),

  getUserInvoices: (userId: string): Promise<ApiResponse<any[]>> =>
    api.get(`/financial/invoices/user/${userId}`),

  getCommissions: (): Promise<ApiResponse<any[]>> =>
    api.get('/financial/commissions/my'),

  getFiles: (): Promise<ApiResponse<any[]>> =>
    api.get('/financial/files/my'),

  getDashboardStats: (): Promise<ApiResponse<any>> =>
    api.get('/financial/dashboard'),

  getTransactions: (): Promise<ApiResponse<any[]>> =>
    api.get('/financial/transactions'),

  exportTransactions: (params?: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<any> =>
    api.get('/financial/transactions/export', { params, responseType: 'blob' as any }),

  createInvoice: (data: { amount: number; referenceType?: string; referenceId?: string; description?: string }): Promise<ApiResponse<any>> =>
    api.post('/financial/invoices', data),
    
  payInvoice: (id: string, paymentMethod: string): Promise<ApiResponse<any>> =>
    api.post(`/financial/invoices/${id}/pay`, { paymentMethod }),
};

export const commissionApi = {
  create: (data: any): Promise<ApiResponse<any>> =>
    api.post('/commissions', data),

  findMyCommissions: (params?: any): Promise<ApiResponse<any[]>> =>
    api.get('/commissions', { params }),

  findOne: (id: string): Promise<ApiResponse<any>> =>
    api.get(`/commissions/${id}`),

  submit: (id: string): Promise<ApiResponse<any>> =>
    api.post(`/commissions/${id}/submit`),
};

export const adminApi = {
  getPurchaseRequests: (): Promise<ApiResponse<any[]>> =>
    api.get('/admin/bookings/purchase'),

  getVisitRequests: (): Promise<ApiResponse<any[]>> =>
    api.get('/admin/bookings/visit'),

  getAllOrders: (): Promise<ApiResponse<any[]>> =>
    api.get('/admin/bookings/orders'),

  updatePurchaseStatus: (id: string, status: string): Promise<ApiResponse<any>> =>
    api.patch(`/admin/bookings/${id}/status-purchase`, { status }),

  updateVisitStatus: (id: string, status: string): Promise<ApiResponse<any>> =>
    api.patch(`/admin/bookings/${id}/status-visit`, { status }),

  assignAgent: (id: string, agentId: string): Promise<ApiResponse<any>> =>
    api.patch(`/admin/bookings/${id}/assign-agent`, { agentId }),
};

export const activitiesApi = {
  findAll: (limit?: number): Promise<ApiResponse<any[]>> =>
    api.get('/activities', { params: { limit } }),
    
  getRecent: (): Promise<ApiResponse<any[]>> =>
    api.get('/activities/recent'),
};

export const adminSubscriptionsApi = {
  findAll: (): Promise<ApiResponse<any[]>> =>
    api.get('/subscriptions'),
    
  create: (data: any): Promise<ApiResponse<any>> =>
    api.post('/subscriptions', data),
    
  activate: (id: string): Promise<ApiResponse<any>> =>
    api.post(`/subscriptions/${id}/activate`),
    
  cancel: (id: string, reason: string): Promise<ApiResponse<any>> =>
    api.delete(`/subscriptions/${id}`, { data: { cancellationReason: reason } }),
    
  update: (id: string, data: any): Promise<ApiResponse<any>> =>
    api.put(`/subscriptions/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/subscriptions/${id}`),
};

export const packagesApi = {
  findAll: (): Promise<ApiResponse<any[]>> =>
    api.get('/management-packages'),
};

export default api;
