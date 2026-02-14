# SpendWise SA - Complete Development Guide

## 📋 PROJECT STATUS: ✅ WORKING PRODUCTION READY
**Version:** 3.0.0 | **Last Updated:** February 12, 2026

---

## 🚀 QUICK START

```powershell
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

---

## 📁 COMPLETE PROJECT STRUCTURE

```
C:/Users/tumel/spendwise-sa/
│
├── 📱 frontend/                          # Next.js 14.0.4
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── .env.local
│   │
│   └── src/
│       └── app/
│           ├── page.tsx                 # 🏠 Landing page (COMPLETE)
│           ├── layout.tsx              # Root layout with AuthProvider
│           ├── globals.css             # Global styles
│           │
│           ├── (auth)/                 # Authentication routes
│           │   ├── login/
│           │   │   └── page.tsx
│           │   └── register/
│           │       └── page.tsx
│           │
│           ├── dashboard/              # Protected routes
│           │   ├── page.tsx
│           │   └── components/
│           │       └── IncomeExpensePieChart.tsx
│           │
│           └── contexts/
│               └── AuthContext.tsx
│
├── 🖧 backend/                          # FastAPI Application
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   │
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   │
│   │   ├── models/                    # 🗄️ DATABASE TABLES
│   │   │   ├── base.py
│   │   │   ├── user.py
│   │   │   ├── category.py
│   │   │   ├── transaction.py
│   │   │   ├── account.py
│   │   │   ├── budget.py
│   │   │   ├── income.py
│   │   │   └── debt.py
│   │   │
│   │   └── api/
│   │       └── v1/
│   │           └── endpoints/
│   │               ├── auth.py
│   │               ├── transactions.py
│   │               ├── accounts.py
│   │               ├── categories.py
│   │               ├── budgets.py
│   │               ├── income.py
│   │               └── debt.py
│   │
│   └── alembic/                       # 📊 MIGRATIONS
│       ├── env.py
│       └── versions/
│           └── 001_initial_schema.py
│
├── 🐳 docker-compose.yml
│
└── 📄 README.md                       # This file
```

---

# ============================================
# 🗄️ PART 1: DATABASE TABLES (BACKEND)
# ============================================

## 📊 HOW TO CREATE NEW DATABASE TABLES

### Step 1: Create the Model File

Create a new file in `backend/app/models/your_model_name.py`:

```python
"""
Your Model Name - Description of what this table stores
"""
import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Boolean, func, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class YourModel(Base):
    __tablename__ = "your_table_name"  # ✅ Plural, snake_case

    # ============= PRIMARY KEY =============
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4, 
        index=True,
        nullable=False
    )
    
    # ============= FOREIGN KEYS =============
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False
    )
    
    # ============= DATA FIELDS =============
    name = Column(String, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # ============= TIMESTAMPS =============
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ============= RELATIONSHIPS =============
    # Belongs to User
    user = relationship("User", back_populates="your_models")
    
    # Has many children
    children = relationship("ChildModel", back_populates="parent", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<YourModel(id={self.id}, name={self.name})>"
```

---

### Step 2: Update User Model with Relationship

In `backend/app/models/user.py`, add the relationship:

```python
# Add to User class under the appropriate phase section
your_models = relationship("YourModel", back_populates="user", cascade="all, delete-orphan")
```

---

### Step 3: Create CRUD Endpoints

Create `backend/app/api/v1/endpoints/your_model.py`:

```python
"""
CRUD endpoints for YourModel
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.user import User
from app.models.your_model import YourModel
from app.schemas.your_model import YourModelCreate, YourModelUpdate, YourModelResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/your-models", response_model=List[YourModelResponse])
async def get_your_models(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all your_models for current user"""
    # Implement your query
    pass

@router.post("/your-models", response_model=YourModelResponse, status_code=status.HTTP_201_CREATED)
async def create_your_model(
    data: YourModelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new your_model"""
    # Implement your creation logic
    pass

# Add GET by id, PUT, DELETE endpoints
```

---

### Step 4: Create Pydantic Schemas

Create `backend/app/schemas/your_model.py`:

```python
"""
Pydantic schemas for YourModel
"""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class YourModelBase(BaseModel):
    name: str
    amount: float
    description: Optional[str] = None
    is_active: bool = True

class YourModelCreate(YourModelBase):
    pass

class YourModelUpdate(YourModelBase):
    name: Optional[str] = None
    amount: Optional[float] = None

class YourModelResponse(YourModelBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
```

---

### Step 5: Register the Router

In `backend/app/main.py`, add:

```python
from app.api.v1.endpoints import your_model
app.include_router(your_model.router, prefix="/api/v1", tags=["Your Models"])
```

---

### Step 6: Generate and Run Migration

```powershell
# Generate migration
docker-compose run --rm api alembic revision --autogenerate -m "add_your_model_table"

# Apply migration
docker-compose run --rm api alembic upgrade head
```

---

## ✅ DATABASE TABLE BEST PRACTICES

### DO:
```python
# ✅ Use UUID for all primary keys
id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

# ✅ Use timezone-aware timestamps
created_at = Column(DateTime(timezone=True), server_default=func.now())

# ✅ Define both sides of relationships
# In parent: children = relationship("Child", back_populates="parent")
# In child: parent = relationship("Parent", back_populates="children")

# ✅ Use ondelete cascade
user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

# ✅ Add indexes for foreign keys
user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)

# ✅ Use Numeric for currency
amount = Column(Numeric(12, 2), nullable=False, default=0.00)
```

### DON'T:
```python
# ❌ Don't use INTEGER for primary keys
id = Column(Integer, primary_key=True)  # Use UUID instead!

# ❌ Don't mix types (UUID vs INTEGER)
user_id = Column(Integer, ForeignKey("users.id"))  # users.id is UUID!

# ❌ Don't forget the other side of relationships
# If Transaction has user = relationship("User", back_populates="transactions")
# User MUST have transactions = relationship("Transaction", back_populates="user")

# ❌ Don't use float for currency
amount = Column(Float)  # Use Numeric for precision!
```

---

## 🔄 DATABASE RESET PROCEDURES

### Full Reset (Delete Everything)
```powershell
docker-compose down -v
docker-compose up -d postgres
Start-Sleep -Seconds 10
docker-compose run --rm api alembic upgrade head
docker-compose up -d
```

### Soft Reset (Keep Data, Fix Migrations)
```powershell
docker-compose down
Remove-Item C:\Users\tumel\spendwise-sa\alembic\versions\*.py -Force
docker-compose up -d postgres
docker-compose run --rm api alembic revision --autogenerate -m "reset"
docker-compose run --rm api alembic upgrade head
docker-compose up -d
```

### View Current Tables
```powershell
docker exec -it spendwise-sa-postgres-1 psql -U postgres -d spendwise_db -c "\dt"
```

### View Table Schema
```powershell
docker exec -it spendwise-sa-postgres-1 psql -U postgres -d spendwise_db -c "\d table_name"
```

---

# ============================================
# 🎨 PART 2: ADDING PAGES (FRONTEND)
# ============================================

## 📱 HOW TO ADD NEW PAGES

### Step 1: Choose the Correct Location

| Page Type | Location | URL Example |
|-----------|----------|-------------|
| **Public Landing** | `src/app/page.tsx` | `/` |
| **Authentication** | `src/app/(auth)/page-name/` | `/login`, `/register` |
| **Protected/User** | `src/app/dashboard/page-name/` | `/dashboard/analytics` |
| **Static/Info** | `src/app/page-name/` | `/about`, `/contact`, `/pricing` |
| **Nested Routes** | `src/app/parent/child/` | `/settings/profile` |

---

### Step 2: Create the Page File

**Example: Adding an "About" page**

Create: `frontend/src/app/about/page.tsx`

```tsx
'use client';

import Link from 'next/link';
import './about.css';  // Optional: create this file for specific styles

export default function AboutPage() {
  return (
    <div className="about-container">
      <h1>About SpendWise SA</h1>
      <p>We help South Africans take control of their financial future.</p>
      <Link href="/" className="back-link">← Back to Home</Link>
    </div>
  );
}
```

**Access at:** `http://localhost:3000/about`

---

### Step 3: Add a Protected Page (Requires Login)

**Example: Adding "Settings" page**

Create: `frontend/src/app/dashboard/settings/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import './settings.css';

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    // PROTECTED ROUTE - Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    setIsPageLoading(false);
  }, [user, authLoading, router]);

  if (authLoading || isPageLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <div className="settings-grid">
        <div className="settings-section">
          <h2>Profile Settings</h2>
          {/* Add profile form here */}
        </div>
        <div className="settings-section">
          <h2>Notification Preferences</h2>
          {/* Add notification settings here */}
        </div>
      </div>
    </div>
  );
}
```

**Access at:** `http://localhost:3000/dashboard/settings`

---

### Step 4: Add Page with Dynamic Routes

**Example: Transaction detail page**

Create: `frontend/src/app/dashboard/transactions/[id]/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const transactionId = params.id;
  
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch transaction by ID
    async function fetchTransaction() {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/transactions/${transactionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const data = await response.json();
        setTransaction(data);
      } catch (error) {
        console.error('Error fetching transaction:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransaction();
  }, [transactionId, user, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!transaction) return <div>Transaction not found</div>;

  return (
    <div>
      <h1>Transaction Details</h1>
      <pre>{JSON.stringify(transaction, null, 2)}</pre>
    </div>
  );
}
```

**Access at:** `http://localhost:3000/dashboard/transactions/123e4567-e89b-12d3-a456-426614174000`

---

### Step 5: Add Navigation Links

**In your navigation component:**

```tsx
<nav className="navbar">
  <Link href="/">Home</Link>
  <Link href="/about">About</Link>
  <Link href="/pricing">Pricing</Link>
  {user ? (
    <>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/dashboard/settings">Settings</Link>
      <button onClick={logout}>Logout</button>
    </>
  ) : (
    <>
      <Link href="/login">Sign In</Link>
      <Link href="/register">Get Started</Link>
    </>
  )}
</nav>
```

---

## ✅ PAGE CREATION BEST PRACTICES

### DO:
```tsx
// ✅ Use 'use client' for interactive pages
'use client';

// ✅ Handle loading states
if (isLoading) return <div className="loading-spinner">Loading...</div>;

// ✅ Protect authenticated routes
useEffect(() => {
  if (!user && !authLoading) {
    router.push('/login');
  }
}, [user, authLoading]);

// ✅ Add proper TypeScript interfaces
interface PageProps {
  params?: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// ✅ Use semantic HTML and CSS classes
<section className="features-section">
  <h2 className="section-title">Title</h2>
</section>
```

### DON'T:
```tsx
// ❌ Don't place pages in the wrong folder
src/app/login/page.tsx  // ✅ CORRECT
src/app/dashboard/login/page.tsx  // ❌ WRONG - login doesn't belong in dashboard

// ❌ Don't forget to protect routes
// Users can access unprotected routes even when logged out!

// ❌ Don't use inline styles for large components
<div style={{ color: 'red', marginTop: '20px', ... }}>  // Use CSS classes instead

// ❌ Don't hardcode API URLs
fetch('http://localhost:8000/api/...')  // Use environment variables instead
```

---

## 🎨 PAGE TEMPLATES BY TYPE

### 1. Public Landing Page
```tsx
'use client';
import Link from 'next/link';
export default function Page() { ... }
```

### 2. Authentication Page (Login/Register)
```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
export default function AuthPage() { ... }
```

### 3. Dashboard Page (Protected)
```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
export default function DashboardPage() { ... }
```

### 4. Form Page
```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function FormPage() {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Submit logic
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### 5. List/Table Page
```tsx
'use client';
import { useEffect, useState } from 'react';
export default function ListPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchItems();
  }, []);
  
  return (
    <div>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <table>
          {items.map(item => (
            <tr key={item.id}>{item.name}</tr>
          ))}
        </table>
      )}
    </div>
  );
}
```

---

## 🔗 ADDING PAGES TO NAVIGATION

### Header Navigation (components/Navbar.tsx)
```tsx
<Link href="/" className="logo">SpendWise</Link>
<div className="nav-links">
  <Link href="/features">Features</Link>
  <Link href="/pricing">Pricing</Link>
  <Link href="/about">About</Link>
  {user ? (
    <>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/dashboard/settings">Settings</Link>
    </>
  ) : (
    <>
      <Link href="/login">Login</Link>
      <Link href="/register" className="btn-primary">Sign Up</Link>
    </>
  )}
</div>
```

### Footer Navigation
```tsx
<div className="footer-links">
  <h4>Company</h4>
  <Link href="/about">About</Link>
  <Link href="/careers">Careers</Link>
  <Link href="/press">Press</Link>
</div>
```

---

## 📋 COMMON PAGE ERRORS & FIXES

| Error | Cause | Fix |
|-------|-------|-----|
| `404 Not Found` | Page doesn't exist or wrong URL | Check file path matches URL structure |
| `403 Forbidden` | No access to protected route | Add authentication check with `useAuth()` |
| Blank page | JavaScript error | Check console, add error boundary |
| Styles not loading | Missing CSS import | `import './page-name.css'` |
| `'use client'` missing | Using hooks in server component | Add `'use client'` at top of file |

---

## 🚀 QUICK COMMANDS SUMMARY

```powershell
# Create new page directory and file
cd frontend/src/app
mkdir about
New-Item about/page.tsx

# Create new dashboard page
cd frontend/src/app/dashboard
mkdir analytics
New-Item analytics/page.tsx

# Create new API endpoint directory and file
cd backend/app/api/v1/endpoints
New-Item analytics.py

# Generate new database table (model + migration)
# 1. Create model file in backend/app/models/
# 2. docker-compose run --rm api alembic revision --autogenerate -m "add_analytics_table"
# 3. docker-compose run --rm api alembic upgrade head
```

---

## 📄 LICENSE
© 2026 SpendWise SA. All rights reserved.

---

*This document includes complete, step-by-step instructions for:*
- ✅ **Creating new database tables** with proper UUID primary keys, relationships, and migrations
- ✅ **Adding new frontend pages** with correct routing, authentication, and best practices
- ✅ **Common pitfalls** and how to avoid them
- ✅ **Code templates** for every scenario
