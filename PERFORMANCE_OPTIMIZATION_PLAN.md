# SPENDWISE SA - PERFORMANCE OPTIMIZATION PLAN
## Phase 2 Income Tracking Module

================================================================================
CURRENT PERFORMANCE BASELINE
================================================================================

? What's Working Well:
- Denormalized monthly_summary table (O(1) monthly queries)
- Proper database indexes on frequently queried columns
- Async/await throughout service layer
- JWT token-based authentication (stateless)
- Pydantic validation (fast schema validation)

?? Areas for Optimization:
1. Database Query Optimization
2. Caching Strategy
3. API Response Times
4. Data Aggregation Performance
5. Batch Operations

================================================================================
1. DATABASE QUERY OPTIMIZATION
================================================================================

Current Issues:
- get_income_stats() does full year scan for every request
- Monthly summary recalculation happens on every income record add
- No connection pooling optimization
- N+1 query problems in list_income_sources

Optimization Solutions:

A. Query Optimization - get_income_stats()
   BEFORE: Loads ALL income history for year into memory
   AFTER: Use database aggregation functions

   Current:
```python
   history_result = await session.execute(
       select(IncomeHistory).where(...)  # Loads all rows
   )
   history = result.scalars().all()
   total_annual = sum(h.amount for h in history)  # Python sum
```

   Optimized:
```python
   # Use SQL aggregation (much faster)
   result = await session.execute(
       select(
           func.sum(IncomeHistory.amount),
           func.sum(IncomeHistory.tax_amount)
       ).where(...)
   )
   total_annual, total_tax = result.scalar()
```

B. Monthly Summary Batching
   BEFORE: Recalculate on every single income record insert
   AFTER: Queue updates, batch process

   Implement:
   - Message queue (e.g., Celery, RQ)
   - Batch summary updates
   - Calculate every 5 minutes vs immediately

C. Connection Pooling
   BEFORE: Default asyncpg settings
   AFTER: Tune pool size for throughput

   Update database.py:
```python
   engine = create_async_engine(
       DATABASE_URL,
       echo=False,
       pool_size=20,           # Increase from default 5
       max_overflow=10,        # Allow 10 extra connections
       pool_pre_ping=True,     # Verify connections alive
       pool_recycle=3600       # Recycle after 1 hour
   )
```

================================================================================
2. CACHING STRATEGY
================================================================================

Add Redis caching for frequently accessed data:

A. Cache Annual Statistics (TTL: 1 hour)
```python
   # Cache key: f"income:stats:{user_id}:{year}"
   # Hit rate: Very high (same user, same year)
   # Save: 50-100ms per request
```

B. Cache Monthly Summaries (TTL: 30 minutes)
```python
   # Cache key: f"income:summary:{user_id}:{year}:{month}"
   # Hit rate: High
   # Save: 20-50ms per request
```

C. Cache Income Predictions (TTL: 1 hour)
```python
   # Cache key: f"income:predict:{user_id}"
   # Hit rate: Medium-High
   # Save: 30-80ms per request
```

D. Invalidation Strategy
   - Invalidate cache on new income record
   - Invalidate cache on source update
   - Automatic expiration (TTL)

Implementation:
```python
# Add to requirements.txt
redis==5.0.1
aioredis==2.0.1

# Create cache service
class CacheService:
    async def get(self, key: str):
        return await redis.get(key)
    
    async def set(self, key: str, value: str, ttl: int = 3600):
        await redis.setex(key, ttl, value)
    
    async def invalidate(self, pattern: str):
        keys = await redis.keys(pattern)
        if keys:
            await redis.delete(*keys)
```

================================================================================
3. API RESPONSE TIME OPTIMIZATION
================================================================================

A. Lazy Loading
   BEFORE: Load all relationships eagerly
   AFTER: Load only needed fields

   Current:
```python
   sources = await session.execute(select(IncomeSource))
   # Loads all 50+ fields per record
```

   Optimized:
```python
   sources = await session.execute(
       select(
           IncomeSource.id,
           IncomeSource.name,
           IncomeSource.amount,
           IncomeSource.type
       )  # Only needed fields
   )
```

B. Pagination for List Endpoints
   Add pagination to list endpoints:
```python
   @app.get("/income/sources")
   async def list_sources(
       skip: int = 0,
       limit: int = 50,  # Default page size
       headers = Depends(get_current_user)
   ):
       # Only fetch 50 records instead of all
       sources = await session.execute(
           select(IncomeSource)
           .offset(skip)
           .limit(limit)
       )
```

C. Response Compression
```python
   app.add_middleware(GZipMiddleware, minimum_size=1000)
```

================================================================================
4. BATCH OPERATIONS
================================================================================

A. Bulk Income Recording
   New endpoint for batch income imports:
```python
   @app.post("/income/history/batch")
   async def bulk_record_income(
       records: List[IncomeHistoryCreate]
   ):
       # Insert 1000 records in ~100ms vs 10 seconds individually
       session.add_all([...])
       await session.commit()
```

B. Bulk Source Creation
```python
   @app.post("/income/sources/bulk")
   async def bulk_create_sources(
       sources: List[IncomeSourceCreate]
   ):
       # Similar bulk optimization
```

================================================================================
5. DATABASE INDEXING REVIEW
================================================================================

Current Indexes:
? idx_income_user_active (user_id, is_active)
? idx_income_user_created (user_id, created_at)
? idx_income_history_user (user_id, received_date)
? idx_income_history_source (income_source_id, received_date)

Add These Indexes:
```python
# For annual stats queries
Index('idx_income_history_period', 
      IncomeHistory.user_id,
      IncomeHistory.received_date)

# For prediction queries
Index('idx_income_sources_active',
      IncomeSource.user_id,
      IncomeSource.is_recurring,
      IncomeSource.is_active)

# For monthly summary lookups
Index('idx_monthly_summary_period',
      IncomeMonthlySummary.user_id,
      IncomeMonthlySummary.year,
      IncomeMonthlySummary.month)
```

================================================================================
6. ASYNC/CONCURRENCY OPTIMIZATION
================================================================================

Current: Sequential processing
Optimized: Parallel processing
```python
# Instead of:
source = await get_source(id)
history = await get_history(source.id)
stats = await get_stats(user_id)

# Use concurrent execution:
source, history, stats = await asyncio.gather(
    get_source(id),
    get_history(source.id),
    get_stats(user_id)
)
```

================================================================================
7. MONITORING & METRICS
================================================================================

Add Performance Monitoring:
```python
import time
from functools import wraps

def track_performance(func):
    async def wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        duration = time.time() - start
        
        # Log slow queries (>100ms)
        if duration > 0.1:
            logger.warning(f"{func.__name__} took {duration:.3f}s")
        
        # Send to monitoring system
        metrics.histogram(
            f"income.{func.__name__}.duration",
            duration * 1000  # milliseconds
        )
        
        return result
    return wrapper
```

Implement:
- Query timing logs
- Endpoint response time tracking
- Cache hit/miss ratios
- Database connection pool monitoring

================================================================================
8. IMPLEMENTATION ROADMAP
================================================================================

Phase 1 (Week 1) - Quick Wins:
? Add pagination to list endpoints
? Optimize get_income_stats() with SQL aggregation
? Add connection pooling tuning
? Add GZip compression middleware
Estimated Impact: 20-30% response time improvement

Phase 2 (Week 2) - Caching:
? Set up Redis
? Implement cache service
? Add caching to stats endpoint
? Add cache invalidation logic
Estimated Impact: 50-70% improvement on cached endpoints

Phase 3 (Week 3) - Advanced:
? Add bulk operation endpoints
? Implement monitoring/metrics
? Add database indexes
? Optimize N+1 queries
Estimated Impact: 30-40% overall improvement

Phase 4 (Week 4) - Testing:
? Load testing (100 concurrent users)
? Stress testing (1000 records)
? Memory profiling
? Query analysis
Estimated Impact: Baseline for optimization success

================================================================================
9. EXPECTED IMPROVEMENTS
================================================================================

Before Optimization:
- List sources: ~50ms
- Get stats: ~150ms (full year scan)
- Monthly summary: ~80ms
- Predict income: ~100ms
- Average response: ~95ms

After Optimization:
- List sources: ~10ms (with pagination + lazy loading)
- Get stats: ~20ms (SQL aggregation + cache)
- Monthly summary: ~15ms (cache)
- Predict income: ~30ms (cache)
- Average response: ~18ms

Improvement: ~5x faster (95ms ? 18ms)

================================================================================
10. QUICK WINS (Implement Today)
================================================================================

1. Add SQL Aggregation to get_income_stats()
   File: app/services/income_service.py
   Time: 15 minutes
   Impact: ~60% faster for stats

2. Add Pagination to list_income_sources()
   File: app/api/v1/endpoints/income.py
   Time: 10 minutes
   Impact: ~40% faster for large lists

3. Tune Database Connection Pool
   File: app/core/database.py
   Time: 5 minutes
   Impact: ~20% better under load

4. Add GZip Compression
   File: app/main.py
   Time: 5 minutes
   Impact: ~70% smaller response payloads

Total Time: 35 minutes
Total Impact: 2-3x overall improvement

================================================================================
