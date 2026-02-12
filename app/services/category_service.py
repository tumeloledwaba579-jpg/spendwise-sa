import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_
from app.models.category import Category, CategoryType
from app.schemas.category import CategoryCreate, CategoryUpdate

class CategoryService:
    @staticmethod
    async def create_category(
        session: AsyncSession,
        user_id: uuid.UUID,
        category_in: CategoryCreate
    ) -> Category:
        """Create a new category for a user."""
        # Check if parent category exists and belongs to the same user
        if category_in.parent_id:
            parent = await CategoryService.get_category(session, user_id, category_in.parent_id)
            if not parent:
                raise ValueError("Parent category not found or does not belong to user")

        db_category = Category(
            user_id=user_id,
            name=category_in.name,
            category_type=category_in.category_type,
            description=category_in.description,
            icon=category_in.icon,
            color=category_in.color,
            parent_id=category_in.parent_id,
            is_active=category_in.is_active,
            display_order=category_in.display_order
        )
        session.add(db_category)
        await session.commit()
        await session.refresh(db_category)
        return db_category

    @staticmethod
    async def get_categories(
        session: AsyncSession,
        user_id: uuid.UUID,
        category_type: Optional[CategoryType] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Category]:
        """Get all categories for a user, optionally filtered by type."""
        query = select(Category).where(Category.user_id == user_id)
        
        if category_type:
            query = query.where(Category.category_type == category_type)
        
        query = query.offset(skip).limit(limit).order_by(Category.display_order, Category.name)
        
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_category(
        session: AsyncSession,
        user_id: uuid.UUID,
        category_id: uuid.UUID
    ) -> Optional[Category]:
        """Get a specific category by ID, ensuring ownership."""
        result = await session.execute(
            select(Category)
            .where(and_(Category.id == category_id, Category.user_id == user_id))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_category(
        session: AsyncSession,
        user_id: uuid.UUID,
        category_id: uuid.UUID,
        category_in: CategoryUpdate
    ) -> Optional[Category]:
        """Update a category, ensuring ownership."""
        # First, verify ownership
        category = await CategoryService.get_category(session, user_id, category_id)
        if not category:
            return None

        # Check parent category if being updated
        if category_in.parent_id is not None:
            if category_in.parent_id == category_id:
                raise ValueError("Category cannot be its own parent")
            
            if category_in.parent_id:
                parent = await CategoryService.get_category(session, user_id, category_in.parent_id)
                if not parent:
                    raise ValueError("Parent category not found or does not belong to user")

        # Prepare update data
        update_data = category_in.dict(exclude_unset=True)
        if not update_data:
            return category

        # Perform update
        stmt = (
            update(Category)
            .where(and_(Category.id == category_id, Category.user_id == user_id))
            .values(**update_data)
            .returning(Category)
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.scalar_one()

    @staticmethod
    async def delete_category(
        session: AsyncSession,
        user_id: uuid.UUID,
        category_id: uuid.UUID
    ) -> bool:
        """Delete a category, ensuring ownership and checking for dependencies."""
        # Verify ownership and check if it has subcategories
        category = await CategoryService.get_category(session, user_id, category_id)
        if not category:
            return False

        # Check if it's a system category (protected)
        if category.is_system:
            raise ValueError("System categories cannot be deleted")

        # Check for subcategories
        subcategories = await session.execute(
            select(Category).where(Category.parent_id == category_id)
        )
        if subcategories.scalars().first():
            raise ValueError("Category has subcategories and cannot be deleted")

        # TODO: Check for dependent transactions and budgets
        # For now, we'll allow deletion

        # Delete the category
        stmt = delete(Category).where(and_(Category.id == category_id, Category.user_id == user_id))
        await session.execute(stmt)
        await session.commit()
        return True
