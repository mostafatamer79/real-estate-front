export enum Role {
  USER = 'user', // Beneficiary
  ADMIN = 'admin',
  BROKER = 'broker', // Wasit
  REAL_ESTATE_OFFICE = 'real_estate_office',
  OWNER = 'owner',
  LAWYER = 'lawyer',
  ENGINEERING_OFFICE = 'engineering_office',
  OTHER = 'other',
  AGENT = 'agent', // Legacy match for Broker
  MARKETING = 'marketing',
  MARKETING_ADMIN = 'marketing_admin',
  LEGAL = 'legal',
  LEGAL_ADMIN = 'legal_admin',
  FINANCE = 'finance',
  FINANCE_ADMIN = 'finance_admin',
  VIEWER = 'viewer',
  NOTARY = 'notary',
  LEGAL_CONSULTANT = 'legal_consultant',
}

export enum VerifyStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  role: Role;
  roleOtherDescription?: string;
  isVerified: boolean;
  isActive: boolean;
  
  // Licenses & Classifications
  falLicenseNumber?: string;
  falLicenseExpiry?: string; // Date string
  lawLicenseNumber?: string;
  commercialRegistrationNumber?: string;
  
  // Legacy or Generic
  agentLicenseNumber?: string;
  agentVerificationStatus?: VerifyStatus;
  
  address?: string;
  city?: string;
  country?: string;
  profileImage?: string;
  createAt: string;
  
  // New Fields
  nationalId?: string;
  postalCode?: string;
  streetName?: string;
  district?: string;
  additionalNumber?: string;
  unitNumber?: string;
  licenseIssueDate?: string;
  brokerType?: 'individual' | 'office';
}