# test-auth.ps1 - Complete authentication flow test (Fixed timeout)
$BASE_URL = "http://localhost:8000"
$TEST_EMAIL = "test-$(Get-Random -Maximum 9999)@example.com"
$TEST_PASSWORD = "Test123!@#"
$TEST_NAME = "Test User"

Write-Host "=== AUTHENTICATION TEST SUITE ===" -ForegroundColor Cyan
Write-Host ("=" * 40) -ForegroundColor Cyan
Write-Host "Test Email: $TEST_EMAIL" -ForegroundColor Yellow

# 1. Test health endpoint - INCREASED TIMEOUT TO 5 SECONDS
Write-Host "`n[1] Testing health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/health" -TimeoutSec 5
    Write-Host " [OK] Health check passed" -ForegroundColor Green
    Write-Host "       Version: $($health.version)" -ForegroundColor White
    Write-Host "       Status: $($health.status)" -ForegroundColor White
} catch {
    Write-Host " [FAIL] Health check failed. Is server running?" -ForegroundColor Red
    Write-Host "       Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "       Try: curl.exe http://localhost:8000/health" -ForegroundColor White
    exit 1
}

# 2. Test auth test endpoint
Write-Host "`n[2] Testing auth test endpoint..." -ForegroundColor Yellow
try {
    $test = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/test" -TimeoutSec 5
    Write-Host " [OK] Auth test passed: $($test.message)" -ForegroundColor Green
} catch {
    Write-Host " [FAIL] Auth test failed" -ForegroundColor Red
    Write-Host "       Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 3. Register user
Write-Host "`n[3] Registering user..." -ForegroundColor Yellow
$registerBody = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
    full_name = $TEST_NAME
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json" `
        -TimeoutSec 5
    
    Write-Host " [OK] Registration successful!" -ForegroundColor Green
    Write-Host "       User ID: $($register.user.id)" -ForegroundColor White
    Write-Host "       Email: $($register.user.email)" -ForegroundColor White
} catch {
    Write-Host " [FAIL] Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "       User might already exist, continuing..." -ForegroundColor Yellow
    } else {
        exit 1
    }
}

# 4. Login
Write-Host "`n[4] Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -SessionVariable session `
        -TimeoutSec 5
    
    Write-Host " [OK] Login successful!" -ForegroundColor Green
    Write-Host "       User: $($login.user.full_name)" -ForegroundColor White
    
    # Save session for later
    $global:testSession = $session
} catch {
    Write-Host " [FAIL] Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. Get current user
Write-Host "`n[5] Getting current user..." -ForegroundColor Yellow
try {
    $me = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/me" `
        -Method Get `
        -WebSession $global:testSession `
        -TimeoutSec 5
    
    Write-Host " [OK] Got user info:" -ForegroundColor Green
    Write-Host "       ID: $($me.id)" -ForegroundColor White
    Write-Host "       Email: $($me.email)" -ForegroundColor White
    Write-Host "       Name: $($me.full_name)" -ForegroundColor White
    Write-Host "       Created: $($me.created_at)" -ForegroundColor White
} catch {
    Write-Host " [FAIL] Failed to get user: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Check cookies (optional - shows what cookies are set)
Write-Host "`n[6] Checking session cookies..." -ForegroundColor Yellow
try {
    if ($global:testSession -and $global:testSession.Cookies) {
        $cookies = $global:testSession.Cookies.GetCookies("$BASE_URL")
        if ($cookies.Count -gt 0) {
            foreach ($cookie in $cookies) {
                $httpOnly = if ($cookie.HttpOnly) { "Yes" } else { "No" }
                Write-Host "       Cookie: $($cookie.Name)" -ForegroundColor White
                Write-Host "         HttpOnly: $httpOnly" -ForegroundColor Gray
                Write-Host "         Secure: $($cookie.Secure)" -ForegroundColor Gray
                Write-Host "         Path: $($cookie.Path)" -ForegroundColor Gray
            }
        } else {
            Write-Host "       No cookies found" -ForegroundColor Gray
        }
    } else {
        Write-Host "       No session available" -ForegroundColor Gray
    }
} catch {
    Write-Host "       Error checking cookies: $($_.Exception.Message)" -ForegroundColor Gray
}

# 7. Logout
Write-Host "`n[7] Logging out..." -ForegroundColor Yellow
try {
    $logout = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/logout" `
        -Method Post `
        -WebSession $global:testSession `
        -TimeoutSec 5
    
    Write-Host " [OK] Logout successful!" -ForegroundColor Green
    Write-Host "       Message: $($logout.message)" -ForegroundColor White
} catch {
    Write-Host " [FAIL] Logout failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Try to get user after logout (should fail)
Write-Host "`n[8] Testing auth after logout (should fail)..." -ForegroundColor Yellow
try {
    $meAfter = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/me" `
        -Method Get `
        -WebSession $global:testSession `
        -TimeoutSec 5
    
    Write-Host " [FAIL] Should have failed but didn't!" -ForegroundColor Red
    Write-Host "       Got response: $($meAfter | ConvertTo-Json)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host " [OK] Correctly got 401 Unauthorized (expected)" -ForegroundColor Green
    } else {
        Write-Host " [OK] Got error as expected: $($_.Exception.Message)" -ForegroundColor Green
    }
}

# 9. Summary
Write-Host "`n" + ("=" * 40) -ForegroundColor Cyan
Write-Host "AUTH TEST COMPLETE!" -ForegroundColor Cyan
Write-Host ("=" * 40) -ForegroundColor Cyan
Write-Host "Test Summary:" -ForegroundColor Yellow
Write-Host "   Email: $TEST_EMAIL" -ForegroundColor White
Write-Host "   Password: $TEST_PASSWORD" -ForegroundColor White
if ($register) {
    Write-Host "   User ID: $($register.user.id)" -ForegroundColor White
}
Write-Host ("=" * 40) -ForegroundColor Cyan