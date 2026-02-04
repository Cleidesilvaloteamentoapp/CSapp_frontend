export type LotStatus = 'available' | 'reserved' | 'sold';

export interface Development {
  id: string;
  name: string;
  description?: string;
  location: string;
  documents: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateDevelopmentData {
  name: string;
  description?: string;
  location: string;
}

export interface UpdateDevelopmentData {
  name?: string;
  description?: string;
  location?: string;
}

export interface Lot {
  id: string;
  development_id: string;
  development_name?: string;
  lot_number: string;
  block?: string;
  area_m2: number;
  price: number;
  status: LotStatus;
  documents: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateLotData {
  development_id: string;
  lot_number: string;
  block?: string;
  area_m2: number;
  price: number;
  status?: LotStatus;
}

export interface UpdateLotData {
  lot_number?: string;
  block?: string;
  area_m2?: number;
  price?: number;
  status?: LotStatus;
}

export interface LotFilters {
  development_id?: string;
  status?: LotStatus;
  page?: number;
  page_size?: number;
}

export interface LotDocument {
  path: string;
  url: string;
}
