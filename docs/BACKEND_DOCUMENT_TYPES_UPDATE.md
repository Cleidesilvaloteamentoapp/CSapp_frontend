# Backend Update - Novos Tipos de Documentos

## Resumo

O frontend foi atualizado para suportar novos tipos de documentos organizados por categoria. O backend precisa ser atualizado para aceitar e validar esses novos tipos.

## Novos Tipos de Documentos

### Documentos do Comprador
- `RG` - Registro Geral
- `CPF` - Cadastro de Pessoa Física  
- `COMPROVANTE_RESIDENCIA` - Comprovante de endereço
- `CNH` - Carteira de Habilitação
- `CERTIDAO_ESTADO_CIVIL` - Certidão de Casamento/Nascimento
- `COMPROVANTE_RENDA` - Holerite, IRPF, extratos

### Documentos do Imóvel
- `MATRICULA` - Matrícula do imóvel
- `GUIA_INFORMACAO` - Guia de Informação
- `IPTU` - Comprovante de IPTU
- `FOTOS_IMOVEL` - Fotos do imóvel

### Outros
- `CONTRATO` - Contrato assinado
- `OUTROS` - Outros documentos

---

## Mudanças Necessárias no Backend

### 1. Atualizar Enum/Validação de DocumentType

**Python (Pydantic/FastAPI):**

```python
# schemas/enums.py ou models/enums.py
from enum import Enum

class DocumentType(str, Enum):
    # Documentos do Comprador
    RG = "RG"
    CPF = "CPF"
    COMPROVANTE_RESIDENCIA = "COMPROVANTE_RESIDENCIA"
    CNH = "CNH"
    CERTIDAO_ESTADO_CIVIL = "CERTIDAO_ESTADO_CIVIL"
    COMPROVANTE_RENDA = "COMPROVANTE_RENDA"
    
    # Documentos do Imóvel
    MATRICULA = "MATRICULA"
    GUIA_INFORMACAO = "GUIA_INFORMACAO"
    IPTU = "IPTU"
    FOTOS_IMOVEL = "FOTOS_IMOVEL"
    
    # Outros
    CONTRATO = "CONTRATO"
    OUTROS = "OUTROS"

class DocumentCategory(str, Enum):
    COMPRADOR = "COMPRADOR"
    IMOVEL = "IMOVEL"
    OUTROS = "OUTROS"

# Mapeamento de tipo para categoria
DOCUMENT_TYPE_CATEGORIES = {
    # Comprador
    DocumentType.RG: DocumentCategory.COMPRADOR,
    DocumentType.CPF: DocumentCategory.COMPRADOR,
    DocumentType.COMPROVANTE_RESIDENCIA: DocumentCategory.COMPRADOR,
    DocumentType.CNH: DocumentCategory.COMPRADOR,
    DocumentType.CERTIDAO_ESTADO_CIVIL: DocumentCategory.COMPRADOR,
    DocumentType.COMPROVANTE_RENDA: DocumentCategory.COMPRADOR,
    # Imóvel
    DocumentType.MATRICULA: DocumentCategory.IMOVEL,
    DocumentType.GUIA_INFORMACAO: DocumentCategory.IMOVEL,
    DocumentType.IPTU: DocumentCategory.IMOVEL,
    DocumentType.FOTOS_IMOVEL: DocumentCategory.IMOVEL,
    # Outros
    DocumentType.CONTRATO: DocumentCategory.OUTROS,
    DocumentType.OUTROS: DocumentCategory.OUTROS,
}
```

### 2. Atualizar Schemas de Documento

```python
# schemas/document.py
from pydantic import BaseModel, Field
from typing import Optional
from .enums import DocumentType, DocumentCategory, DOCUMENT_TYPE_CATEGORIES

class ClientDocumentBase(BaseModel):
    document_type: DocumentType = Field(..., description="Tipo do documento")
    file_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)

class ClientDocumentCreate(ClientDocumentBase):
    pass

class ClientDocumentResponse(ClientDocumentBase):
    id: str
    client_id: str
    company_id: Optional[str] = None
    file_url: str
    file_size: int
    status: str = "PENDING_REVIEW"
    rejection_reason: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    created_at: str
    updated_at: str
    
    # Campo derivado
    @property
    def category(self) -> DocumentCategory:
        return DOCUMENT_TYPE_CATEGORIES.get(self.document_type, DocumentCategory.OUTROS)

class ClientDocumentUpdate(BaseModel):
    document_type: Optional[DocumentType] = None
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = None
    rejection_reason: Optional[str] = None
```

### 3. Atualizar Endpoint de Upload (Portal)

```python
# routes/portal/documents.py
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Optional
from schemas.enums import DocumentType
from schemas.document import ClientDocumentResponse
from services.document import DocumentService
from dependencies import get_db, require_client_role

router = APIRouter(prefix="/client", tags=["client-documents"])

@router.post("/documents/upload", response_model=ClientDocumentResponse, status_code=201)
async def upload_document(
    document_type: DocumentType = Form(...),  # Agora usa o Enum com novos tipos
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: User = Depends(require_client_role),
    db: Session = Depends(get_db)
):
    """Upload de documento pelo cliente"""
    
    # Validação de tipo de arquivo
    allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png'}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(400, "Tipo de arquivo não permitido. Use PDF, JPG ou PNG.")
    
    # Validação de tamanho (10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "Arquivo muito grande. Máximo 10MB.")
    
    # Upload para storage
    service = DocumentService(db)
    document = await service.create(
        client_id=current_user.client_id,
        company_id=current_user.company_id,
        document_type=document_type,
        file_name=file.filename,
        file_contents=contents,
        description=description
    )
    
    return document
```

### 4. Atualizar Endpoint de Upload (Admin)

```python
# routes/admin/clients.py
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Optional
from schemas.enums import DocumentType
from schemas.document import ClientDocumentResponse
from services.document import DocumentService
from dependencies import get_db, get_current_user, require_admin_role

router = APIRouter(prefix="/admin/clients", tags=["admin-clients"])

@router.post("/{client_id}/documents", response_model=ClientDocumentResponse, status_code=201)
async def admin_upload_document(
    client_id: str,
    document_type: DocumentType = Form(...),  # Atualizado com novos tipos
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Admin upload de documento para um cliente"""
    
    # Verificar se cliente existe e pertence à empresa
    client_service = ClientService(db)
    client = client_service.get_by_id(client_id, current_user.company_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")
    
    # Upload para storage
    contents = await file.read()
    
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "Arquivo muito grande. Máximo 10MB.")
    
    document_service = DocumentService(db)
    document = await document_service.create(
        client_id=client_id,
        company_id=current_user.company_id,
        document_type=document_type,
        file_name=file.filename,
        file_contents=contents,
        description=description
    )
    
    return document
```

### 5. Atualizar Listagem de Documentos (Retornar por Categoria)

```python
# routes/portal/documents.py

@router.get("/documents", response_model=ClientDocumentsByCategoryResponse)
async def list_documents(
    document_type: Optional[DocumentType] = None,
    doc_status: Optional[str] = None,
    current_user: User = Depends(require_client_role),
    db: Session = Depends(get_db)
):
    """Lista documentos do cliente organizados por categoria"""
    
    service = DocumentService(db)
    documents = service.list_by_client(
        client_id=current_user.client_id,
        document_type=document_type,
        status=doc_status
    )
    
    # Agrupar por categoria
    from schemas.enums import DOCUMENT_TYPE_CATEGORIES, DocumentCategory
    
    result = {
        "COMPRADOR": [],
        "IMOVEL": [],
        "OUTROS": []
    }
    
    for doc in documents:
        category = DOCUMENT_TYPE_CATEGORIES.get(doc.document_type, DocumentCategory.OUTROS)
        result[category.value].append(doc)
    
    return {
        "categories": result,
        "total": len(documents)
    }
```

### 6. Atualizar Documentação da API

Atualizar os seguintes arquivos/documentos:
- Swagger/OpenAPI docs
- Documentação do portal do cliente
- Documentação admin

**Exemplo de resposta atualizada:**

```json
{
  "id": "uuid",
  "client_id": "uuid",
  "company_id": "uuid",
  "document_type": "MATRICULA",
  "category": "IMOVEL",
  "file_name": "matricula_imovel.pdf",
  "file_url": "https://storage.../matricula_imovel.pdf",
  "file_size": 245678,
  "description": "Matrícula atualizada",
  "status": "PENDING_REVIEW",
  "created_at": "2024-01-01T10:00:00Z"
}
```

---

## Banco de Dados

**Nenhuma alteração na estrutura da tabela é necessária**, pois o campo `document_type` já é `VARCHAR(50)`.

Porém, se estiver usando CHECK constraints ou enums no banco, atualize:

```sql
-- PostgreSQL: Atualizar constraint (se existir)
ALTER TABLE client_documents DROP CONSTRAINT IF EXISTS chk_document_type;

-- Nova constraint com todos os tipos
ALTER TABLE client_documents 
ADD CONSTRAINT chk_document_type 
CHECK (document_type IN (
    -- Comprador
    'RG', 'CPF', 'COMPROVANTE_RESIDENCIA', 'CNH', 
    'CERTIDAO_ESTADO_CIVIL', 'COMPROVANTE_RENDA',
    -- Imóvel  
    'MATRICULA', 'GUIA_INFORMACAO', 'IPTU', 'FOTOS_IMOVEL',
    -- Outros
    'CONTRATO', 'OUTROS'
));
```

---

## Testes

### Testes Unitários

```python
# tests/test_document_types.py
import pytest
from schemas.enums import DocumentType, DocumentCategory, DOCUMENT_TYPE_CATEGORIES

def test_all_document_types_have_category():
    """Verifica que todos os tipos têm uma categoria"""
    for doc_type in DocumentType:
        assert doc_type in DOCUMENT_TYPE_CATEGORIES
        assert DOCUMENT_TYPE_CATEGORIES[doc_type] in DocumentCategory

def test_document_categories():
    """Verifica que as categorias estão corretas"""
    assert DOCUMENT_TYPE_CATEGORIES[DocumentType.RG] == DocumentCategory.COMPRADOR
    assert DOCUMENT_TYPE_CATEGORIES[DocumentType.CPF] == DocumentCategory.COMPRADOR
    assert DOCUMENT_TYPE_CATEGORIES[DocumentType.MATRICULA] == DocumentCategory.IMOVEL
    assert DOCUMENT_TYPE_CATEGORIES[DocumentType.FOTOS_IMOVEL] == DocumentCategory.IMOVEL
    assert DOCUMENT_TYPE_CATEGORIES[DocumentType.CONTRATO] == DocumentCategory.OUTROS

def test_invalid_document_type():
    """Testa validação de tipo inválido"""
    with pytest.raises(ValueError):
        DocumentType("TIPO_INVALIDO")
```

---

## Checklist de Deploy

- [ ] Atualizar enum DocumentType no backend
- [ ] Atualizar schemas Pydantic
- [ ] Atualizar endpoints de upload (portal + admin)
- [ ] Atualizar documentação OpenAPI/Swagger
- [ ] Testar upload com cada novo tipo de documento
- [ ] Verificar que documentos existentes continuam funcionando
- [ ] Atualizar constraint do banco (se necessário)
- [ ] Deploy em staging
- [ ] Testes de integração
- [ ] Deploy em produção

---

## Rollback (se necessário)

Se precisar reverter:

1. Reverter código para versão anterior
2. Documentos já salvos com novos tipos permanecerão no banco
3. Frontend já tem fallbacks para tipos desconhecidos

Não há necessidade de migração de dados pois os documentos existentes mantêm seus tipos.
