export interface AmenityRef {
  id: number;
  name: string;
}

export interface DormitoryImage {
  id: number;
  image: string;
}

export interface DormitorySettings {
  id: number;
  name: string;
  address: string;
  distance: number;
  description: string;
  month_price: number;
  year_price: number;
  latitude?: number;
  longitude?: number;
  rating?: number;
  is_active?: boolean;
  amenities: Array<AmenityRef | number>;
  amenities_list?: AmenityRef[];
  university_name?: string;
  university?: number;
  admin?: { username: string; id: number } | number;
  admin_name?: string;
  images?: DormitoryImage[];
  phone_numer?: string;
  link?: string;
}

export interface Amenity {
  id: number;
  name: string;
  is_active: boolean;
}

export interface RuleItem {
  id?: number;
  rule: string;
}
