import axios, { AxiosRequestConfig } from 'axios';
import { 
  ApiResponse, 
  CreateOfferDto, 
  UpdateOfferDto, 
  Offer, 
  FindAllParams, 
  CreateOrderDto, 
  Order 
} from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
  remove: (id: string): Promise<ApiResponse<Offer>> =>
    api.delete(`/offers/${id}`),

  // Hard delete offer (admin only)
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/offers/${id}/hard`),

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
    status: 'draft',
  };
};

export default api;