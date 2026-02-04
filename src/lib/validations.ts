import { z } from 'zod';

export const cpfSchema = z.string().refine((cpf) => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cleaned[10])) return false;

  return true;
}, 'CPF inválido');

export const phoneSchema = z.string().refine((phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}, 'Telefone inválido');

export const cepSchema = z.string().refine((cep) => {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.length === 8;
}, 'CEP inválido');

export const addressSchema = z.object({
  street: z.string().min(3, 'Rua deve ter no mínimo 3 caracteres'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  zip_code: cepSchema,
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const createClientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  cpf: cpfSchema,
  rg: z.string().optional(),
  phone: phoneSchema,
  phone_secondary: z.string().optional(),
  birth_date: z.string().optional(),
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  profession: z.string().optional(),
  address: addressSchema,
  notes: z.string().optional(),
  referred_by: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'pending']).optional(),
});

export const createLotSchema = z.object({
  development_id: z.string().uuid('Empreendimento inválido'),
  code: z.string().min(1, 'Código é obrigatório'),
  block: z.string().min(1, 'Quadra é obrigatória'),
  lot_number: z.string().min(1, 'Número do lote é obrigatório'),
  area_m2: z.number().positive('Área deve ser maior que zero'),
  front_size: z.number().positive().optional(),
  depth_size: z.number().positive().optional(),
  price: z.number().positive('Preço deve ser maior que zero'),
  address: z.string().optional(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  features: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const updateLotSchema = createLotSchema.partial().extend({
  status: z.enum(['available', 'reserved', 'sold']).optional(),
});

export const createServiceOrderSchema = z.object({
  client_lot_id: z.string().uuid('Lote inválido'),
  service_type_id: z.string().uuid('Tipo de serviço inválido'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  scheduled_date: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export const updateServiceOrderSchema = z.object({
  status: z.enum(['pending', 'approved', 'in_progress', 'completed', 'cancelled', 'rejected']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  scheduled_date: z.string().optional(),
  completed_date: z.string().optional(),
  estimated_cost: z.number().optional(),
  final_cost: z.number().optional(),
  admin_notes: z.string().optional(),
});

export const serviceTypeSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  category: z.string().min(2, 'Categoria é obrigatória'),
  price: z.number().optional(),
  estimated_days: z.number().int().positive().optional(),
  requires_approval: z.boolean(),
  is_active: z.boolean(),
});

export const referralSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido').optional(),
  phone: phoneSchema,
  notes: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateClientFormData = z.infer<typeof createClientSchema>;
export type UpdateClientFormData = z.infer<typeof updateClientSchema>;
export type CreateLotFormData = z.infer<typeof createLotSchema>;
export type UpdateLotFormData = z.infer<typeof updateLotSchema>;
export type CreateServiceOrderFormData = z.infer<typeof createServiceOrderSchema>;
export type UpdateServiceOrderFormData = z.infer<typeof updateServiceOrderSchema>;
export type ServiceTypeFormData = z.infer<typeof serviceTypeSchema>;
export type ReferralFormData = z.infer<typeof referralSchema>;
