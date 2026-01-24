export interface Place {
  id: string | number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  city?: string;
  [key: string]: any;
}
