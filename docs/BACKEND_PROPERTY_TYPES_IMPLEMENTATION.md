# Backend Implementation Guide - Property Types System

## Overview

This document provides complete instructions for implementing the new property types system in the backend. The frontend has been updated to support multiple property types (Lot, House, Apartment, Commercial, Rural) with specific fields for each type.

## Database Changes

### 1. Table Migration

Add the following columns to the `developments` table:

```sql
-- New property type column (required)
ALTER TABLE developments ADD COLUMN property_type VARCHAR(20) NOT NULL DEFAULT 'LOT';

-- Lot-specific fields
ALTER TABLE developments ADD COLUMN block VARCHAR(50);
ALTER TABLE developments ADD COLUMN lot_number VARCHAR(50);
ALTER TABLE developments ADD COLUMN area_m2 DECIMAL(10,2);

-- Residential fields (House/Apartment)
ALTER TABLE developments ADD COLUMN bedrooms INTEGER;
ALTER TABLE developments ADD COLUMN bathrooms INTEGER;
ALTER TABLE developments ADD COLUMN suites INTEGER;
ALTER TABLE developments ADD COLUMN parking_spaces INTEGER;
ALTER TABLE developments ADD COLUMN construction_area_m2 DECIMAL(10,2);
ALTER TABLE developments ADD COLUMN total_area_m2 DECIMAL(10,2);

-- General field
ALTER TABLE developments ADD COLUMN price DECIMAL(15,2);

-- Migrate existing data to lots
UPDATE developments SET property_type = 'LOT' WHERE property_type IS NULL;
```

### 2. Create Property Type Enum

```sql
-- Optional: Create enum for better data integrity
CREATE TYPE property_type_enum AS ENUM ('LOT', 'HOUSE', 'APARTMENT', 'COMMERCIAL', 'RURAL');
-- Then alter the column to use the enum
ALTER TABLE developments ALTER COLUMN property_type TYPE property_type_enum USING property_type::property_type_enum;
```

## Backend Models

### 1. Python/SQLAlchemy Models

```python
# models/enums.py
from enum import Enum

class PropertyType(str, Enum):
    LOT = "LOT"
    HOUSE = "HOUSE"
    APARTMENT = "APARTMENT"
    COMMERCIAL = "COMMERCIAL"
    RURAL = "RURAL"

# models/development.py
from sqlalchemy import Column, String, Text, Integer, Numeric, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base
from .enums import PropertyType
import uuid
from datetime import datetime

class Development(Base):
    __tablename__ = "developments"
    
    # Primary keys
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Basic fields
    name = Column(String(255), nullable=False)
    description = Column(Text)
    location = Column(String(500))
    
    # Property type (required)
    property_type = Column(String(20), nullable=False, default=PropertyType.LOT)
    
    # Lot-specific fields
    block = Column(String(50))
    lot_number = Column(String(50))
    area_m2 = Column(Numeric(10, 2))
    
    # Residential-specific fields
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    suites = Column(Integer)
    parking_spaces = Column(Integer)
    construction_area_m2 = Column(Numeric(10, 2))
    total_area_m2 = Column(Numeric(10, 2))
    
    # General fields
    price = Column(Numeric(15, 2))
    documents = Column(JSON)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="developments")
    lots = relationship("Lot", back_populates="development")
```

### 2. Pydantic Schemas

```python
# schemas/development.py
from pydantic import BaseModel, Field
from typing import Optional
from .enums import PropertyType

class DevelopmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = None
    property_type: PropertyType = PropertyType.LOT
    
    # Lot-specific fields
    block: Optional[str] = Field(None, max_length=50)
    lot_number: Optional[str] = Field(None, max_length=50)
    area_m2: Optional[float] = Field(None, gt=0)
    
    # Residential-specific fields
    bedrooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    suites: Optional[int] = Field(None, ge=0)
    parking_spaces: Optional[int] = Field(None, ge=0)
    construction_area_m2: Optional[float] = Field(None, gt=0)
    total_area_m2: Optional[float] = Field(None, gt=0)
    
    # General fields
    price: Optional[float] = Field(None, gt=0)
    documents: Optional[dict] = None

class DevelopmentCreate(DevelopmentBase):
    pass

class DevelopmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = None
    property_type: Optional[PropertyType] = None
    
    block: Optional[str] = Field(None, max_length=50)
    lot_number: Optional[str] = Field(None, max_length=50)
    area_m2: Optional[float] = Field(None, gt=0)
    
    bedrooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    suites: Optional[int] = Field(None, ge=0)
    parking_spaces: Optional[int] = Field(None, ge=0)
    construction_area_m2: Optional[float] = Field(None, gt=0)
    total_area_m2: Optional[float] = Field(None, gt=0)
    
    price: Optional[float] = Field(None, gt=0)
    documents: Optional[dict] = None

class DevelopmentResponse(DevelopmentBase):
    id: str
    company_id: str
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Add filtering support
class DevelopmentFilter(BaseModel):
    property_type: Optional[PropertyType] = None
    name: Optional[str] = None
    location: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
```

## Validation Logic

### 1. Custom Validators

```python
# services/validation.py
from typing import Dict, Any
from .enums import PropertyType
from schemas.development import DevelopmentCreate, DevelopmentUpdate

def validate_development_data(data: Dict[str, Any], is_update: bool = False) -> Dict[str, Any]:
    """Validate development data based on property type"""
    property_type = data.get('property_type', PropertyType.LOT)
    errors = []
    
    # Lot-specific validations
    if property_type == PropertyType.LOT:
        if not data.get('lot_number'):
            errors.append("Número do lote é obrigatório para lotes")
        if not data.get('area_m2'):
            errors.append("Área é obrigatória para lotes")
    
    # Residential validations (House/Apartment)
    elif property_type in [PropertyType.HOUSE, PropertyType.APARTMENT]:
        if not data.get('bedrooms'):
            errors.append("Número de quartos é obrigatório")
        if not data.get('bathrooms'):
            errors.append("Número de banheiros é obrigatório")
        if not data.get('construction_area_m2'):
            errors.append("Área construída é obrigatória")
    
    # Commercial validations
    elif property_type == PropertyType.COMMERCIAL:
        if not data.get('construction_area_m2'):
            errors.append("Área construída é obrigatória para imóveis comerciais")
    
    # Rural validations
    elif property_type == PropertyType.RURAL:
        if not data.get('area_m2'):
            errors.append("Área total é obrigatória para imóveis rurais")
    
    if errors:
        raise ValueError("; ".join(errors))
    
    return data

def sanitize_development_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Clean and sanitize development data"""
    # Remove empty strings and convert to None
    sanitized = {}
    for key, value in data.items():
        if value == "" or value is None:
            sanitized[key] = None
        else:
            sanitized[key] = value
    
    return sanitized
```

## API Endpoints

### 1. Update Existing Endpoints

```python
# routes/developments.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from schemas.development import DevelopmentCreate, DevelopmentUpdate, DevelopmentResponse, DevelopmentFilter
from services.development import DevelopmentService
from services.validation import validate_development_data, sanitize_development_data
from dependencies import get_db, get_current_user

router = APIRouter(prefix="/admin/developments", tags=["developments"])

@router.post("/", response_model=DevelopmentResponse)
async def create_development(
    development: DevelopmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Validate and sanitize data
        data = development.dict()
        validate_development_data(data)
        sanitized_data = sanitize_development_data(data)
        
        # Create development
        service = DevelopmentService(db)
        return service.create(sanitized_data, current_user.company_id)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao criar imóvel")

@router.get("/", response_model=List[DevelopmentResponse])
async def list_developments(
    property_type: Optional[PropertyType] = Query(None, description="Filter by property type"),
    name: Optional[str] = Query(None, description="Filter by name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = DevelopmentService(db)
    filter_params = DevelopmentFilter(
        property_type=property_type,
        name=name
    )
    return service.list(current_user.company_id, filter_params, skip, limit)

@router.get("/{development_id}", response_model=DevelopmentResponse)
async def get_development(
    development_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = DevelopmentService(db)
    development = service.get_by_id(development_id, current_user.company_id)
    if not development:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return development

@router.put("/{development_id}", response_model=DevelopmentResponse)
async def update_development(
    development_id: str,
    development_update: DevelopmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Validate and sanitize data
        data = development_update.dict(exclude_unset=True)
        if data:
            validate_development_data(data, is_update=True)
            sanitized_data = sanitize_development_data(data)
        else:
            sanitized_data = {}
        
        service = DevelopmentService(db)
        return service.update(development_id, sanitized_data, current_user.company_id)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao atualizar imóvel")

@router.delete("/{development_id}")
async def delete_development(
    development_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = DevelopmentService(db)
    success = service.delete(development_id, current_user.company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return {"message": "Imóvel excluído com sucesso"}
```

### 2. Service Layer

```python
# services/development.py
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from models.development import Development
from schemas.development import DevelopmentCreate, DevelopmentUpdate, DevelopmentFilter
from typing import List, Optional, Dict, Any

class DevelopmentService:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, data: Dict[str, Any], company_id: str) -> Development:
        development = Development(
            company_id=company_id,
            **data
        )
        self.db.add(development)
        self.db.commit()
        self.db.refresh(development)
        return development
    
    def get_by_id(self, development_id: str, company_id: str) -> Optional[Development]:
        return self.db.query(Development).filter(
            and_(
                Development.id == development_id,
                Development.company_id == company_id
            )
        ).first()
    
    def list(
        self, 
        company_id: str, 
        filters: DevelopmentFilter,
        skip: int = 0,
        limit: int = 100
    ) -> List[Development]:
        query = self.db.query(Development).filter(Development.company_id == company_id)
        
        # Apply filters
        if filters.property_type:
            query = query.filter(Development.property_type == filters.property_type)
        
        if filters.name:
            query = query.filter(Development.name.ilike(f"%{filters.name}%"))
        
        if filters.location:
            query = query.filter(Development.location.ilike(f"%{filters.location}%"))
        
        if filters.min_price:
            query = query.filter(Development.price >= filters.min_price)
        
        if filters.max_price:
            query = query.filter(Development.price <= filters.max_price)
        
        return query.offset(skip).limit(limit).all()
    
    def update(self, development_id: str, data: Dict[str, Any], company_id: str) -> Development:
        development = self.get_by_id(development_id, company_id)
        if not development:
            raise ValueError("Imóvel não encontrado")
        
        for key, value in data.items():
            setattr(development, key, value)
        
        self.db.commit()
        self.db.refresh(development)
        return development
    
    def delete(self, development_id: str, company_id: str) -> bool:
        development = self.get_by_id(development_id, company_id)
        if not development:
            return False
        
        self.db.delete(development)
        self.db.commit()
        return True
    
    def get_property_type_stats(self, company_id: str) -> Dict[str, int]:
        """Get statistics by property type"""
        from sqlalchemy import func
        
        result = self.db.query(
            Development.property_type,
            func.count(Development.id)
        ).filter(
            Development.company_id == company_id
        ).group_by(Development.property_type).all()
        
        return {prop_type: count for prop_type, count in result}
```

## Data Migration

### 1. Migrate Existing Lots (Optional)

```python
# scripts/migrate_lots.py
from sqlalchemy.orm import Session
from models.development import Development
from models.lot import Lot
from services.development import DevelopmentService

def migrate_legacy_lots(db: Session):
    """Migrate existing lots to developments table"""
    service = DevelopmentService(db)
    
    # Get all lots
    lots = db.query(Lot).all()
    
    for lot in lots:
        # Check if already migrated
        existing = db.query(Development).filter(
            and_(
                Development.lot_number == lot.lot_number,
                Development.block == lot.block,
                Development.company_id == lot.company_id
            )
        ).first()
        
        if not existing:
            # Create development from lot
            development_data = {
                "name": f"Lote {lot.lot_number} - Quadra {lot.block or 'N/A'}",
                "property_type": "LOT",
                "lot_number": lot.lot_number,
                "block": lot.block,
                "area_m2": float(lot.area_m2),
                "price": float(lot.price),
                "description": f"Lote migrado do sistema anterior"
            }
            
            service.create(development_data, lot.company_id)
            print(f"Migrated lot {lot.lot_number} to development")
    
    print("Migration completed")

# Run migration
if __name__ == "__main__":
    from database import SessionLocal
    db = SessionLocal()
    try:
        migrate_legacy_lots(db)
    finally:
        db.close()
```

## Testing

### 1. Unit Tests

```python
# tests/test_development.py
import pytest
from services.validation import validate_development_data
from schemas.enums import PropertyType

def test_validate_lot_data():
    data = {
        "property_type": PropertyType.LOT,
        "lot_number": "01",
        "area_m2": 360.0,
        "block": "A"
    }
    result = validate_development_data(data)
    assert result["property_type"] == PropertyType.LOT

def test_validate_lot_missing_fields():
    data = {
        "property_type": PropertyType.LOT,
        "name": "Test"
    }
    with pytest.raises(ValueError) as exc_info:
        validate_development_data(data)
    assert "Número do lote é obrigatório" in str(exc_info.value)

def test_validate_house_data():
    data = {
        "property_type": PropertyType.HOUSE,
        "bedrooms": 3,
        "bathrooms": 2,
        "construction_area_m2": 120.0
    }
    result = validate_development_data(data)
    assert result["property_type"] == PropertyType.HOUSE
```

## Deployment Checklist

### 1. Database Migration
- [ ] Run SQL migration script
- [ ] Verify data integrity
- [ ] Test rollback procedures

### 2. Backend Deployment
- [ ] Update models and schemas
- [ ] Deploy new API endpoints
- [ ] Run integration tests
- [ ] Monitor for errors

### 3. Frontend Compatibility
- [ ] Test frontend with new backend
- [ ] Verify all property types work
- [ ] Test form validations
- [ ] Check data display

### 4. Post-Deployment
- [ ] Monitor API performance
- [ ] Check error logs
- [ ] Validate data consistency
- [ ] Document any issues

## API Response Format

### Development Response Example

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "company_id": "company-uuid",
  "name": "Lote 01 - Residencial Parque",
  "description": "Lote com excelente localização",
  "location": "Rua das Flores, 123",
  "property_type": "LOT",
  "block": "A",
  "lot_number": "01",
  "area_m2": 360.0,
  "bedrooms": null,
  "bathrooms": null,
  "suites": null,
  "parking_spaces": null,
  "construction_area_m2": null,
  "total_area_m2": null,
  "price": 150000.0,
  "documents": null,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

## Error Handling

### Common Error Responses

```json
{
  "detail": "Número do lote é obrigatório para lotes; Área é obrigatória para lotes"
}
```

```json
{
  "detail": "Imóvel não encontrado"
}
```

```json
{
  "detail": "Erro ao criar imóvel"
}
```

This implementation provides full backward compatibility while adding the new property types functionality. The frontend is already prepared to work with these changes.
