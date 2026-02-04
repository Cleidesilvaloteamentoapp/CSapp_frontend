export interface Lot {
  id: string;
  organization_id: string;
  development_id: string;
  code: string;
  block: string;
  lot_number: string;
  area_m2: number;
  front_size?: number;
  depth_size?: number;
  price: number;
  status: 'available' | 'reserved' | 'sold';
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  features?: string[];
  notes?: string;
  development?: Development;
  created_at: string;
  updated_at: string;
}

export interface Development {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  total_lots: number;
  available_lots: number;
  price_range_min: number;
  price_range_max: number;
  amenities?: string[];
  images?: string[];
  status: 'planning' | 'launching' | 'selling' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateLotData {
  development_id: string;
  code: string;
  block: string;
  lot_number: string;
  area_m2: number;
  front_size?: number;
  depth_size?: number;
  price: number;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  features?: string[];
  notes?: string;
}

export interface UpdateLotData extends Partial<CreateLotData> {
  status?: 'available' | 'reserved' | 'sold';
}

export interface LotFilters {
  development_id?: string;
  status?: 'available' | 'reserved' | 'sold';
  block?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  search?: string;
  page?: number;
  per_page?: number;
}
