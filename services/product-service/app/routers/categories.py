# ============================================================
# Product Service — Category Router
# ============================================================

import re
import math
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Category
from app.schemas import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    CategoryListResponse, PaginationMeta,
)
from app.utils.logger import logger

router = APIRouter()


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


# ── List Categories ────────────────────────────────────────
@router.get("/", response_model=CategoryListResponse)
async def list_categories(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = True,
    db: AsyncSession = Depends(get_db),
):
    """List all categories with pagination."""
    conditions = []
    if is_active is not None:
        conditions.append(Category.is_active == is_active)

    # Count total
    count_query = select(func.count(Category.id))
    for cond in conditions:
        count_query = count_query.where(cond)
    result = await db.execute(count_query)
    total = result.scalar() or 0

    # Fetch categories
    query = select(Category).order_by(Category.name)
    for cond in conditions:
        query = query.where(cond)
    query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    categories = result.scalars().all()

    return CategoryListResponse(
        categories=[CategoryResponse.model_validate(c) for c in categories],
        pagination=PaginationMeta(
            page=page, limit=limit, total=total,
            pages=math.ceil(total / limit) if total > 0 else 0,
        ),
    )


# ── Get Category ──────────────────────────────────────────
@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryResponse.model_validate(category)


# ── Create Category ───────────────────────────────────────
@router.post("/", response_model=CategoryResponse, status_code=201)
async def create_category(data: CategoryCreate, db: AsyncSession = Depends(get_db)):
    category = Category(**data.model_dump(), slug=slugify(data.name))
    db.add(category)
    await db.flush()
    await db.refresh(category)
    logger.info("category_created", category_id=str(category.id))
    return CategoryResponse.model_validate(category)


# ── Update Category ───────────────────────────────────────
@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID, data: CategoryUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = data.model_dump(exclude_unset=True)
    if "name" in update_data:
        update_data["slug"] = slugify(update_data["name"])

    for key, value in update_data.items():
        setattr(category, key, value)

    await db.flush()
    await db.refresh(category)
    logger.info("category_updated", category_id=str(category_id))
    return CategoryResponse.model_validate(category)


# ── Delete Category ───────────────────────────────────────
@router.delete("/{category_id}", status_code=204)
async def delete_category(category_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(category)
    logger.info("category_deleted", category_id=str(category_id))
