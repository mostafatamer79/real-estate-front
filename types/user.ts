// types/user.ts
export enum Role {
    ADMIN = 'admin',
    USER = 'user',
    PROVIDER = 'provider',
    AGENT = 'agent',
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
    isVerified: boolean;
    isActive: boolean;
    agentLicenseNumber?: string;
    agentVerificationStatus?: VerifyStatus;
    address?: string;
    city?: string;
    country?: string;
    profileImage?: string;
    createAt: string;
  }