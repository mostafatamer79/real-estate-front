import api from "@/lib/api";
export { serviceTree } from "./service-navigation";

export type DeliveryMode = "online" | "in_person";
export interface ProviderProfile {
  registrationAnswers?:Record<string,string>;
  registrationFields?:{id:string;label:string}[];
  specializationId?: string;
  specializationTitle?: string;
  archivedAt?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  kind: "general" | "notary";
  city: string;
  deliveryModes: DeliveryMode[];
  requestedCategories: string[];
  categories: string[];
  licenseNumber?: string;
  licenseDocument?: string;
  /** Gregorian calendar dates (YYYY-MM-DD); absent on legacy profiles. */
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  notes?: string;
  reviewNote?: string;
  agreementType?: "fixed" | "percentage";
  agreementValue?: number;
  minOffer?: number;
  maxOffer?: number;
}
export interface ProviderRegistrationField {id:string;label:string;required:boolean;enabled:boolean;type:'text'|'textarea'|'number';categories:string[]}
export interface ProviderSpecialization {id:string;title:string;categories:string[];enabled:boolean}
export interface ProviderUser {
  isActive?: boolean;
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  providerProfile: ProviderProfile;
}
export interface ProviderOpportunity {
  id: string;
  category: string;
  serviceType: string;
  serviceCategory?: string;
  city: string;
  district?: string;
  quantity: number;
  ownOffer?: ProviderOffer | null;
  availableDeliveryModes?: DeliveryMode[];
  metadata?: {
    providerSelection?: {
      providerId: string;
      deliveryMode: DeliveryMode;
      amount: number;
      platformFee: number;
    };
  };
}
export interface ProviderOffer {
  providerId: string;
  amount: number;
  deliveryMode: DeliveryMode;
  note?: string;
  commission?: number;
  createdAt: string;
}
export const deliveryLabel = (value: DeliveryMode, ar = true) =>
  value === "online" ? (ar ? "أونلاين" : "Online") : ar ? "حضوري" : "In person";
export const providerStatus = (value: ProviderProfile["status"], ar = true) =>
  ({
    pending: ar ? "أكمل توثيق نفاذ" : "Complete Nafath",
    approved: ar ? "معتمد" : "Approved",
    rejected: ar ? "مرفوض" : "Rejected",
    suspended: ar ? "معلق" : "Suspended",
  })[value];
export function providerError(error: unknown, fallback: string) {
  const data = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data;
  return Array.isArray(data?.message)
    ? data.message.join("، ")
    : typeof data?.message === "string"
      ? data.message
      : fallback;
}
export interface ProviderInvitation {
  token: string;
  expiresAt: string;
}
export interface ProviderInvitationValidation {
  valid: boolean;
  expiresAt?: string;
}
export type ProviderApplyInput = Partial<ProviderProfile> & {
  invitationToken?: string;
};
export const providerApi = {
  createInvitation: () =>
    api.post<ProviderInvitation>("/service-providers/invitations"),
  validateInvitation: (token: string) =>
    api.get<ProviderInvitationValidation>(
      "/service-providers/invitations/validate",
      { params: { token } },
    ),
  registrationFields:()=>api.get<ProviderRegistrationField[]>('/service-providers/registration-fields'),
  saveRegistrationFields:(items:ProviderRegistrationField[])=>api.put<ProviderRegistrationField[]>('/service-providers/registration-fields',{items}),
  specializations: () => api.get<ProviderSpecialization[]>('/service-providers/specializations'),
  saveSpecializations: (items:ProviderSpecialization[]) => api.put<ProviderSpecialization[]>('/service-providers/specializations',{items}),
  accountAction: (id:string,action:'activate'|'restrict'|'archive') => api.put(`/service-providers/${id}/account`,{action}),
  notice: (id:string,message:string) => api.post(`/service-providers/${id}/notice`,{message}),
  mine: () => api.get<ProviderProfile | null>("/service-providers/me"),
  apply: (input: ProviderApplyInput) =>
    api.post<ProviderProfile>("/service-providers/apply", input),
  list: (page: number) =>
    api.get<{ items: ProviderUser[]; total: number }>("/service-providers", {
      params: { page },
    }),
  review: (id: string, input: Partial<ProviderProfile>) =>
    api.put<ProviderProfile>(`/service-providers/${id}/review`, input),
  controls: () =>
    api.get<{ notaryPlatformFee: number | null; onlineAllCities: boolean }>(
      "/service-providers/controls",
    ),
  saveControls: (input: {
    notaryPlatformFee: number;
    onlineAllCities: boolean;
  }) => api.put("/service-providers/controls", input),
  opportunities: (page: number, filter: { category?: string; service?: string } = {}) =>
    api.get<{ items: ProviderOpportunity[]; total: number }>(
      "/service-providers/opportunities",
      { params: { page, ...filter } },
    ),
  offer: (
    id: string,
    input: { amount: number; deliveryMode: DeliveryMode; note: string },
  ) => api.post(`/service-providers/requests/${id}/offers`, input),
  offers: (id: string) =>
    api.get<{
      offers: ProviderOffer[];
      selection: {
        providerId: string;
        amount: number;
        platformFee: number;
      } | null;
    }>(`/service-providers/requests/${id}/offers`),
  assign: (id: string, providerId: string) =>
    api.put(`/service-providers/requests/${id}/assign/${providerId}`),
  contact: (id: string) =>
    api.get<{ unlocked: boolean; phone: string | null; name?: string }>(
      `/service-providers/requests/${id}/contact`,
    ),
  myRequests: (page: number) =>
    api.get<{ items: ProviderOpportunity[]; total: number }>(
      "/service-providers/my-requests",
      { params: { page } },
    ),
};
