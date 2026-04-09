# Backend Fix: Tratamento de CPF/CNPJ Duplicado

## Problema
O endpoint `POST /admin/clients` está retornando erro 500 (IntegrityError) quando tenta cadastrar um cliente com CPF/CNPJ já existente. Deveria retornar 409 Conflict.

## Logs do Erro Atual
```
sqlalchemy.exc.IntegrityError: (sqlalchemy.dialects.postgresql.asyncpg.IntegrityError) 
<class 'asyncpg.exceptions.UniqueViolationError'>: 
duplicate key value violates unique constraint "ix_profiles_cpf_cnpj"
DETAIL:  Key (cpf_cnpj)=(14835515714) already exists.
```

## Solução

### Arquivo: `/app/app/services/client_service.py`

Na função `create_client` (linha ~93), capturar a exceção de integridade e converter para erro 409:

```python
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

async def create_client(self, db: AsyncSession, company_id: UUID, admin_id: UUID, data: ClientCreate) -> Profile:
    try:
        # ... código existente de criação do cliente ...
        
        await db.flush()
        return client
        
    except IntegrityError as e:
        await db.rollback()
        error_msg = str(e.orig)
        
        # Detecta qual campo causou a violação
        if "cpf_cnpj" in error_msg or "ix_profiles_cpf_cnpj" in error_msg:
            raise HTTPException(
                status_code=409,
                detail="CPF/CNPJ já cadastrado. Verifique se o cliente já existe."
            )
        elif "email" in error_msg or "ix_profiles_email" in error_msg:
            raise HTTPException(
                status_code=409,
                detail="E-mail já cadastrado. Verifique se o cliente já existe."
            )
        else:
            raise HTTPException(
                status_code=409,
                detail="Dado duplicado. Verifique se o cliente já existe."
            )
```

### Arquivo: `/app/app/api/v1/admin/clients.py`

Garantir que o endpoint trate a exceção corretamente (ou delegue para o service):

```python
@router.post("/admin/clients", response_model=ClientResponse, status_code=201)
async def create_client(
    data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    admin: Profile = Depends(get_current_admin),
) -> ClientResponse:
    """Cria novo cliente para a empresa."""
    try:
        client = await client_service.create_client(db, admin.company_id, admin.id, data)
        return ClientResponse.model_validate(client)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erro ao criar cliente")
        raise HTTPException(status_code=500, detail="Erro interno ao criar cliente")
```

## Benefícios
- Frontend recebe 409 (não 500) → pode mostrar mensagem amigável
- Usuário entende que é duplicação, não erro do sistema
- Logs ficam limpos (sem stack trace de erro crítico para casos esperados)

## Teste
```bash
curl -X POST https://api.exemplo.com/admin/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@teste.com",
    "full_name": "Teste",
    "cpf_cnpj": "14835515714",
    "phone": "27988491255"
  }'

# Esperado: HTTP 409 com mensagem "CPF/CNPJ já cadastrado..."
```
