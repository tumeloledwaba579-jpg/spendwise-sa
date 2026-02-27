# test-session-debug.ps1 - Debug session issues
$BASE_URL = "http://localhost:8000"

Write-Host "=== SESSION DEBUGGING TOOL ===" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

# Login and capture session
Write-Host "`n[1] Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "crud-test-3169@example.com"
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

# Function to test endpoint and show cookies
function Test-EndpointWithDebug {
    param(
        [string]$Path,
        [string]$Name
    )
    
    Write-Host "`n[TEST] $Name - $Path" -ForegroundColor Yellow
    
    # Show cookies being sent
    if ($script:session -and $script:session.Cookies) {
        $cookies = $script:session.Cookies.GetCookies("$BASE_URL")
        Write-Host "   Cookies being sent:" -ForegroundColor Gray
        foreach ($cookie in $cookies) {
            Write-Host "     - $($cookie.Name): $($cookie.Value)" -ForegroundColor White
        }
    } else {
        Write-Host "   No cookies in session!" -ForegroundColor Red
    }
    
    # Make request
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL$Path" `
            -Method GET `
            -WebSession $script:session `
            -UseBasicParsing `
            -TimeoutSec 10
        
        Write-Host "   [OK] Status: $($response.StatusCode)" -ForegroundColor Green
        try {
            $content = $response.Content | ConvertFrom-Json
            Write-Host "   Response type: $($content.GetType().Name)" -ForegroundColor White
            if ($content.Count -ne $null) {
                Write-Host "   Items count: $($content.Count)" -ForegroundColor White
            }
        } catch {
            Write-Host "   Response: $($response.Content)" -ForegroundColor White
        }
    } catch {
        Write-Host "   [FAIL] Error: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
        }
    }
}

# Test different endpoints
Test-EndpointWithDebug -Path "/api/v1/auth/me" -Name "Auth Me"
Test-EndpointWithDebug -Path "/api/v1/accounts" -Name "Accounts"
Test-EndpointWithDebug -Path "/api/v1/categories" -Name "Categories"
Test-EndpointWithDebug -Path "/api/v1/transactions" -Name "Transactions"

Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "Debug complete!" -ForegroundColor Cyan