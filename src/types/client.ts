export interface Client {
  id: string;
  organization_id: string;
  user_id?: string;
  name: string;
  email: string;
  cpf: string;
  rg?: string;
  phone: string;
  phone_secondary?: string;
  birth_date?: string;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  profession?: string;
  address: Address;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
  referred_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface CreateClientData {
  name: string;
  email: string;
  cpf: string;
  rg?: string;
  phone: string;
  phone_secondary?: string;
  birth_date?: string;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  profession?: string;
  address: Address;
  notes?: string;
  referred_by?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  status?: 'active' | 'inactive' | 'pending';
}

export interface ClientFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'pending';
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ClientLot {
  id: string;
  client_id: string;
  lot_id: string;
  contract_number: string;
  contract_date: string;
  total_value: number;
  down_payment: number;
  installments: number;
  installment_value: number;
  due_day: number;
  status: 'active' | 'completed' | 'cancelled';
  lot?: import('./lot').Lot;
  client?: Client;
  created_at: string;
  updated_at: string;
}
