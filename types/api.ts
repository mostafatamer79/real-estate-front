export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface FindAllParams {
  status?: string;
  propertyType?: string;
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  propertyAge?: string;
  direction?: string;
  propertyCondition?: string;
  hasElevator?: boolean;
  hasGarage?: boolean;
  hasPool?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface CreateOfferDto {
  propertyType: string;
  length?: number;
  width?: number;
  area: number;
  propertyAge: string;
  direction: string;
  price: number;
  city: string;
  neighborhood: string;
  streetWidth?: number;
  deedType: string;
  propertyCondition: string;
  rooms?: number;
  bathrooms?: number;
  livingRooms?: number;
  kitchens?: number;
  floors?: number;
  apartments?: number;
  hasMaidRoom?: boolean;
  hasRoof?: boolean;
  hasExternalAnnex?: boolean;
  buildingArea?: number;
  hasGarage?: boolean;
  hasPool?: boolean;
  hasElevator?: boolean;
  furnitureStatus?: string;
  additionalNotes?: string;
  propertyDocuments?: string[];
  checkImage?: string;
  mediaFiles?: string[];
  threeDVideos?: string[];
  status?: string;
}

export interface UpdateOfferDto extends Partial<CreateOfferDto> {}

export interface Offer extends CreateOfferDto {
  id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  orderType: string;
  propertyType: string;
  city: string;
  neighborhood: string;
  area: number;
  propertyAge: string;
  deedType: string;
  price: number;
  additionalDetails?: string;
}

export interface Order extends CreateOrderDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}
