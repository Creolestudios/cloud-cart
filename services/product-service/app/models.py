# ============================================================
# Product Service — SQLAlchemy Models
# ============================================================

import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, Float, Integer, Boolean,
    DateTime, ForeignKey, Index, CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    slug = Column(String(120), nullable=False, unique=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    products = relationship("Product", back_populates="category", lazy="selectin")

    def __repr__(self):
        return f"<Category(name='{self.name}')>"


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    slug = Column(String(220), nullable=False, unique=True, index=True)
    sku = Column(String(50), nullable=False, unique=True, index=True)
    price = Column(Float, nullable=False)
    compare_at_price = Column(Float, nullable=True)
    cost_price = Column(Float, nullable=True)
    quantity = Column(Integer, default=0, nullable=False)
    low_stock_threshold = Column(Integer, default=10, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    weight = Column(Float, nullable=True)
    image_url = Column(String(500), nullable=True)
    tags = Column(String(500), nullable=True)  # Comma-separated tags

    # Foreign Keys
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("Category", back_populates="products")

    # Constraints
    __table_args__ = (
        CheckConstraint("price >= 0", name="check_price_positive"),
        CheckConstraint("quantity >= 0", name="check_quantity_positive"),
        Index("idx_product_category_active", "category_id", "is_active"),
        Index("idx_product_price_range", "price", "is_active"),
    )

    def __repr__(self):
        return f"<Product(name='{self.name}', sku='{self.sku}')>"
