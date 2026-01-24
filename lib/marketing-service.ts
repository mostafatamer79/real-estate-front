
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
  }
};
