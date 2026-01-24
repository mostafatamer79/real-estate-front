// lib/api/legal-services.ts
import api  from './api';

export interface LegalDisputeFormData {
  firstParty: {
    name: string;
    role: string;
    idType: string;
    idNumber: string;
    nationality: string;
    city: string;
    nationalAddress: string;
    phone: string;
    email: string;
  };
  secondParty: {
    name: string;
    role: string;
    idType: string;
    idNumber: string;
    nationality: string;
    city: string;
    nationalAddress: string;
    phone: string;
    email: string;
  };
  firstPartyAgent?: {
    name: string;
    agencyNumber: string;
  };
  secondPartyAgent?: {
    name: string;
    agencyNumber: string;
  };
  disputeType: string;
  otherDisputeType?: string;
  disputeDescription: string;
  documentIds?: string[];
}

export interface CreateLegalDisputeDto {
  firstParty: {
    name: string;
    role: string;
    idType: string;
    idNumber: string;
    nationality: string;
    city: string;
    nationalAddress: string;
    phone: string;
    email: string;
  };
  secondParty: {
    name: string;
    role: string;
    idType: string;
    idNumber: string;
    nationality: string;
    city: string;
    nationalAddress: string;
    phone: string;
    email: string;
  };
  disputeType: string;
  disputeDescription: string;
  otherDisputeType?: string;
  firstPartyAgent?: {
    name: string;
    agencyNumber: string;
  };
  secondPartyAgent?: {
    agencyNumber: string;
  };
  documentIds?: string[];
}

export interface LegalDispute {
  id: string;
  disputeNumber: string;
  disputeType: string;
  firstParty: string;
  secondParty: string;
  status: string;
  createdAt: string;
  assignedTo?: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  contractType: string;
  firstParty: string;
  secondParty: string;
  status: string;
  createdAt: string;
  applicantRole: string;
}

export interface OtherLegalService {
  id: string;
  serviceType: string;
  name: string;
  phone: string;
  consultationTopic?: string;
  status: string;
  createdAt: string;
}

export interface LegalServicesStats {
  totalServices: number;
  disputes: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  contracts: {
    total: number;
    pending: number;
    inReview: number;
    completed: number;
    signed: number;
  };
  otherServices: {
    total: number;
    pending: number;
    completed: number;
    responded: number;
  };
}

export interface LegalDisputeQueryDto {
  status?: string;
  disputeType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  skip?: number;
  take?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Legal Services API Functions
export const legalServicesApi = {
  // Legal Disputes
  createLegalDispute: async (data: CreateLegalDisputeDto) => {
    const response = await api.post('/legal-services/disputes', data);
    return response.data;
  },

  getLegalDisputes: async (query?: LegalDisputeQueryDto) => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.disputeType) params.append('disputeType', query.disputeType);
    if (query?.search) params.append('search', query.search);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.skip !== undefined) params.append('skip', query.skip.toString());
    if (query?.take !== undefined) params.append('take', query.take.toString());

    const response = await api.get(`/legal-services/disputes?${params.toString()}`);
    return response.data;
  },

  getLegalDisputeById: async (id: string) => {
    const response = await api.get(`/legal-services/disputes/${id}`);
    return response.data;
  },

  updateLegalDispute: async (id: string, data: Partial<LegalDisputeFormData>) => {
    const response = await api.put(`/legal-services/disputes/${id}`, data);
    return response.data;
  },

  deleteLegalDispute: async (id: string) => {
    const response = await api.delete(`/legal-services/disputes/${id}`);
    return response.data;
  },

  addDisputeDocument: async (disputeId: string, documentId: string) => {
    const response = await api.post(`/legal-services/disputes/${disputeId}/documents`, {
      documentId
    });
    return response.data;
  },

  // Contracts
  createContract: async (data: any) => {
    const response = await api.post('/legal-services/contracts', data);
    return response.data;
  },

  getContracts: async (query?: any) => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.contractType) params.append('contractType', query.contractType);
    if (query?.search) params.append('search', query.search);
    if (query?.skip !== undefined) params.append('skip', query.skip.toString());
    if (query?.take !== undefined) params.append('take', query.take.toString());

    const response = await api.get(`/legal-services/contracts?${params.toString()}`);
    return response.data;
  },

  getContractById: async (id: string) => {
    const response = await api.get(`/legal-services/contracts/${id}`);
    return response.data;
  },

  updateContract: async (id: string, data: any) => {
    const response = await api.put(`/legal-services/contracts/${id}`, data);
    return response.data;
  },

  signContract: async (id: string, signedBy: string) => {
    const response = await api.put(`/legal-services/contracts/${id}/sign`, { signedBy });
    return response.data;
  },

  reviewContract: async (id: string, reviewNotes: string, status: string) => {
    const response = await api.put(`/legal-services/contracts/${id}/review`, {
      reviewNotes,
      status
    });
    return response.data;
  },

  // Other Legal Services
  createOtherLegalService: async (data: any) => {
    const response = await api.post('/legal-services/other-services', data);
    return response.data;
  },

  getOtherLegalServices: async (query?: any) => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.serviceType) params.append('serviceType', query.serviceType);
    if (query?.search) params.append('search', query.search);
    if (query?.skip !== undefined) params.append('skip', query.skip.toString());
    if (query?.take !== undefined) params.append('take', query.take.toString());

    const response = await api.get(`/legal-services/other-services?${params.toString()}`);
    return response.data;
  },

  getOtherLegalServiceById: async (id: string) => {
    const response = await api.get(`/legal-services/other-services/${id}`);
    return response.data;
  },

  respondToLegalService: async (id: string, responseText: string) => {
    const response = await api.put(`/legal-services/other-services/${id}/respond`, {
      response: responseText
    });
    return response.data;
  },

  // Documentation Services
  createLegalDocumentation: async (data: any) => {
    const response = await api.post('/legal-services/documentations', data);
    return response.data;
  },

  getLegalDocumentations: async (query?: any) => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.search) params.append('search', query.search);
    if (query?.skip !== undefined) params.append('skip', query.skip.toString());
    if (query?.take !== undefined) params.append('take', query.take.toString());

    const response = await api.get(`/legal-services/documentations?${params.toString()}`);
    return response.data;
  },

  certifyDocumentation: async (id: string, certificationNumber: string, notes: string) => {
    const response = await api.put(`/legal-services/documentations/${id}/certify`, {
      certificationNumber,
      notes
    });
    return response.data;
  },

  // Statistics and Reports
  getLegalServicesStats: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/legal-services/stats?${params.toString()}`);
    return response.data;
  },

  getUserLegalStats: async () => {
    const response = await api.get('/legal-services/user-stats');
    return response.data;
  },

  // Search
  searchLegalServices: async (searchTerm: string) => {
    const response = await api.get(`/legal-services/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },

  // Upload Documents
  uploadLegalDocuments: async (
    files: File[],
    serviceType: 'dispute' | 'contract' | 'documentation' | 'other',
    serviceId?: string,
    documentType?: 'contract' | 'agency' | 'additional' | 'general'
  ) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('serviceType', serviceType);
    if (serviceId) formData.append('serviceId', serviceId);
    if (documentType) formData.append('documentType', documentType);

    const response = await api.post('/legal-services/upload-documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get Enums
  getLegalEnums: async () => {
    const response = await api.get('/legal-services/enums');
    return response.data;
  }
};