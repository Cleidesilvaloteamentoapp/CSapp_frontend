import { z } from "zod";

// ---------------------------------------------------------------------------
// CPF/CNPJ validation (check digits) — mirrors backend app/utils/documents.py
// ---------------------------------------------------------------------------

const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");

export function isValidCpf(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (const len of [9, 10]) {
    let total = 0;
    for (let i = 0; i < len; i++) total += parseInt(d[i], 10) * (len + 1 - i);
    let check = (total * 10) % 11;
    if (check === 10) check = 0;
    if (check !== parseInt(d[len], 10)) return false;
  }
  return true;
}

export function isValidCnpj(cnpj: string): boolean {
  const d = onlyDigits(cnpj);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, ...w1];
  for (const [weights, pos] of [[w1, 12], [w2, 13]] as const) {
    let total = 0;
    for (let i = 0; i < pos; i++) total += parseInt(d[i], 10) * weights[i];
    const rem = total % 11;
    const check = rem < 2 ? 0 : 11 - rem;
    if (check !== parseInt(d[pos], 10)) return false;
  }
  return true;
}

export function isValidCpfCnpj(documento: string): boolean {
  const d = onlyDigits(documento);
  if (d.length === 11) return isValidCpf(d);
  if (d.length === 14) return isValidCnpj(d);
  return false;
}

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

export const clientCreateSchema = z
  .object({
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
    password: z.string().max(128).optional(),
  })
  .superRefine((data, ctx) => {
    // Só valida senha quando create_access é true
    if (data.create_access === true) {
      if (!data.password || data.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Senha deve ter no mínimo 8 caracteres",
          path: ["password"],
        });
      }
    }
  });

export const propertyTypeSchema = z.enum(["LOT", "HOUSE", "APARTMENT", "COMMERCIAL", "RURAL"], {
  message: "Selecione o tipo de imóvel",
});

export const developmentCreateSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  location: z.string().optional(),
  property_type: propertyTypeSchema,
  // Campos específicos para lotes
  block: z.string().optional(),
  lot_number: z.string().optional(),
  area_m2: z.coerce.number().positive("Área deve ser maior que 0").optional(),
  // Campos específicos para casas/apartamentos
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  suites: z.coerce.number().int().min(0).optional(),
  parking_spaces: z.coerce.number().int().min(0).optional(),
  construction_area_m2: z.coerce.number().positive().optional(),
  total_area_m2: z.coerce.number().positive().optional(),
  // Campos para imóveis em geral
  price: z.coerce.number().positive("Preço deve ser maior que 0").optional(),
}).superRefine((data, ctx) => {
  // Validações específicas para lotes
  if (data.property_type === "LOT") {
    if (!data.lot_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número do lote é obrigatório para lotes",
        path: ["lot_number"],
      });
    }
    if (!data.area_m2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Área é obrigatória para lotes",
        path: ["area_m2"],
      });
    }
  }
  // Validações específicas para casas/apartamentos
  if (["HOUSE", "APARTMENT"].includes(data.property_type)) {
    if (!data.bedrooms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número de quartos é obrigatório",
        path: ["bedrooms"],
      });
    }
    if (!data.bathrooms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número de banheiros é obrigatório",
        path: ["bathrooms"],
      });
    }
    if (!data.construction_area_m2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Área construída é obrigatória",
        path: ["construction_area_m2"],
      });
    }
  }
});

export const lotCreateSchema = z.object({
  development_id: z.string().uuid("Selecione um empreendimento"),
  lot_number: z.string().min(1, "Número do lote é obrigatório"),
  block: z.string().optional(),
  area_m2: z.coerce.number().positive("Área deve ser maior que 0"),
  price: z.coerce.number().positive("Preço deve ser maior que 0"),
});

export const lotUpdateSchema = z.object({
  lot_number: z.string().min(1, "Número do lote é obrigatório").optional(),
  block: z.string().optional(),
  area_m2: z.coerce.number().positive("Área deve ser maior que 0").optional(),
  price: z.coerce.number().positive("Preço deve ser maior que 0").optional(),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]).optional(),
});

export const lotAssignSchema = z.object({
  client_id: z.string().uuid("Selecione um cliente"),
  lot_id: z.string().uuid("Selecione um lote"),
  purchase_date: z.string().min(1, "Data de compra é obrigatória"),
  total_value: z.coerce.number().positive("Valor deve ser maior que 0"),
  down_payment: z.coerce.number().min(0).optional(),
  total_installments: z.coerce.number().int().positive().optional(),
  annual_adjustment_rate: z.coerce.number().min(0).max(100).optional(),
  penalty_rate: z.coerce.number().min(0).max(100).optional(),
  daily_interest_rate: z.coerce.number().min(0).max(1).optional(),
  adjustment_index: z.enum(["IPCA", "IGPM", "CUB", "INPC"]).optional(),
  adjustment_frequency: z.enum(["MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"]).optional(),
  adjustment_custom_rate: z.coerce.number().min(0).max(100).optional(),
  manual_index_value: z.coerce.number().min(0).max(100).optional(),
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
export type LotUpdateFormData = z.infer<typeof lotUpdateSchema>;
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
  penalty_rate: z.coerce.number().min(0, "Multa não pode ser negativa").max(100, "Multa máxima 100%"),
  daily_interest_rate: z.coerce.number().min(0, "Juros não pode ser negativo").max(1, "Juros diário máximo 1%"),
  adjustment_index: z.enum(["IPCA", "IGPM", "CUB", "INPC"], { message: "Selecione o índice" }),
  adjustment_frequency: z.enum(["MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"], { message: "Selecione a frequência" }),
  adjustment_custom_rate: z.coerce.number().min(0, "Taxa não pode ser negativa").max(100, "Taxa máxima 100%"),
});

export type FinancialSettingsFormData = z.infer<typeof financialSettingsSchema>;
