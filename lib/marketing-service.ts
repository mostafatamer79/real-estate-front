
import api from './api';

export enum MarketingRequestType {
  PHOTOGRAPHY_PROFESSIONAL = 'photography_professional',
  PHOTOGRAPHY_FIELD = 'photography_field',
  AD_CAMPAIGN = 'ad_campaign',
  SOCIAL_MEDIA = 'social_media',
}

export enum MarketingRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export interface MarketingRequest {
  id: string;
  type: MarketingRequestType;
  status: MarketingRequestStatus;
  clientId: string;
  details?: Record<string, any>;
  assignedTo?: string;
  views?: number;
  engagement?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketingRequestDto {
  type: MarketingRequestType;
  details?: Record<string, any>;
}

export interface UpdateMarketingRequestDto {
  status?: MarketingRequestStatus;
  assignedTo?: string;
  details?: Record<string, any>;
}

export interface EmailMarketingStats {
  totalSent: number;
  openRate: number;
  clickRate: number;
  sentTrend: number;
  openRateTrend: number;
  clickRateTrend: number;
}

export const marketingApi = {
  // Create a new marketing request
  createRequest: async (data: CreateMarketingRequestDto): Promise<MarketingRequest> => {
    const response = await api.post('/marketing', data);
    return response.data;
  },

  // Get all requests (admin view likely)
  getAllRequests: async (): Promise<MarketingRequest[]> => {
    const response = await api.get('/marketing');
    return response.data;
  },

  // Get requests for the current client
  getMyRequests: async (): Promise<MarketingRequest[]> => {
    const response = await api.get('/marketing/my-requests');
    return response.data;
  },

  // Get a single request
  getRequestById: async (id: string): Promise<MarketingRequest> => {
    const response = await api.get(`/marketing/${id}`);
    return response.data;
  },

  // Update a request
  updateRequest: async (id: string, data: UpdateMarketingRequestDto): Promise<MarketingRequest> => {
    const response = await api.patch(`/marketing/${id}`, data);
    return response.data;
  },

  // Delete a request
  deleteRequest: async (id: string): Promise<void> => {
    await api.delete(`/marketing/${id}`);
  },

  // Get campaign analytics
  getCampaignAnalytics: async (id: string): Promise<any> => {
    const response = await api.get(`/marketing/campaigns/${id}/analytics`);
    return response.data;
  },

  // Email Marketing
  getEmailMarketing: async (): Promise<any[]> => {
    const response = await api.get('/marketing/email');
    return response.data;
  },

  getEmailMarketingStats: async (): Promise<EmailMarketingStats> => {
    const response = await api.get('/marketing/email/stats');
    return response.data;
  },

  createEmailMarketing: async (data: any): Promise<any> => {
    const response = await api.post('/marketing/email', data);
    return response.data;
  },

  deleteEmailMarketing: async (id: string): Promise<void> => {
    await api.delete(`/marketing/email/${id}`);
  },

  // Resource Fetching for Campaigns
  getProperties: async (): Promise<any[]> => {
    const response = await api.get('/properties');
    return response.data;
  },

  getOrders: async (): Promise<any[]> => {
    const response = await api.get('/orders/my-orders');
    return response.data;
  },

  getOffers: async (): Promise<any[]> => {
    const response = await api.get('/offers/my-offers');
    return response.data;
  },

  getBookings: async (): Promise<any[]> => {
    const response = await api.get('/booking');
    return response.data;
  }
};
