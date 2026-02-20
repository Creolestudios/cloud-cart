# ============================================================
# Product Service — Product Router
# ============================================================

import re
import math
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Product
from app.schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductListResponse, PaginationMeta,
)
from app.utils.logger import logger

router = APIRouter()


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


# ── List Products ──────────────────────────────────────────
@router.get("/", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[UUID] = None,
    is_active: Optional[bool] = True,
    is_featured: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(name|price|created_at|quantity)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    """List products with filtering, pagination, and sorting."""
    # Build query
    conditions = []
    if is_active is not None:
        conditions.append(Product.is_active == is_active)
    if is_featured is not None:
        conditions.append(Product.is_featured == is_featured)
    if category_id:
        conditions.append(Product.category_id == category_id)
    if min_price is not None:
        conditions.append(Product.price >= min_price)
    if max_price is not None:
        conditions.append(Product.price <= max_price)
    if search:
        conditions.append(
            Product.name.ilike(f"%{search}%") | Product.description.ilike(f"%{search}%")
        )

    # Count total
    count_query = select(func.count(Product.id))
    if conditions:
        count_query = count_query.where(and_(*conditions))
    result = await db.execute(count_query)
    total = result.scalar() or 0

    # Fetch products
    query = select(Product)
    if conditions:
        query = query.where(and_(*conditions))

    # Sorting
    sort_column = getattr(Product, sort_by)
    query = query.order_by(sort_column.desc() if sort_order == "desc" else sort_column.asc())

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    products = result.scalars().all()

    return ProductListResponse(
        products=[ProductResponse.model_validate(p) for p in products],
        pagination=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            pages=math.ceil(total / limit) if total > 0 else 0,
        ),
    )


# ── Get Product ────────────────────────────────────────────
@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a single product by ID."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return ProductResponse.model_validate(product)


# ── Create Product ─────────────────────────────────────────
@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new product."""
    # Check for duplicate SKU
    existing = await db.execute(select(Product).where(Product.sku == data.sku))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Product with this SKU already exists")

    product = Product(
        **data.model_dump(),
        slug=slugify(data.name),
    )
    db.add(product)
    await db.flush()
    await db.refresh(product)

    logger.info("product_created", product_id=str(product.id), sku=product.sku)

    return ProductResponse.model_validate(product)


# ── Update Product ─────────────────────────────────────────
@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing product."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)
    if "name" in update_data:
        update_data["slug"] = slugify(update_data["name"])

    for key, value in update_data.items():
        setattr(product, key, value)

    await db.flush()
    await db.refresh(product)

    logger.info("product_updated", product_id=str(product_id))

    return ProductResponse.model_validate(product)


# ── Delete Product ─────────────────────────────────────────
@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a product."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.delete(product)

    logger.info("product_deleted", product_id=str(product_id))


# ── Update Stock ───────────────────────────────────────────
@router.patch("/{product_id}/stock", response_model=ProductResponse)
async def update_stock(
    product_id: UUID,
    quantity: int = Query(..., description="New stock quantity"),
    db: AsyncSession = Depends(get_db),
):
    """Update product stock quantity."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.quantity = quantity
    await db.flush()
    await db.refresh(product)

    logger.info(
        "stock_updated",
        product_id=str(product_id),
        new_quantity=quantity,
    )

    return ProductResponse.model_validate(product)
