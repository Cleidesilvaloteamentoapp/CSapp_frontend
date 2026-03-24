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
  down_payment: z.coerce.number().min(0).optional(),
  total_installments: z.coerce.number().int().positive().optional(),
  annual_adjustment_rate: z.coerce.number().min(0).optional(),
  penalty_rate: z.coerce.number().min(0).optional(),
  daily_interest_rate: z.coerce.number().min(0).optional(),
  adjustment_index: z.enum(["IPCA", "IGPM", "CUB", "INPC"]).optional(),
  adjustment_frequency: z.enum(["MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"]).optional(),
  adjustment_custom_rate: z.coerce.number().min(0).optional(),
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

export const economicIndexCreateSchema = z.object({
  index_type: z.enum(["IPCA", "IGPM", "CUB", "INPC"], { message: "Selecione o tipo" }),
  reference_month: z.string().min(1, "Mês de referência é obrigatório"),
  value: z.coerce.number({ message: "Valor é obrigatório" }),
  state_code: z.string().length(2, "UF deve ter 2 caracteres").optional().or(z.literal("")),
});

export const cycleApproveSchema = z.object({
  new_installment_value: z.coerce.number().positive("Valor deve ser maior que 0"),
  admin_notes: z.string().optional(),
});

export const cycleRejectSchema = z.object({
  admin_notes: z.string().min(5, "Motivo deve ter no mínimo 5 caracteres"),
});

export const transferCreateSchema = z.object({
  client_lot_id: z.string().uuid("Selecione um lote"),
  to_client_id: z.string().uuid("Selecione o cliente destino"),
  transfer_fee: z.coerce.number().min(0).optional(),
  reason: z.string().optional(),
});

export const earlyPayoffRequestSchema = z.object({
  client_lot_id: z.string().uuid("Selecione um lote"),
  client_message: z.string().optional(),
});

export const manualWriteoffSchema = z.object({
  reason: z.string().min(5, "Motivo deve ter no mínimo 5 caracteres"),
  valor_liquidacao: z.coerce.number().positive().optional(),
  data_liquidacao: z.string().optional(),
});

export type EconomicIndexCreateFormData = z.infer<typeof economicIndexCreateSchema>;
export type CycleApproveFormData = z.infer<typeof cycleApproveSchema>;
export type CycleRejectFormData = z.infer<typeof cycleRejectSchema>;
export type TransferCreateFormData = z.infer<typeof transferCreateSchema>;
export type EarlyPayoffRequestFormData = z.infer<typeof earlyPayoffRequestSchema>;
export type ManualWriteoffFormData = z.infer<typeof manualWriteoffSchema>;

export const financialSettingsSchema = z.object({
  penalty_rate: z.coerce.number().min(0, "Multa não pode ser negativa").max(1, "Multa máxima 100%"),
  daily_interest_rate: z.coerce.number().min(0, "Juros não pode ser negativo").max(0.01, "Juros diário máximo 1%"),
  adjustment_index: z.enum(["IPCA", "IGPM", "CUB", "INPC"], { message: "Selecione o índice" }),
  adjustment_frequency: z.enum(["MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"], { message: "Selecione a frequência" }),
  adjustment_custom_rate: z.coerce.number().min(0, "Taxa não pode ser negativa").max(1, "Taxa máxima 100%"),
});

export type FinancialSettingsFormData = z.infer<typeof financialSettingsSchema>;
