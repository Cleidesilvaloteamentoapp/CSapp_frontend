# Guia de Integração Frontend - Sistema de Gestão Imobiliária

## 📋 Informações Gerais da API

### Base URL
```
http://localhost:8000/api/v1
```

### Autenticação
Todas as rotas protegidas requerem o header:
```
Authorization: Bearer {access_token}
```

### Formato de Resposta
- **Sucesso**: JSON com dados solicitados
- **Erro**: JSON com `{"detail": "mensagem de erro"}`

---

## 🔐 Autenticação

### 1. Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta**:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "role": "admin" | "client",
    "full_name": "Nome Completo"
  }
}
```

### 2. Obter Usuário Atual
```http
GET /api/v1/auth/me
Authorization: Bearer {token}
```

**Resposta**:
```json
{
  "id": "uuid",
  "email": "usuario@exemplo.com",
  "full_name": "Nome Completo",
  "cpf_cnpj": "12345678901",
  "phone": "11999999999",
  "role": "admin" | "client",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 3. Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

### 4. Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
```

---

## 👨‍💼 Rotas Admin

### Dashboard - Estatísticas

```http
GET /api/v1/admin/dashboard/stats
Authorization: Bearer {admin_token}
```

**Resposta**:
```json
{
  "total_clients": 150,
  "active_clients": 120,
  "defaulter_clients": 10,
  "total_lots": 500,
  "available_lots": 200,
  "sold_lots": 250,
  "open_service_orders": 15,
  "completed_service_orders": 85
}
```

### Dashboard - Financeiro

```http
GET /api/v1/admin/dashboard/financial
Authorization: Bearer {admin_token}
```

**Resposta**:
```json
{
  "total_receivables": 1500000.00,
  "total_received": 800000.00,
  "total_overdue": 150000.00,
  "defaulters": [
    {
      "client_id": "uuid",
      "client_name": "João Silva",
      "cpf_cnpj": "12345678901",
      "phone": "11999999999",
      "overdue_amount": 15000.00,
      "overdue_invoices_count": 3,
      "oldest_overdue_date": "2024-01-15"
    }
  ],
  "revenue_from_services": 50000.00,
  "service_costs": 30000.00,
  "service_profit": 20000.00
}
```

### Clientes

#### Listar Clientes
```http
GET /api/v1/admin/clients?status=active&search=joão&page=1&page_size=20
Authorization: Bearer {admin_token}
```

**Parâmetros de Query**:
- `status`: `active` | `inactive` | `defaulter` (opcional)
- `search`: busca por nome ou email (opcional)
- `page`: número da página (padrão: 1)
- `page_size`: itens por página (padrão: 20, máx: 100)

**Resposta**:
```json
{
  "items": [
    {
      "id": "uuid",
      "profile_id": "uuid",
      "email": "cliente@exemplo.com",
      "full_name": "João Silva",
      "cpf_cnpj": "12345678901",
      "phone": "11999999999",
      "address": {
        "street": "Rua Exemplo",
        "number": "123",
        "complement": "Apto 45",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zip_code": "01234-567",
        "country": "Brasil"
      },
      "documents": ["path/to/doc1.pdf"],
      "status": "active",
      "asaas_customer_id": "cus_123",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8
}
```

#### Criar Cliente
```http
POST /api/v1/admin/clients
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "novocliente@exemplo.com",
  "password": "SenhaSegura123!",
  "full_name": "Maria Santos",
  "cpf_cnpj": "98765432100",
  "phone": "11988888888",
  "address": {
    "street": "Rua Nova",
    "number": "456",
    "neighborhood": "Jardim",
    "city": "São Paulo",
    "state": "SP",
    "zip_code": "01234-567"
  }
}
```

#### Obter Cliente
```http
GET /api/v1/admin/clients/{client_id}
Authorization: Bearer {admin_token}
```

#### Atualizar Cliente
```http
PUT /api/v1/admin/clients/{client_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "full_name": "Maria Santos Silva",
  "phone": "11988888888",
  "status": "active"
}
```

#### Desativar Cliente
```http
DELETE /api/v1/admin/clients/{client_id}
Authorization: Bearer {admin_token}
```

### Empreendimentos (Developments)

#### Listar Empreendimentos
```http
GET /api/v1/admin/developments
Authorization: Bearer {admin_token}
```

**Resposta**:
```json
[
  {
    "id": "uuid",
    "name": "Residencial Jardim das Flores",
    "description": "Loteamento com infraestrutura completa",
    "location": "Rodovia BR-101, Km 45",
    "documents": ["path/to/doc.pdf"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Criar Empreendimento
```http
POST /api/v1/admin/developments
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Residencial Novo Horizonte",
  "description": "Loteamento residencial premium",
  "location": "Avenida Principal, 1000"
}
```

#### Atualizar Empreendimento
```http
PUT /api/v1/admin/developments/{development_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Nome Atualizado",
  "description": "Nova descrição"
}
```

### Lotes (Lots)

#### Listar Lotes
```http
GET /api/v1/admin/lots?development_id=uuid&status=available&page=1&page_size=50
Authorization: Bearer {admin_token}
```

**Parâmetros**:
- `development_id`: filtrar por empreendimento (opcional)
- `status`: `available` | `reserved` | `sold` (opcional)
- `page`: número da página
- `page_size`: itens por página (máx: 100)

**Resposta**:
```json
[
  {
    "id": "uuid",
    "development_id": "uuid",
    "development_name": "Residencial Jardim das Flores",
    "lot_number": "01",
    "block": "A",
    "area_m2": 300.00,
    "price": 45000.00,
    "status": "available",
    "documents": [],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Criar Lote
```http
POST /api/v1/admin/lots
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "development_id": "uuid",
  "lot_number": "15",
  "block": "B",
  "area_m2": 350.00,
  "price": 52500.00,
  "status": "available"
}
```

#### Atualizar Lote
```http
PUT /api/v1/admin/lots/{lot_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "price": 55000.00,
  "status": "reserved"
}
```

### Vincular Lote ao Cliente

```http
POST /api/v1/admin/client-lots
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "client_id": "uuid",
  "lot_id": "uuid",
  "purchase_date": "2024-01-15",
  "total_value": 45000.00,
  "payment_plan": {
    "total_installments": 60,
    "installment_value": 750.00,
    "first_due_date": "2024-02-15",
    "down_payment": 5000.00
  }
}
```

**Resposta**:
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "client_name": "João Silva",
  "lot_id": "uuid",
  "lot_number": "01",
  "development_name": "Residencial Jardim",
  "purchase_date": "2024-01-15",
  "total_value": 45000.00,
  "payment_plan": {...},
  "status": "active",
  "created_at": "2024-01-15T00:00:00Z"
}
```

### Tipos de Serviço

#### Listar Tipos de Serviço
```http
GET /api/v1/admin/service-types
Authorization: Bearer {admin_token}
```

**Resposta**:
```json
[
  {
    "id": "uuid",
    "name": "Limpeza de Terreno",
    "description": "Serviço de limpeza e capina",
    "base_price": 500.00,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Criar Tipo de Serviço
```http
POST /api/v1/admin/service-types
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Terraplanagem",
  "description": "Nivelamento do terreno",
  "base_price": 3000.00,
  "is_active": true
}
```

### Ordens de Serviço

#### Listar Ordens de Serviço
```http
GET /api/v1/admin/service-orders?status=requested&client_id=uuid&page=1
Authorization: Bearer {admin_token}
```

**Parâmetros**:
- `status`: `requested` | `approved` | `in_progress` | `completed` | `cancelled`
- `client_id`: filtrar por cliente (opcional)
- `page`, `page_size`: paginação

**Resposta**:
```json
[
  {
    "id": "uuid",
    "client_id": "uuid",
    "client_name": "João Silva",
    "lot_id": "uuid",
    "lot_number": "01",
    "service_type_id": "uuid",
    "service_type_name": "Limpeza de Terreno",
    "requested_date": "2024-01-20",
    "execution_date": null,
    "status": "requested",
    "cost": 500.00,
    "revenue": null,
    "notes": "Cliente solicitou urgência",
    "created_at": "2024-01-20T00:00:00Z",
    "updated_at": "2024-01-20T00:00:00Z"
  }
]
```

#### Atualizar Ordem de Serviço
```http
PUT /api/v1/admin/service-orders/{order_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "in_progress",
  "execution_date": "2024-01-25",
  "cost": 450.00,
  "revenue": 500.00,
  "notes": "Serviço iniciado"
}
```

#### Analytics de Serviços
```http
GET /api/v1/admin/service-orders/analytics?date_from=2024-01-01&date_to=2024-12-31
Authorization: Bearer {admin_token}
```

**Resposta**:
```json
{
  "total_orders": 100,
  "total_cost": 45000.00,
  "total_revenue": 50000.00,
  "profit": 5000.00,
  "orders_by_status": {
    "completed": 85,
    "in_progress": 10,
    "requested": 5
  },
  "orders_by_type": {
    "Limpeza de Terreno": 40,
    "Terraplanagem": 30,
    "Muro de Divisa": 30
  }
}
```

---

## 👤 Rotas Cliente

### Dashboard do Cliente

```http
GET /api/v1/client/dashboard
Authorization: Bearer {client_token}
```

**Resposta**:
```json
{
  "client_name": "João Silva",
  "total_lots": 2,
  "lots": [
    {
      "client_lot_id": "uuid",
      "lot_number": "01",
      "area_m2": 300.00,
      "development_name": "Residencial Jardim",
      "total_value": 45000.00,
      "status": "active"
    }
  ],
  "pending_invoices": 5,
  "total_pending_amount": 3750.00,
  "next_due_date": "2024-02-15",
  "open_service_orders": 2,
  "recent_notifications": [
    {
      "id": "uuid",
      "type": "payment_overdue",
      "title": "Pagamento em Atraso",
      "message": "Seu boleto vence amanhã",
      "created_at": "2024-01-14T00:00:00Z"
    }
  ]
}
```

### Faturas/Boletos

#### Listar Boletos
```http
GET /api/v1/client/invoices?client_lot_id=uuid&status=pending&page=1
Authorization: Bearer {client_token}
```

**Parâmetros**:
- `client_lot_id`: filtrar por lote (opcional)
- `status`: `pending` | `paid` | `overdue` | `cancelled`
- `page`, `page_size`: paginação

**Resposta**:
```json
{
  "items": [
    {
      "id": "uuid",
      "client_lot_id": "uuid",
      "asaas_payment_id": "pay_123",
      "due_date": "2024-02-15",
      "amount": 750.00,
      "status": "pending",
      "installment_number": 1,
      "barcode": "linha-digitavel-do-boleto",
      "payment_url": "https://asaas.com/pay/123",
      "paid_at": null,
      "created_at": "2024-01-15T00:00:00Z",
      "lot_number": "01",
      "development_name": "Residencial Jardim"
    }
  ],
  "total": 60,
  "total_pending": 45000.00,
  "total_paid": 0.00,
  "total_overdue": 0.00
}
```

#### Detalhes do Boleto
```http
GET /api/v1/client/invoices/{invoice_id}
Authorization: Bearer {client_token}
```

### Lotes do Cliente

```http
GET /api/v1/client/lots
Authorization: Bearer {client_token}
```

**Resposta**:
```json
[
  {
    "id": "uuid",
    "client_id": "uuid",
    "client_name": "João Silva",
    "lot_id": "uuid",
    "lot_number": "01",
    "development_name": "Residencial Jardim",
    "purchase_date": "2024-01-15",
    "total_value": 45000.00,
    "payment_plan": {
      "total_installments": 60,
      "installment_value": 750.00,
      "first_due_date": "2024-02-15"
    },
    "status": "active",
    "created_at": "2024-01-15T00:00:00Z"
  }
]
```

### Documentos do Lote

```http
GET /api/v1/client/lots/{lot_id}/documents
Authorization: Bearer {client_token}
```

**Resposta**:
```json
{
  "lot_id": "uuid",
  "documents": [
    {
      "path": "lot-uuid/document.pdf",
      "url": "https://signed-url-expires-in-1h"
    }
  ]
}
```

### Serviços Disponíveis

```http
GET /api/v1/client/service-types
Authorization: Bearer {client_token}
```

**Resposta**: Lista de tipos de serviço ativos (mesmo formato do admin)

### Solicitar Serviço

```http
POST /api/v1/client/service-orders
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "lot_id": "uuid",
  "service_type_id": "uuid",
  "requested_date": "2024-02-01",
  "notes": "Preciso com urgência"
}
```

### Minhas Ordens de Serviço

```http
GET /api/v1/client/service-orders?status=in_progress
Authorization: Bearer {client_token}
```

### Detalhes da Ordem de Serviço

```http
GET /api/v1/client/service-orders/{order_id}
Authorization: Bearer {client_token}
```

### Documentos do Cliente

#### Listar Documentos
```http
GET /api/v1/client/documents
Authorization: Bearer {client_token}
```

**Resposta**:
```json
{
  "client_documents": [
    {
      "path": "client-uuid/doc.pdf",
      "url": "https://signed-url",
      "type": "client"
    }
  ],
  "lot_documents": [
    {
      "path": "lot-uuid/doc.pdf",
      "url": "https://signed-url",
      "type": "lot",
      "lot_id": "uuid"
    }
  ]
}
```

#### Upload de Documento
```http
POST /api/v1/client/documents
Authorization: Bearer {client_token}
Content-Type: multipart/form-data

file: [arquivo.pdf]
```

### Indicações (Referrals)

#### Criar Indicação
```http
POST /api/v1/client/referrals
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "referred_name": "Pedro Santos",
  "referred_phone": "11977777777",
  "referred_email": "pedro@exemplo.com"
}
```

#### Minhas Indicações
```http
GET /api/v1/client/referrals
Authorization: Bearer {client_token}
```

**Resposta**:
```json
{
  "referrals": [
    {
      "id": "uuid",
      "referrer_client_id": "uuid",
      "referred_name": "Pedro Santos",
      "referred_phone": "11977777777",
      "referred_email": "pedro@exemplo.com",
      "status": "pending",
      "created_at": "2024-01-20T00:00:00Z"
    }
  ],
  "total": 5
}
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### profiles
```sql
- id (uuid, PK, FK para auth.users)
- role (enum: 'admin', 'client')
- full_name (text)
- cpf_cnpj (text, unique)
- phone (text)
- asaas_customer_id (text, nullable)
- created_at, updated_at (timestamp)
```

#### clients
```sql
- id (uuid, PK)
- profile_id (uuid, FK para profiles)
- email (text)
- address (jsonb)
- documents (jsonb) - array de paths
- status (enum: 'active', 'inactive', 'defaulter')
- created_by (uuid, FK para profiles - admin)
- created_at, updated_at (timestamp)
```

#### developments
```sql
- id (uuid, PK)
- name (text)
- description (text)
- location (text)
- documents (jsonb)
- created_at, updated_at (timestamp)
```

#### lots
```sql
- id (uuid, PK)
- development_id (uuid, FK para developments)
- lot_number (text)
- block (text, nullable)
- area_m2 (decimal)
- price (decimal)
- status (enum: 'available', 'reserved', 'sold')
- documents (jsonb)
- created_at, updated_at (timestamp)
```

#### client_lots
```sql
- id (uuid, PK)
- client_id (uuid, FK para clients)
- lot_id (uuid, FK para lots)
- purchase_date (date)
- total_value (decimal)
- payment_plan (jsonb)
- status (enum: 'active', 'completed', 'cancelled')
- created_at (timestamp)
```

#### invoices
```sql
- id (uuid, PK)
- client_lot_id (uuid, FK para client_lots)
- asaas_payment_id (text)
- due_date (date)
- amount (decimal)
- status (enum: 'pending', 'paid', 'overdue', 'cancelled')
- installment_number (integer)
- barcode (text)
- payment_url (text)
- paid_at (timestamp, nullable)
- created_at, updated_at (timestamp)
```

#### service_types
```sql
- id (uuid, PK)
- name (text)
- description (text)
- base_price (decimal)
- is_active (boolean)
- created_at (timestamp)
```

#### service_orders
```sql
- id (uuid, PK)
- client_id (uuid, FK para clients)
- lot_id (uuid, FK para lots, nullable)
- service_type_id (uuid, FK para service_types)
- requested_date (date)
- execution_date (date, nullable)
- status (enum: 'requested', 'approved', 'in_progress', 'completed', 'cancelled')
- cost (decimal)
- revenue (decimal, nullable)
- notes (text)
- created_at, updated_at (timestamp)
```

#### referrals
```sql
- id (uuid, PK)
- referrer_client_id (uuid, FK para clients)
- referred_name (text)
- referred_phone (text)
- referred_email (text, nullable)
- status (enum: 'pending', 'contacted', 'converted', 'lost')
- created_at (timestamp)
```

#### notifications
```sql
- id (uuid, PK)
- user_id (uuid, FK para profiles)
- type (enum: 'payment_overdue', 'service_update', 'general')
- title (text)
- message (text)
- is_read (boolean)
- created_at (timestamp)
```

---

## 🔄 Relacionamentos

```
auth.users (Supabase)
    ↓ 1:1
profiles
    ↓ 1:1
clients
    ↓ 1:N
client_lots ← lots ← developments
    ↓ 1:N
invoices

clients
    ↓ 1:N
service_orders → service_types
    ↓ N:1
lots

clients
    ↓ 1:N
referrals
```

---

## 📊 Enums (Status)

### UserRole
- `admin`
- `client`

### ClientStatus
- `active`
- `inactive`
- `defaulter`

### LotStatus
- `available`
- `reserved`
- `sold`

### ClientLotStatus
- `active`
- `completed`
- `cancelled`

### InvoiceStatus
- `pending`
- `paid`
- `overdue`
- `cancelled`

### ServiceOrderStatus
- `requested`
- `approved`
- `in_progress`
- `completed`
- `cancelled`

### ReferralStatus
- `pending`
- `contacted`
- `converted`
- `lost`

### NotificationType
- `payment_overdue`
- `service_update`
- `general`

---

## 🚨 Tratamento de Erros

### Códigos HTTP

| Código | Significado | Quando Ocorre |
|--------|-------------|---------------|
| 200 | OK | Sucesso |
| 201 | Created | Recurso criado |
| 400 | Bad Request | Dados inválidos |
| 401 | Unauthorized | Token inválido/expirado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 422 | Unprocessable Entity | Validação falhou |
| 500 | Internal Server Error | Erro no servidor |

### Formato de Erro

```json
{
  "detail": "Mensagem de erro descritiva"
}
```

### Erros Comuns

**401 - Token Inválido**:
```json
{
  "detail": "Invalid or expired token"
}
```

**403 - Sem Permissão**:
```json
{
  "detail": "Admin access required"
}
```

**404 - Não Encontrado**:
```json
{
  "detail": "Client not found"
}
```

**422 - Validação**:
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

## 🔐 Segurança e RLS

### Row Level Security (RLS)

Todas as tabelas possuem RLS ativo:

- **Admin**: Acesso total a todos os dados
- **Cliente**: Acesso apenas aos próprios dados

### Isolamento de Dados

O backend garante que:
- Clientes só veem seus próprios lotes, boletos e serviços
- Clientes não podem acessar dados de outros clientes
- Admin pode ver e gerenciar tudo

### Validações

- CPF/CNPJ são validados
- Emails são validados
- Telefones seguem formato brasileiro
- Valores monetários são sempre positivos
- Datas são validadas

---

## 📱 Exemplos de Integração

### React/Next.js

```typescript
// api/client.ts
const API_BASE_URL = 'http://localhost:8000/api/v1';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  return data;
}

export async function getDashboard() {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE_URL}/client/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expirado, redirecionar para login
      window.location.href = '/login';
    }
    throw new Error('Failed to fetch dashboard');
  }
  
  return response.json();
}
```

### Axios Interceptor

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1'
});

// Adicionar token automaticamente
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tratar erros 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🧪 Testando a API

### Via Swagger UI
Acesse: http://localhost:8000/docs

1. Faça login via `/auth/login`
2. Copie o `access_token`
3. Clique em "Authorize" no topo
4. Cole o token
5. Teste os endpoints

### Via cURL

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","password":"senha123"}'

# Dashboard (substitua o token)
curl http://localhost:8000/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer eyJ..."
```

---

## 📞 Suporte

Para dúvidas sobre a API:
1. Consulte a documentação Swagger: http://localhost:8000/docs
2. Verifique os logs do servidor
3. Revise este documento

## 🎯 Checklist de Integração

- [ ] Implementar sistema de autenticação (login/logout)
- [ ] Armazenar token de forma segura
- [ ] Implementar refresh de token
- [ ] Criar interceptor para adicionar token automaticamente
- [ ] Tratar erros 401 (redirecionar para login)
- [ ] Tratar erros 403 (mostrar mensagem de permissão)
- [ ] Implementar loading states
- [ ] Validar dados antes de enviar
- [ ] Formatar valores monetários (R$)
- [ ] Formatar datas (pt-BR)
- [ ] Implementar paginação
- [ ] Adicionar filtros e busca
- [ ] Testar com diferentes roles (admin/client)
