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
  phone_number?: string;
  file?: string | null;
  link?: string;
  tariff?: number | null;
}

export interface TariffPlan {
  id: number;
  name: string;
  subtitle: string;
  badge?: string;
  min_beds: number;
  max_beds: number;
  month_price: number;
  year_price: number;
  yearly_discount_percent: number;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface DormitoryPayment {
  id: number;
  dormitory: number;
  tariff?: number | null;
  period: 'month' | 'year';
  amount: number;
  receipt: string;
  comment?: string;
  admin_comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at?: string;
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
