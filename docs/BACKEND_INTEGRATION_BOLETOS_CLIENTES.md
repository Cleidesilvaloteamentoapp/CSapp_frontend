# Integração Boletos + Clientes - Instruções Backend

## 🎯 Objetivo

Armazenar boletos Sicredi no banco de dados local com vínculo obrigatório aos clientes, permitindo histórico e rastreabilidade.

## 📐 Mudanças no Banco de Dados

### Nova Tabela: `sicredi_boletos`

```sql
CREATE TABLE sicredi_boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  nosso_numero VARCHAR(20) NOT NULL,
  linha_digitavel VARCHAR(47) NOT NULL,
  codigo_barras VARCHAR(44) NOT NULL,
  txid VARCHAR(35),
  qr_code TEXT,
  tipo_cobranca VARCHAR(10) NOT NULL CHECK (tipo_cobranca IN ('NORMAL', 'HIBRIDO')),
  valor DECIMAL(15,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  situacao VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  seu_numero VARCHAR(50),
  pagador_nome VARCHAR(255) NOT NULL,
  pagador_documento VARCHAR(20) NOT NULL,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE UNIQUE INDEX idx_boletos_nosso_numero ON sicredi_boletos(company_id, nosso_numero);
CREATE INDEX idx_boletos_client_id ON sicredi_boletos(client_id);
CREATE INDEX idx_boletos_seu_numero ON sicredi_boletos(company_id, seu_numero);
CREATE INDEX idx_boletos_vencimento ON sicredi_boletos(data_vencimento);
CREATE INDEX idx_boletos_situacao ON sicredi_boletos(situacao);

-- Trigger para updated_at
CREATE TRIGGER update_sicredi_boletos_updated_at
  BEFORE UPDATE ON sicredi_boletos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 🔒 Row Level Security (OBRIGATÓRIO)

```sql
-- Habilitar RLS
ALTER TABLE sicredi_boletos ENABLE ROW LEVEL SECURITY;

-- Política: usuários só acessam boletos da própria company
CREATE POLICY "users_own_company_boletos" ON sicredi_boletos
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Política adicional para admin
CREATE POLICY "admin_full_access" ON sicredi_boletos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND company_id = sicredi_boletos.company_id
    )
  );
```

## 🔄 Modificações nos Endpoints

### 1. `POST /api/v1/admin/sicredi/boletos`

**Mudanças no Request:**

```python
class CreateBoletoRequest(BaseModel):
    client_id: UUID  # NOVO - Obrigatório
    tipo_cobranca: TipoCobranca
    pagador: Pagador
    especie_documento: EspecieDocumento
    data_vencimento: str
    valor: float
    seu_numero: str
    tipo_desconto: Optional[TipoDesconto] = None
    valor_desconto_1: Optional[float] = None
    data_desconto_1: Optional[str] = None
    tipo_juros: Optional[TipoJuros] = None
    juros: Optional[float] = None
    tipo_multa: Optional[TipoMulta] = None
    multa: Optional[float] = None
    informativos: Optional[List[str]] = None
    mensagens: Optional[List[str]] = None
```

**Lógica de Processamento:**

```python
@router.post("/admin/sicredi/boletos", response_model=BoletoCreated)
async def create_boleto(
    data: CreateBoletoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    # 1. Validar que client_id existe e pertence à mesma company
    client = db.query(Client).filter(
        Client.id == data.client_id,
        Client.company_id == current_user.company_id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado ou não pertence a esta empresa"
        )
    
    # 2. Criar boleto na API Sicredi (código existente)
    sicredi_response = await sicredi_service.create_boleto(
        company_id=current_user.company_id,
        data=data
    )
    
    # 3. NOVO: Persistir no banco de dados local
    boleto_record = SicrediBoleto(
        company_id=current_user.company_id,
        client_id=data.client_id,
        nosso_numero=sicredi_response.nosso_numero,
        linha_digitavel=sicredi_response.linha_digitavel,
        codigo_barras=sicredi_response.codigo_barras,
        txid=sicredi_response.txid,
        qr_code=sicredi_response.qr_code,
        tipo_cobranca=data.tipo_cobranca,
        valor=data.valor,
        data_vencimento=datetime.strptime(data.data_vencimento, "%Y-%m-%d").date(),
        situacao="NORMAL",
        seu_numero=data.seu_numero,
        pagador_nome=data.pagador.nome,
        pagador_documento=data.pagador.documento,
        raw_response=sicredi_response.dict()
    )
    
    db.add(boleto_record)
    db.commit()
    db.refresh(boleto_record)
    
    # 4. Retornar resposta padrão (BoletoCreated)
    return sicredi_response
```

### 2. `GET /api/v1/admin/clients/{client_id}/boletos` (NOVO)

**Endpoint para listar boletos de um cliente específico:**

```python
class BoletoStoredResponse(BaseModel):
    id: UUID
    company_id: UUID
    client_id: UUID
    nosso_numero: str
    linha_digitavel: str
    codigo_barras: str
    txid: Optional[str]
    qr_code: Optional[str]
    tipo_cobranca: str
    valor: float
    data_vencimento: str
    situacao: str
    seu_numero: str
    pagador_nome: str
    pagador_documento: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


@router.get("/admin/clients/{client_id}/boletos", response_model=List[BoletoStoredResponse])
async def get_client_boletos(
    client_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    # Validar que cliente existe e pertence à company
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.company_id == current_user.company_id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Buscar boletos do cliente
    boletos = db.query(SicrediBoleto).filter(
        SicrediBoleto.client_id == client_id,
        SicrediBoleto.company_id == current_user.company_id
    ).order_by(SicrediBoleto.created_at.desc()).all()
    
    return boletos
```

### 3. `GET /api/v1/admin/sicredi/boletos` (MODIFICAR/CRIAR)

**Endpoint para listar todos os boletos com filtros:**

```python
@router.get("/admin/sicredi/boletos", response_model=List[BoletoStoredResponse])
async def list_boletos(
    client_id: Optional[UUID] = None,
    situacao: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    query = db.query(SicrediBoleto).filter(
        SicrediBoleto.company_id == current_user.company_id
    )
    
    if client_id:
        query = query.filter(SicrediBoleto.client_id == client_id)
    
    if situacao:
        query = query.filter(SicrediBoleto.situacao == situacao)
    
    if data_inicio:
        query = query.filter(
            SicrediBoleto.data_vencimento >= datetime.strptime(data_inicio, "%Y-%m-%d").date()
        )
    
    if data_fim:
        query = query.filter(
            SicrediBoleto.data_vencimento <= datetime.strptime(data_fim, "%Y-%m-%d").date()
        )
    
    boletos = query.order_by(SicrediBoleto.created_at.desc()).all()
    return boletos
```

## 📊 Modelo SQLAlchemy

```python
from sqlalchemy import Column, String, UUID, DECIMAL, Date, DateTime, Text, CheckConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database import Base

class SicrediBoleto(Base):
    __tablename__ = "sicredi_boletos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    nosso_numero = Column(String(20), nullable=False)
    linha_digitavel = Column(String(47), nullable=False)
    codigo_barras = Column(String(44), nullable=False)
    txid = Column(String(35), nullable=True)
    qr_code = Column(Text, nullable=True)
    tipo_cobranca = Column(String(10), nullable=False)
    valor = Column(DECIMAL(15, 2), nullable=False)
    data_vencimento = Column(Date, nullable=False)
    situacao = Column(String(20), nullable=False, default="NORMAL")
    seu_numero = Column(String(50), nullable=True)
    pagador_nome = Column(String(255), nullable=False)
    pagador_documento = Column(String(20), nullable=False)
    raw_response = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint(
            "tipo_cobranca IN ('NORMAL', 'HIBRIDO')",
            name="check_tipo_cobranca"
        ),
    )
```

## ✅ Checklist de Implementação Backend

### Banco de Dados
- [ ] Criar migração para tabela `sicredi_boletos`
- [ ] Adicionar índices especificados
- [ ] Habilitar RLS na tabela
- [ ] Criar políticas de segurança
- [ ] Testar isolamento multi-tenancy

### Código
- [ ] Atualizar modelo `CreateBoletoRequest` com `client_id`
- [ ] Criar modelo `SicrediBoleto` (SQLAlchemy/ORM)
- [ ] Criar schema `BoletoStoredResponse` (Pydantic)
- [ ] Modificar endpoint `POST /admin/sicredi/boletos`:
  - [ ] Validar `client_id`
  - [ ] Persistir boleto após criação na API Sicredi
  - [ ] Tratar erros (rollback se Sicredi falhar)
- [ ] Criar endpoint `GET /admin/clients/{client_id}/boletos`
- [ ] Criar/modificar endpoint `GET /admin/sicredi/boletos` com filtros
- [ ] Adicionar validação: `client_id` pertence à mesma `company_id`

### Testes
- [ ] Teste unitário: criação de boleto com vínculo
- [ ] Teste de integração: fluxo completo (criar cliente → criar boleto)
- [ ] Teste RLS: usuário não acessa boletos de outra company
- [ ] Teste: listar boletos do cliente
- [ ] Teste: filtros na listagem de boletos
- [ ] Teste: erro ao passar `client_id` inválido

### Documentação
- [ ] Atualizar documentação da API
- [ ] Adicionar exemplos de request/response
- [ ] Documentar novos endpoints

## 🔒 Considerações de Segurança

1. **Validação de client_id**: SEMPRE validar que o `client_id` pertence à mesma `company_id` do usuário autenticado
2. **RLS Obrigatório**: Tabela DEVE ter Row Level Security ativo
3. **Isolamento**: Garantir que boletos sejam isolados por `company_id`
4. **Auditoria**: O campo `created_at` registra quando o boleto foi criado
5. **Integridade Referencial**: `ON DELETE RESTRICT` em `client_id` para não perder dados

## 🚀 Exemplo de Fluxo Completo

```python
# 1. Frontend envia
POST /api/v1/admin/sicredi/boletos
{
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "tipo_cobranca": "NORMAL",
  "pagador": {
    "tipo_pessoa": "PESSOA_FISICA",
    "documento": "12345678900",
    "nome": "João Silva",
    "endereco": "Rua Teste, 123",
    "cidade": "Porto Alegre",
    "uf": "RS",
    "cep": "90000000",
    "email": "joao@example.com",
    "telefone": "51999999999"
  },
  "especie_documento": "DUPLICATA_MERCANTIL_INDICACAO",
  "data_vencimento": "2025-12-31",
  "valor": 1500.00,
  "seu_numero": "CTRL-001"
}

# 2. Backend:
# - Valida client_id existe
# - Chama API Sicredi
# - Recebe resposta da Sicredi
# - Salva no banco:
INSERT INTO sicredi_boletos (
  company_id, client_id, nosso_numero, linha_digitavel, 
  codigo_barras, tipo_cobranca, valor, data_vencimento,
  situacao, seu_numero, pagador_nome, pagador_documento,
  raw_response
) VALUES (...)

# 3. Retorna para frontend
{
  "linha_digitavel": "34191.23456...",
  "codigo_barras": "3419...",
  "nosso_numero": "22000000001",
  "txid": null,
  "qr_code": null
}

# 4. Frontend pode consultar boletos do cliente
GET /api/v1/admin/clients/550e8400-e29b-41d4-a716-446655440000/boletos

# 5. Backend retorna lista
[
  {
    "id": "...",
    "nosso_numero": "22000000001",
    "valor": 1500.00,
    "data_vencimento": "2025-12-31",
    "situacao": "NORMAL",
    "linha_digitavel": "34191.23456...",
    ...
  }
]
```

## 📝 Notas Importantes

1. **Transaction Safety**: Se a criação na API Sicredi falhar, NÃO salvar no banco local
2. **Sincronização**: Considerar implementar webhook do Sicredi para atualizar `situacao` automaticamente (LIQUIDADO, CANCELADO, etc)
3. **Performance**: Índices foram criados nos campos mais consultados (client_id, nosso_numero, seu_numero, vencimento)
4. **Armazenamento Completo**: `raw_response` guarda a resposta completa da API Sicredi para auditoria

## 🔄 Próximas Melhorias (Opcional)

- Webhook Sicredi para atualizar status automaticamente
- Endpoint para cancelar boleto (atualizar situacao)
- Relatório de boletos por período
- Dashboard com métricas de boletos
