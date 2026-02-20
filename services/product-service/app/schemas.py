# ============================================================
# Product Service — Pydantic Schemas
# ============================================================

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# ── Category Schemas ───────────────────────────────────────

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: UUID
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Product Schemas ────────────────────────────────────────

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    sku: str = Field(..., min_length=1, max_length=50)
    price: float = Field(..., ge=0)
    compare_at_price: Optional[float] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=10, ge=0)
    is_active: bool = True
    is_featured: bool = False
    weight: Optional[float] = None
    image_url: Optional[str] = None
    tags: Optional[str] = None
    category_id: Optional[UUID] = None

    @field_validator("price")
    @classmethod
    def validate_price(cls, v):
        if v < 0:
            raise ValueError("Price must be non-negative")
        return round(v, 2)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    compare_at_price: Optional[float] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    weight: Optional[float] = None
    image_url: Optional[str] = None
    tags: Optional[str] = None
    category_id: Optional[UUID] = None


class ProductResponse(ProductBase):
    id: UUID
    slug: str
    category: Optional[CategoryResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Pagination ─────────────────────────────────────────────

class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    pages: int


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    pagination: PaginationMeta


class CategoryListResponse(BaseModel):
    categories: List[CategoryResponse]
    pagination: PaginationMeta
