export enum Role {
  ADMIN = 'admin',
  USER = 'user', // Beneficiary / المستفيد
  MANGER = 'manager', // Manager
  EMPLOYEE = 'employee', // Employee / موظف
  MARKETING = 'marketing',
  MARKETING_ADMIN = 'marketing_admin',
  LEGAL = 'legal',
  LEGAL_ADMIN = 'legal_admin',
  FINANCE = 'finance',
  FINANCE_ADMIN = 'finance_admin',
  VIEWER = 'viewer',
  AGENT = 'agent',
  BROKER = 'broker',
  REAL_ESTATE_OFFICE = 'real_estate_office',
  OWNER = 'owner',
  LAWYER = 'lawyer',
  NOTARY = 'notary',
  LEGAL_CONSULTANT = 'legal_consultant',
  ENGINEERING_OFFICE = 'engineering_office',
  COLLABORATOR = 'collaborator',
  OTHER = 'other',
}

export enum Department {
  MARKETING = 'marketing',
  PROPERTIES = 'properties',
  OFFERS = 'offers',
  ORDERS = 'orders',
  FINANCE = 'finance',
  LEGAL = 'legal',
  EMPLOYEES = 'employees',
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
  parentId?:string;
  
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
  departments?: Department[];
  departmentPermissions?: Record<string, any>;
}
