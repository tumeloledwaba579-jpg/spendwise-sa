# test-routes.ps1 - Test all API routes (Fixed for PowerShell 5.1)
$BASE_URL = "http://localhost:8000"

Write-Host "=== ROUTE TEST SUITE ===" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

# Function to test endpoint
function Test-Endpoint {
    param(
        $method,
        $path,
        $expectedStatus = 200,
        $description = ""
    )
    
    $url = "$BASE_URL$path"
    if ($description) {
        Write-Host "`n[TEST] $method $path - $description" -ForegroundColor Yellow
    } else {
        Write-Host "`n[TEST] $method $path" -ForegroundColor Yellow
    }
    
    try {
        # Don't use -SkipCertificateCheck (not available in PS 5.1)
        if ($method -eq "GET") {
            $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 5 -UseBasicParsing
        } else {
            $response = Invoke-WebRequest -Uri $url -Method Post -TimeoutSec 5 -UseBasicParsing
        }
        
        if ($response.StatusCode -eq $expectedStatus) {
            Write-Host "   [OK] Status: $($response.StatusCode)" -ForegroundColor Green
        } else {
            Write-Host "   [FAIL] Expected $expectedStatus, got $($response.StatusCode)" -ForegroundColor Red
        }
        
        # Try to parse and display JSON response
        try {
            $content = $response.Content | ConvertFrom-Json
            $contentPreview = $content | ConvertTo-Json -Compress
            if ($contentPreview.Length -gt 100) {
                $contentPreview = $contentPreview.Substring(0, 100) + "..."
            }
            Write-Host "   Response: $contentPreview" -ForegroundColor White
        } catch {
            # Not JSON or empty response - that's fine
        }
    } catch {
        # Check if we got an HTTP error with status code
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            if ($statusCode -eq $expectedStatus) {
                Write-Host "   [OK] Got expected error: $statusCode" -ForegroundColor Green
            } else {
                Write-Host "   [FAIL] Expected $expectedStatus, got $statusCode" -ForegroundColor Red
                Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        } else {
            # Network error or timeout
            Write-Host "   [FAIL] Connection failed: $_" -ForegroundColor Red
            Write-Host "   Is the server running at $BASE_URL?" -ForegroundColor Yellow
        }
    }
}

# First, check if server is running
Write-Host "`n[INFO] Checking if server is running..." -ForegroundColor Cyan
try {
    $test = Invoke-WebRequest -Uri "$BASE_URL/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "   [OK] Server is responding!" -ForegroundColor Green
} catch {
    Write-Host "   [WARN] Server not responding. Tests may fail." -ForegroundColor Yellow
    Write-Host "   Start server with: uvicorn app.main:app --reload" -ForegroundColor White
}
Write-Host ("=" * 50) -ForegroundColor Cyan

# 1. Test basic endpoints
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "TESTING BASIC ENDPOINTS" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

Test-Endpoint -method "GET" -path "/health" -description "Health check"
Test-Endpoint -method "GET" -path "/api/v1/health" -description "API health check"
Test-Endpoint -method "GET" -path "/api/v1/test-cors" -description "CORS test"

# 2. Test auth endpoints
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "TESTING AUTH ENDPOINTS" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

Test-Endpoint -method "GET" -path "/api/v1/auth/test" -description "Auth test"
Test-Endpoint -method "POST" -path "/api/v1/auth/register" -expectedStatus 422 -description "Register (without body)"
Test-Endpoint -method "POST" -path "/api/v1/auth/login" -expectedStatus 422 -description "Login (without body)"
Test-Endpoint -method "POST" -path "/api/v1/auth/logout" -expectedStatus 401 -description "Logout (without auth)"

# 3. Test income endpoints
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "TESTING INCOME ENDPOINTS" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

Test-Endpoint -method "GET" -path "/api/v1/income/sources" -expectedStatus 401 -description "Income sources (no auth)"
Test-Endpoint -method "GET" -path "/api/v1/income/history" -expectedStatus 401 -description "Income history (no auth)"
Test-Endpoint -method "GET" -path "/api/v1/income/summary/2026/2" -expectedStatus 401 -description "Monthly summary (no auth)"
Test-Endpoint -method "GET" -path "/api/v1/income/stats" -expectedStatus 401 -description "Income stats (no auth)"
Test-Endpoint -method "GET" -path "/api/v1/income/predict/next-month" -expectedStatus 401 -description "Income prediction (no auth)"

# 4. Test expense/transaction endpoints
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "TESTING EXPENSE/TRANSACTION ENDPOINTS" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

Test-Endpoint -method "GET" -path "/api/v1/transactions" -expectedStatus 401 -description "Transactions list (no auth)"
Test-Endpoint -method "GET" -path "/api/v1/transactions/?limit=10" -expectedStatus 401 -description "Transactions with params (no auth)"

# 5. Test category endpoints
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "TESTING CATEGORY ENDPOINTS" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

Test-Endpoint -method "GET" -path "/api/v1/categories" -expectedStatus 401 -description "Categories list (no auth)"
Test-Endpoint -method "GET" -path "/api/v1/categories/" -expectedStatus 401 -description "Categories with slash (no auth)"

# 6. Test account endpoints
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "TESTING ACCOUNT ENDPOINTS" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

Test-Endpoint -method "GET" -path "/api/v1/accounts" -expectedStatus 401 -description "Accounts list (no auth)"
Test-Endpoint -method "GET" -path "/api/v1/accounts/" -expectedStatus 401 -description "Accounts with slash (no auth)"

# 7. Test OpenAPI docs
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "TESTING API DOCUMENTATION" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

Test-Endpoint -method "GET" -path "/api/v1/docs" -description "Swagger UI"
Test-Endpoint -method "GET" -path "/api/v1/redoc" -description "ReDoc"
Test-Endpoint -method "GET" -path "/api/v1/openapi.json" -description "OpenAPI spec"

# 8. Summary
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "ROUTE TEST COMPLETE!" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan
Write-Host ""
Write-Host "STATUS CODE LEGEND:" -ForegroundColor Yellow
Write-Host "   200 = OK (endpoint exists and returns data)" -ForegroundColor Green
Write-Host "   401 = Unauthorized (needs auth - GOOD for protected endpoints)" -ForegroundColor Yellow
Write-Host "   422 = Unprocessable Entity (needs body/data - GOOD for POST endpoints)" -ForegroundColor Yellow
Write-Host "   404 = Not Found (endpoint doesn't exist - BAD)" -ForegroundColor Red