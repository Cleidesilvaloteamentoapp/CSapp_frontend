import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
});

export const signupSchema = z.object({
  company_name: z.string().min(2, "Nome da empresa deve ter no mínimo 2 caracteres").max(255),
  company_slug: z
    .string()
    .min(2, "Slug deve ter no mínimo 2 caracteres")
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  full_name: z.string().min(2, "Nome completo deve ter no mínimo 2 caracteres").max(255),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(128),
  cpf_cnpj: z.string().min(11, "CPF/CNPJ inválido").max(20),
  phone: z.string().min(10, "Telefone inválido").max(20),
});

export const clientCreateSchema = z.object({
  email: z.string().email("E-mail inválido"),
  full_name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(255),
  cpf_cnpj: z.string().min(11, "CPF/CNPJ inválido").max(20),
  phone: z.string().min(10, "Telefone inválido").max(20),
  address: z
    .object({
      street: z.string().optional(),
      number: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
  create_access: z.boolean().default(false),
  password: z.string().min(8).max(128).optional(),
});

export const developmentCreateSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  location: z.string().optional(),
});

export const lotCreateSchema = z.object({
  development_id: z.string().uuid("Selecione um empreendimento"),
  lot_number: z.string().min(1, "Número do lote é obrigatório"),
  block: z.string().optional(),
  area_m2: z.coerce.number().positive("Área deve ser maior que 0"),
  price: z.coerce.number().positive("Preço deve ser maior que 0"),
});

export const lotAssignSchema = z.object({
  client_id: z.string().uuid("Selecione um cliente"),
  lot_id: z.string().uuid("Selecione um lote"),
  purchase_date: z.string().min(1, "Data de compra é obrigatória"),
  total_value: z.coerce.number().positive("Valor deve ser maior que 0"),
  payment_plan: z
    .object({
      installments: z.coerce.number().int().positive().optional(),
      first_due: z.string().optional(),
      down_payment: z.coerce.number().optional(),
      monthly_value: z.coerce.number().optional(),
    })
    .optional(),
});

export const serviceTypeCreateSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  base_price: z.coerce.number().min(0, "Preço não pode ser negativo").optional(),
  is_active: z.boolean().optional().default(true),
});

export const serviceOrderCreateSchema = z.object({
  service_type_id: z.string().uuid("Selecione um tipo de serviço"),
  lot_id: z.string().uuid("Selecione um lote").optional(),
  notes: z.string().optional(),
});

export const referralCreateSchema = z.object({
  referred_name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  referred_phone: z.string().min(10, "Telefone inválido").max(20),
  referred_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ClientCreateFormData = z.infer<typeof clientCreateSchema>;
export type DevelopmentCreateFormData = z.infer<typeof developmentCreateSchema>;
export type LotCreateFormData = z.infer<typeof lotCreateSchema>;
export type LotAssignFormData = z.infer<typeof lotAssignSchema>;
export type ServiceTypeCreateFormData = z.infer<typeof serviceTypeCreateSchema>;
export type ServiceOrderCreateFormData = z.infer<typeof serviceOrderCreateSchema>;
export type ReferralCreateFormData = z.infer<typeof referralCreateSchema>;
