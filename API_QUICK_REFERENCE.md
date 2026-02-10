# SpendWise SA - API Quick Reference

## Base URL
\\\
http://localhost:8000/api/v1
\\\

## Headers Required
\\\
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
\\`

## Authentication

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login and get token |

## Income Tracking

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /income/sources | Create income source |
| GET | /income/sources | List income sources |
| GET | /income/sources/{id} | Get specific source |
| PUT | /income/sources/{id} | Update income source |
| POST | /income/history | Record actual income |
| GET | /income/history | Get income history |
| GET | /income/summary/{year}/{month} | Monthly summary |
| GET | /income/stats | Annual statistics |
| GET | /income/predict/next-month | Predict next month |

## Debt Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /debts/accounts | Create debt account |
| GET | /debts/accounts | List debts |
| GET | /debts/accounts/{id} | Get specific debt |
| PUT | /debts/accounts/{id} | Update debt |
| DELETE | /debts/accounts/{id} | Deactivate debt |
| POST | /debts/payments | Record payment |
| GET | /debts/payments | Get payment history |
| GET | /debts/summary | Current summary |
| GET | /debts/stats | Annual statistics |
| GET | /debts/payoff-strategy | Calculate strategy |

## Asset Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /net-worth/assets | Create asset |
| GET | /net-worth/assets | List assets |
| GET | /net-worth/assets/{id} | Get specific asset |
| PUT | /net-worth/assets/{id} | Update asset |
| POST | /net-worth/valuations | Record valuation |
| GET | /net-worth/dashboard | Net worth snapshot |
| GET | /net-worth/history | Historical tracking |

## Analytics & Goals

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /analytics/goals | Create goal |
| GET | /analytics/goals | List goals |
| GET | /analytics/goals/{id} | Get specific goal |
| POST | /analytics/milestones | Create milestone |
| GET | /analytics/insights | Get AI insights |
| GET | /analytics/health-score | Financial health score |
| GET | /analytics/forecast | Financial forecast |

## Query Parameters

### Pagination
\\\
?skip=0&limit=50
\\`

### Filtering
\\\
?active_only=true
?year=2026&month=1
?start_date=2026-01-01&end_date=2026-12-31
\\`

### Analytics
\\`\
?strategy_type=SNOWBALL
?months=12
\\`

## Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Success |
| 201 | Created - Resource created |
| 204 | No Content - Success, no response body |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Not enough permissions |
| 404 | Not Found - Resource doesn't exist |
| 422 | Validation Error - Schema validation failed |
| 500 | Server Error - Internal error |

## Data Type Reference

### Decimal (Money)
\\\json
"amount": "1234.56"
\\`

### Date
\\\json
"date": "2026-01-28"
\\`

### UUID
\\`\json
"id": "550e8400-e29b-41d4-a716-446655440000"
\\`

### Boolean
\\`\json
"is_active": true
\\`

## Example Request

\\\ash
curl -X POST http://localhost:8000/api/v1/income/sources \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Primary Salary",
    "type": "SALARY",
    "frequency": "MONTHLY",
    "amount": "5000.00",
    "is_recurring": true
  }'
\\`

## Example Response

\\\json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Primary Salary",
  "type": "SALARY",
  "frequency": "MONTHLY",
  "amount": "5000.00",
  "is_recurring": true,
  "is_active": true,
  "created_at": "2026-01-28T10:30:00Z"
}
\\`

## Error Response

\\\json
{
  "detail": "Invalid input data",
  "errors": [
    {
      "field": "amount",
      "message": "Must be greater than 0"
    }
  ]
}
\\`

---

**Bookmark this page for quick reference during frontend development!**
