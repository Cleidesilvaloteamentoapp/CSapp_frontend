export type ClientStatus = 'active' | 'inactive' | 'defaulter';
export type ClientLotStatus = 'active' | 'completed' | 'cancelled';

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
}

export interface Client {
  id: string;
  profile_id: string;
  email: string;
  full_name: string;
  cpf_cnpj: string;
  phone: string;
  address: Address | null;
  documents: string[];
  status: ClientStatus;
  asaas_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientData {
  email: string;
  password: string;
  full_name: string;
  cpf_cnpj: string;
  phone: string;
  address?: Address;
}

export interface UpdateClientData {
  full_name?: string;
  phone?: string;
  status?: ClientStatus;
  address?: Address;
}

export interface ClientFilters {
  status?: ClientStatus;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaymentPlan {
  total_installments: number;
  installment_value: number;
  first_due_date: string;
  down_payment?: number;
}

export interface ClientLot {
  id: string;
  client_id: string;
  client_name?: string;
  lot_id: string;
  lot_number?: string;
  development_name?: string;
  purchase_date: string;
  total_value: number;
  payment_plan: PaymentPlan;
  status: ClientLotStatus;
  created_at: string;
}

export interface CreateClientLotData {
  client_id: string;
  lot_id: string;
  purchase_date: string;
  total_value: number;
  payment_plan: PaymentPlan;
}

export interface Referral {
  id: string;
  referrer_client_id: string;
  referred_name: string;
  referred_phone: string;
  referred_email?: string;
  status: 'pending' | 'contacted' | 'converted' | 'lost';
  created_at: string;
}

export interface CreateReferralData {
  referred_name: string;
  referred_phone: string;
  referred_email?: string;
}
