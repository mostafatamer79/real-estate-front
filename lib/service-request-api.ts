import api from './api';
import { ApiResponse } from '@/types/api';

export enum ServiceCategory {
  POST_PURCHASE = 'postPurchase',
  LEGAL = 'legal',
  CONSTRUCTION = 'construction',
  MARKETING = 'marketing',
  LEASING = 'leasing',
  VISIT = 'visit',
  OTHER = 'other'
}

export enum ServiceStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface ServiceRequest {
  id: string;
  category: ServiceCategory;
  serviceType: string;
  clientName: string;
  phone: string;
  city: string;
  district: string;
  quantity: number;
  description: string;
  status: ServiceStatus;
  price: number;
  createdAt: string;
  departmentPrices?: Record<string, { price: number; addedBy: string; note?: string; addedAt: string }>;
  chatRoomId?: string;
  invoiceNumber?: string;
  metadata?: any;
}

export const serviceRequestApi = {
  create: (data: any): Promise<ApiResponse<ServiceRequest>> =>
    api.post('/service-requests', data),

  findAll: (params?: { page?: number; limit?: number; mine?: boolean }): Promise<ApiResponse<{ items: ServiceRequest[]; total: number; page: number; limit: number; totalPages: number }>> =>
    api.get('/service-requests', { params }),

  findOne: (id: string): Promise<ApiResponse<ServiceRequest>> =>
    api.get(`/service-requests/${id}`),

  addDepartmentPrice: (id: string, data: { price: number; note?: string }): Promise<ApiResponse<ServiceRequest>> =>
    api.put(`/service-requests/${id}/department-price`, data),

  getOrCreateChat: (id: string): Promise<ApiResponse<{ chatRoomId: string }>> =>
    api.post(`/service-requests/${id}/chat`),

  getOrCreateStaffChat: (id: string, staffId: string): Promise<ApiResponse<{ chatRoomId: string }>> =>
    api.post(`/service-requests/${id}/staff-chat/${staffId}`),

  getOrCreateSelfChat: (id: string): Promise<ApiResponse<{ chatRoomId: string }>> =>
    api.post(`/service-requests/${id}/self-chat`),

  acceptDepartmentOffer: (id: string, deptSlug: string): Promise<ApiResponse<ServiceRequest>> =>
    api.put(`/service-requests/${id}/accept-department-offer`, { deptSlug }),

  findByDepartment: (dept: string): Promise<ApiResponse<ServiceRequest[]>> =>
    api.get(`/service-requests/by-department/${dept}`),
};
