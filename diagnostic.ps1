# diagnostic.ps1 - Fixed version with proper timeouts
Write-Host "=== SPENDWISE API DIAGNOSTIC TOOL ===" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

# Function to test endpoint with retry
function Test-EndpointWithRetry {
    param(
        [string]$Uri,
        [int]$TimeoutSeconds = 5,  # Increased from 2 to 5
        [int]$Retries = 2
    )
    
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            $response = Invoke-RestMethod -Uri $Uri -TimeoutSec $TimeoutSeconds -ErrorAction Stop
            return @{Success = $true; Response = $response}
        } catch {
            if ($i -eq $Retries) {
                return @{Success = $false; Error = $_.Exception.Message}
            }
            Write-Host "   Retry $i/$Retries..." -ForegroundColor Gray
            Start-Sleep -Milliseconds 500
        }
    }
}

# 1. Check if server is running
Write-Host "`n[1] Checking server status..." -ForegroundColor Yellow
$result = Test-EndpointWithRetry -Uri "http://localhost:8000/health" -TimeoutSeconds 5 -Retries 2

if ($result.Success) {
    Write-Host " [OK] Server is running!" -ForegroundColor Green
    Write-Host "       Version: $($result.Response.version)" -ForegroundColor White
    Write-Host "       Status: $($result.Response.status)" -ForegroundColor White
} else {
    Write-Host " [FAIL] Server not responding!" -ForegroundColor Red
    Write-Host "       Error: $($result.Error)" -ForegroundColor Yellow
    Write-Host "       Run: uvicorn app.main:app --reload" -ForegroundColor White
    exit 1
}

# 2. Test auth test endpoint
Write-Host "`n[2] Testing auth endpoint..." -ForegroundColor Yellow
$authResult = Test-EndpointWithRetry -Uri "http://localhost:8000/api/v1/auth/test" -TimeoutSeconds 5 -Retries 2

if ($authResult.Success) {
    Write-Host " [OK] Auth endpoint working!" -ForegroundColor Green
    Write-Host "       Response: $($authResult.Response.message)" -ForegroundColor White
} else {
    Write-Host " [WARN] Auth endpoint not responding" -ForegroundColor Yellow
    Write-Host "       Error: $($authResult.Error)" -ForegroundColor Gray
}

# 3. Check Python version
Write-Host "`n[3] Python version:" -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
Write-Host "       $pythonVersion" -ForegroundColor White

# 4. Check key packages
Write-Host "`n[4] Package versions:" -ForegroundColor Yellow
$packages = @("fastapi", "pydantic", "sqlalchemy", "uvicorn")

foreach ($pkg in $packages) {
    $version = pip show $pkg 2>$null | Select-String "Version"
    if ($version) {
        Write-Host "   [OK] $pkg $($version)" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] $pkg not found" -ForegroundColor Red
    }
}

# 5. Check for duplicate Python files
Write-Host "`n[5] Checking for duplicate files..." -ForegroundColor Yellow
if (Test-Path ".\app") {
    $duplicates = Get-ChildItem -Path .\app -Recurse -Filter "*.py" -ErrorAction SilentlyContinue | 
        Group-Object Name | 
        Where-Object { $_.Count -gt 1 }

    if ($duplicates) {
        Write-Host " [WARN] Duplicate files found:" -ForegroundColor Yellow
        $duplicates | ForEach-Object {
            Write-Host "       File: $($_.Name) (x$($_.Count))" -ForegroundColor Red
            $_.Group | ForEach-Object { Write-Host "         - $($_.Directory)" }
        }
    } else {
        Write-Host " [OK] No duplicate files" -ForegroundColor Green
    }
} else {
    Write-Host " [WARN] Not in project root? Current dir: $(Get-Location)" -ForegroundColor Yellow
}

# 6. Check registered routes via OpenAPI
Write-Host "`n[6] Checking registered routes..." -ForegroundColor Yellow
$routes = Test-EndpointWithRetry -Uri "http://localhost:8000/openapi.json" -TimeoutSeconds 5 -Retries 2

if ($routes.Success) {
    $pathCount = ($routes.Response.paths.PSObject.Properties).Count
    Write-Host " [OK] Found $pathCount registered routes" -ForegroundColor Green
    
    # Show auth routes specifically
    $authRoutes = @()
    foreach ($path in $routes.Response.paths.PSObject.Properties) {
        if ($path.Name -like "*auth*") {
            $authRoutes += $path.Name
        }
    }
    
    if ($authRoutes.Count -gt 0) {
        Write-Host "       Auth routes:" -ForegroundColor Yellow
        $authRoutes | ForEach-Object { Write-Host "         - $_" }
    } else {
        Write-Host "       [WARN] No auth routes found" -ForegroundColor Yellow
    }
} else {
    Write-Host " [WARN] Could not fetch OpenAPI spec: $($routes.Error)" -ForegroundColor Yellow
}

# 7. System info
Write-Host "`n[7] System Info:" -ForegroundColor Yellow
Write-Host "       Directory: $(Get-Location)" -ForegroundColor White
Write-Host "       PowerShell: $($PSVersionTable.PSVersion)" -ForegroundColor White
try {
    $osInfo = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
    Write-Host "       OS: $($osInfo.Caption)" -ForegroundColor White
} catch {
    Write-Host "       OS: Windows (details unavailable)" -ForegroundColor White
}

# 8. Test PostgreSQL connection via Docker
Write-Host "`n[8] Checking PostgreSQL..." -ForegroundColor Yellow
$pgCheck = docker ps --filter "name=postgres" --format "{{.Names}}" 2>$null | Select-String "postgres"
if ($pgCheck) {
    Write-Host " [OK] PostgreSQL container is running" -ForegroundColor Green
} else {
    Write-Host " [WARN] PostgreSQL container not found" -ForegroundColor Yellow
    Write-Host "       Run: docker-compose up -d postgres" -ForegroundColor White
}

# 9. Test Redis connection via Docker
Write-Host "`n[9] Checking Redis..." -ForegroundColor Yellow
$redisCheck = docker ps --filter "name=redis" --format "{{.Names}}" 2>$null | Select-String "redis"
if ($redisCheck) {
    Write-Host " [OK] Redis container is running" -ForegroundColor Green
} else {
    Write-Host " [WARN] Redis container not found" -ForegroundColor Yellow
    Write-Host "       Run: docker-compose up -d redis" -ForegroundColor White
}

Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "DIAGNOSTIC COMPLETE!" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

# Quick summary
Write-Host "`n=== QUICK SUMMARY ===" -ForegroundColor Magenta
Write-Host "   [OK] Server: Running" -ForegroundColor Green
if ($authResult.Success) { 
    Write-Host "   [OK] Auth: Working" -ForegroundColor Green 
} else { 
    Write-Host "   [WARN] Auth: Not responding" -ForegroundColor Yellow 
}
if ($pgCheck) { 
    Write-Host "   [OK] PostgreSQL: Running" -ForegroundColor Green 
} else { 
    Write-Host "   [WARN] PostgreSQL: Not found" -ForegroundColor Yellow 
}
if ($redisCheck) { 
    Write-Host "   [OK] Redis: Running" -ForegroundColor Green 
} else { 
    Write-Host "   [WARN] Redis: Not found" -ForegroundColor Yellow 
}