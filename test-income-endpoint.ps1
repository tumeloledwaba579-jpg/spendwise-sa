# test-income-endpoint.ps1
$BASE_URL = "http://localhost:8000"

Write-Host "=== INCOME ENDPOINT DIAGNOSTIC ===" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

# First, login to get a session
Write-Host "`n[1] Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "perf-test-8223@example.com"
    password = "Test123!@#"
} | ConvertTo-Json

try {
    $loginParams = @{
        Uri = "$BASE_URL/api/v1/auth/login"
        Method = "POST"
        Body = $loginBody
        ContentType = "application/json"
        TimeoutSec = 10
        UseBasicParsing = $true
        SessionVariable = "session"
    }
    
    $loginResponse = Invoke-WebRequest @loginParams
    Write-Host "   [OK] Login successful" -ForegroundColor Green
    $script:session = $session
} catch {
    Write-Host "   [FAIL] Login failed: $_" -ForegroundColor Red
    exit 1
}

# Function to test income endpoint
function Test-IncomeEndpoint {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Body = $null,
        [string]$Description
    )
    
    $url = "$BASE_URL$Path"
    Write-Host "`n[TEST] $Method $Path - $Description" -ForegroundColor Yellow
    
    $params = @{
        Uri = $url
        Method = $Method
        TimeoutSec = 10
        UseBasicParsing = $true
        WebSession = $script:session
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json)
        $params.ContentType = "application/json"
    }
    
    try {
        $response = Invoke-WebRequest @params
        Write-Host "   [OK] Status: $($response.StatusCode)" -ForegroundColor Green
        
        try {
            $content = $response.Content | ConvertFrom-Json
            if ($content -is [array]) {
                Write-Host "   Found $($content.Count) items" -ForegroundColor White
            } else {
                Write-Host "   Response: $($content | ConvertTo-Json -Compress)" -ForegroundColor White
            }
            return $true
        } catch {
            Write-Host "   Response: $($response.Content)" -ForegroundColor White
            return $true
        }
    } catch {
        Write-Host "   [FAIL] Error: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
        }
        return $false
    }
}

# Test all income endpoints
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "TESTING INCOME ENDPOINTS" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

# 1. Get income sources
Test-IncomeEndpoint -Method "GET" -Path "/api/v1/income/sources" -Description "Get income sources"

# 2. Create a test income source
$sourceBody = @{
    name = "Test Income Source"
    type = "SALARY"
    frequency = "MONTHLY"
    amount = 5000
    currency = "ZAR"
    is_recurring = $true
    is_taxable = $true
    start_date = (Get-Date).ToString("yyyy-MM-dd")
}

Test-IncomeEndpoint -Method "POST" -Path "/api/v1/income/sources" -Body $sourceBody -Description "Create income source"

# 3. Get income history
Test-IncomeEndpoint -Method "GET" -Path "/api/v1/income/history" -Description "Get income history"

# 4. Get income stats
Test-IncomeEndpoint -Method "GET" -Path "/api/v1/income/stats?year=2026" -Description "Get income stats"

# 5. Get monthly summary
$year = (Get-Date).Year
$month = (Get-Date).Month
Test-IncomeEndpoint -Method "GET" -Path "/api/v1/income/summary/$year/$month" -Description "Get monthly summary"

# 6. Get next month prediction
Test-IncomeEndpoint -Method "GET" -Path "/api/v1/income/predict/next-month" -Description "Get income prediction"

Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "DIAGNOSTIC COMPLETE!" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan