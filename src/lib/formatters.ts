import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '-';
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '-';
    return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return '-';
  }
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '-';
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  return cpf;
}

export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '-';
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  }
  return cnpj;
}

export function formatCPFCNPJ(value: string | null | undefined): string {
  if (!value) return '-';
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return formatCPF(cleaned);
  }
  if (cleaned.length === 14) {
    return formatCNPJ(cleaned);
  }
  return value;
}

export function formatArea(area: number): string {
  return `${area.toLocaleString('pt-BR')} m²`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    defaulter: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    available: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    reserved: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    sold: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    requested: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    approved: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    converted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    defaulter: 'Inadimplente',
    available: 'Disponível',
    reserved: 'Reservado',
    sold: 'Vendido',
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Vencido',
    cancelled: 'Cancelado',
    requested: 'Solicitado',
    approved: 'Aprovado',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    contacted: 'Contatado',
    converted: 'Convertido',
    lost: 'Perdido',
  };
  
  return labels[status] || status;
}
