# test-performance.ps1 - Performance testing suite (PowerShell 5.1 compatible)
$BASE_URL = "http://localhost:8000"
$TEST_EMAIL = "perf-test-$(Get-Random -Maximum 9999)@example.com"
$TEST_PASSWORD = "Test123!@#"
$TEST_NAME = "Performance Test User"

# Color definitions
$Colors = @{
    Cyan = "Cyan"
    Yellow = "Yellow"
    Green = "Green"
    Red = "Red"
    White = "White"
    Gray = "Gray"
    Magenta = "Magenta"
}

Write-Host "=== PERFORMANCE TEST SUITE ===" -ForegroundColor $Colors.Cyan
Write-Host ("=" * 60) -ForegroundColor $Colors.Cyan
Write-Host "Test Email: $TEST_EMAIL" -ForegroundColor $Colors.Yellow
Write-Host ("=" * 60) -ForegroundColor $Colors.Cyan

# Global session variable
$script:session = $null
$results = @{}

# Function to measure performance
function Measure-Performance {
    param(
        [string]$Name,
        [scriptblock]$Script,
        [int]$Iterations = 10
    )
    
    Write-Host "`n[TEST] $Name - $Iterations iterations" -ForegroundColor $Colors.Yellow
    
    $times = @()
    $successCount = 0
    $errorCount = 0
    
    for ($i = 1; $i -le $Iterations; $i++) {
        Write-Host "   Iteration $i/$Iterations" -NoNewline -ForegroundColor $Colors.Gray
        
        $start = Get-Date
        try {
            $result = & $Script
            $end = Get-Date
            $duration = ($end - $start).TotalMilliseconds
            $times += $duration
            $successCount++
            Write-Host " - $([math]::Round($duration, 2))ms" -ForegroundColor $Colors.Green
        } catch {
            $end = Get-Date
            $duration = ($end - $start).TotalMilliseconds
            $errorCount++
            Write-Host " - FAILED ($([math]::Round($duration, 2))ms)" -ForegroundColor $Colors.Red
        }
    }
    
    if ($times.Count -gt 0) {
        $avg = ($times | Measure-Object -Average).Average
        $min = ($times | Measure-Object -Minimum).Minimum
        $max = ($times | Measure-Object -Maximum).Maximum
        $median = ($times | Sort-Object)[[math]::Floor($times.Count/2)]
        
        # Calculate standard deviation
        $sumSquares = 0
        foreach ($t in $times) {
            $sumSquares += [math]::Pow($t - $avg, 2)
        }
        $stdDev = [math]::Sqrt($sumSquares / $times.Count)
        
        $results[$Name] = @{
            Avg = $avg
            Min = $min
            Max = $max
            Median = $median
            StdDev = $stdDev
            Success = $successCount
            Errors = $errorCount
            Iterations = $times.Count
        }
        
        Write-Host "   [OK] Avg: $([math]::Round($avg, 2))ms, Min: $([math]::Round($min, 2))ms, Max: $([math]::Round($max, 2))ms" -ForegroundColor $Colors.Green
        Write-Host "        Median: $([math]::Round($median, 2))ms, StdDev: $([math]::Round($stdDev, 2))ms" -ForegroundColor $Colors.Gray
        
        # Determine color for success count
        if ($successCount -eq $Iterations) {
            Write-Host "        Success: $successCount/$Iterations" -ForegroundColor $Colors.Green
        } else {
            Write-Host "        Success: $successCount/$Iterations" -ForegroundColor $Colors.Yellow
        }
    } else {
        $results[$Name] = @{
            Success = 0
            Errors = $errorCount
            Iterations = $Iterations
        }
        Write-Host "   [FAIL] No successful requests" -ForegroundColor $Colors.Red
    }
}

# First, check if server is running
Write-Host "`n[INFO] Checking server connection..." -ForegroundColor $Colors.Cyan
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/health" -TimeoutSec 5
    Write-Host "   [OK] Server is running (version: $($health.version))" -ForegroundColor $Colors.Green
} catch {
    Write-Host "   [FAIL] Cannot connect to server" -ForegroundColor $Colors.Red
    exit 1
}

Write-Host "`n" + ("=" * 60) -ForegroundColor $Colors.Cyan
Write-Host "PART 1: SETUP - Create Test User" -ForegroundColor $Colors.Cyan
Write-Host ("=" * 60) -ForegroundColor $Colors.Cyan

# 1. Register user
Write-Host "`n[SETUP] Registering test user..." -ForegroundColor $Colors.Yellow
$registerBody = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
    full_name = $TEST_NAME
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json" `
        -TimeoutSec 10
    
    Write-Host "   [OK] User registered: $($registerResponse.user.id)" -ForegroundColor $Colors.Green
    $userId = $registerResponse.user.id
} catch {
    Write-Host "   [WARN] User may already exist, continuing..." -ForegroundColor $Colors.Yellow
}

# 2. Login to get session
Write-Host "`n[SETUP] Logging in..." -ForegroundColor $Colors.Yellow
$loginBody = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
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
    Write-Host "   [OK] Login successful" -ForegroundColor $Colors.Green
    $script:session = $session
} catch {
    Write-Host "   [FAIL] Login failed: $_" -ForegroundColor $Colors.Red
    exit 1
}

# 3. Create test data
Write-Host "`n[SETUP] Creating test data..." -ForegroundColor $Colors.Yellow

# Create a test category
$categoryBody = @{
    name = "Performance Test Category"
    category_type = "EXPENSE"
    color = "#00C853"
    description = "Created for performance testing"
} | ConvertTo-Json

try {
    $categoryResponse = Invoke-RestMethod -Uri "$BASE_URL/api/v1/categories" `
        -Method Post `
        -Body $categoryBody `
        -ContentType "application/json" `
        -WebSession $script:session
    Write-Host "   [OK] Test category created: $($categoryResponse.id)" -ForegroundColor $Colors.Green
    $testCategoryId = $categoryResponse.id
} catch {
    Write-Host "   [WARN] Could not create category: $_" -ForegroundColor $Colors.Yellow
}

# Create a test account
$accountBody = @{
    name = "Performance Test Account"
    account_type = "CHECKING"
    currency = "ZAR"
    balance = 1000
    is_active = $true
} | ConvertTo-Json

try {
    $accountResponse = Invoke-RestMethod -Uri "$BASE_URL/api/v1/accounts" `
        -Method Post `
        -Body $accountBody `
        -ContentType "application/json" `
        -WebSession $script:session
    Write-Host "   [OK] Test account created: $($accountResponse.id)" -ForegroundColor $Colors.Green
    $testAccountId = $accountResponse.id
} catch {
    Write-Host "   [WARN] Could not create account: $_" -ForegroundColor $Colors.Yellow
}

Write-Host "`n" + ("=" * 60) -ForegroundColor $Colors.Cyan
Write-Host "PART 2: PERFORMANCE TESTS" -ForegroundColor $Colors.Cyan
Write-Host ("=" * 60) -ForegroundColor $Colors.Cyan

# Test 1: Health endpoint (public, no auth)
Measure-Performance -Name "Health Check" -Iterations 20 -Script {
    Invoke-RestMethod -Uri "$BASE_URL/health" -TimeoutSec 5
}

# Test 2: Auth test endpoint (public, no auth)
Measure-Performance -Name "Auth Test" -Iterations 20 -Script {
    Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/test" -TimeoutSec 5
}

# Test 3: Login performance
Measure-Performance -Name "Login" -Iterations 10 -Script {
    $loginBody = @{
        email = $TEST_EMAIL
        password = $TEST_PASSWORD
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -TimeoutSec 5
}

# Test 4: Get current user (authenticated)
Measure-Performance -Name "Get Current User" -Iterations 20 -Script {
    Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/me" `
        -Method Get `
        -WebSession $script:session `
        -TimeoutSec 5
}

# Test 5: Get accounts (authenticated)
Measure-Performance -Name "Get Accounts" -Iterations 20 -Script {
    Invoke-RestMethod -Uri "$BASE_URL/api/v1/accounts" `
        -Method Get `
        -WebSession $script:session `
        -TimeoutSec 5
}

# Test 6: Get categories (authenticated)
Measure-Performance -Name "Get Categories" -Iterations 20 -Script {
    Invoke-RestMethod -Uri "$BASE_URL/api/v1/categories" `
        -Method Get `
        -WebSession $script:session `
        -TimeoutSec 5
}

# Test 7: Get transactions (authenticated)
Measure-Performance -Name "Get Transactions" -Iterations 20 -Script {
    Invoke-RestMethod -Uri "$BASE_URL/api/v1/transactions?limit=10" `
        -Method Get `
        -WebSession $script:session `
        -TimeoutSec 5
}

# Test 8: Create expense (authenticated)
if ($testAccountId) {
    Measure-Performance -Name "Create Expense" -Iterations 10 -Script {
        $now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        $expenseBody = @{
            amount = -[math]::Round((Get-Random -Minimum 500 -Maximum 5000) / 100, 2)
            description = "Performance test expense"
            transaction_date = $now
            currency = "ZAR"
            is_recurring = $false
            account_id = $testAccountId
            category_id = $testCategoryId
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$BASE_URL/api/v1/transactions" `
            -Method Post `
            -Body $expenseBody `
            -ContentType "application/json" `
            -WebSession $script:session `
            -TimeoutSec 5
    }
}

# Test 9: Get income sources (authenticated)
Measure-Performance -Name "Get Income Sources" -Iterations 20 -Script {
    Invoke-RestMethod -Uri "$BASE_URL/api/v1/income/sources" `
        -Method Get `
        -WebSession $script:session `
        -TimeoutSec 5
}

# Test 10: Logout (authenticated)
Measure-Performance -Name "Logout" -Iterations 10 -Script {
    Invoke-RestMethod -Uri "$BASE_URL/api/v1/auth/logout" `
        -Method Post `
        -WebSession $script:session `
        -TimeoutSec 5
}

Write-Host "`n" + ("=" * 70) -ForegroundColor $Colors.Magenta
Write-Host "PERFORMANCE TEST RESULTS" -ForegroundColor $Colors.Magenta
Write-Host ("=" * 70) -ForegroundColor $Colors.Magenta

# Display results in a table format
Write-Host "`n{0,-25} {1,12} {2,12} {3,12} {4,12} {5,12}" -f "Endpoint", "Avg (ms)", "Min (ms)", "Max (ms)", "Median", "StdDev" -ForegroundColor $Colors.Cyan
Write-Host ("-" * 85) -ForegroundColor $Colors.Gray

$totalAvg = 0
$count = 0

foreach ($key in $results.Keys | Sort-Object) {
    $r = $results[$key]
    if ($r.ContainsKey('Avg')) {
        Write-Host ("{0,-25} {1,12:F2} {2,12:F2} {3,12:F2} {4,12:F2} {5,12:F2}" -f $key, $r.Avg, $r.Min, $r.Max, $r.Median, $r.StdDev)
        $totalAvg += $r.Avg
        $count++
    } else {
        Write-Host ("{0,-25} {1,12} {2,12} {3,12} {4,12} {5,12}" -f $key, "FAILED", "FAILED", "FAILED", "FAILED", "FAILED") -ForegroundColor $Colors.Red
    }
}

Write-Host ("-" * 85) -ForegroundColor $Colors.Gray

if ($count -gt 0) {
    $overallAvg = $totalAvg / $count
    Write-Host ("{0,-25} {1,12:F2} {2,12} {3,12} {4,12} {5,12}" -f "OVERALL AVERAGE", $overallAvg, "", "", "", "") -ForegroundColor $Colors.Magenta
}

# Grade the performance
Write-Host "`n" + ("=" * 70) -ForegroundColor $Colors.Magenta
Write-Host "PERFORMANCE GRADE" -ForegroundColor $Colors.Magenta
Write-Host ("=" * 70) -ForegroundColor $Colors.Magenta

$fastestEndpoint = $null
$slowestEndpoint = $null
$fastestTime = [double]::MaxValue
$slowestTime = [double]::MinValue

foreach ($key in $results.Keys) {
    $r = $results[$key]
    if ($r.ContainsKey('Avg')) {
        if ($r.Avg -lt $fastestTime) {
            $fastestTime = $r.Avg
            $fastestEndpoint = $key
        }
        if ($r.Avg -gt $slowestTime) {
            $slowestTime = $r.Avg
            $slowestEndpoint = $key
        }
    }
}

if ($fastestEndpoint) {
    Write-Host "Fastest endpoint: $fastestEndpoint - $([math]::Round($fastestTime, 2))ms" -ForegroundColor $Colors.Green
    Write-Host "Slowest endpoint: $slowestEndpoint - $([math]::Round($slowestTime, 2))ms" -ForegroundColor $Colors.Yellow
}

if ($count -gt 0) {
    if ($overallAvg -lt 50) {
        Write-Host "`nOverall Performance: EXCELLENT (avg < 50ms)" -ForegroundColor $Colors.Green
    } elseif ($overallAvg -lt 100) {
        Write-Host "`nOverall Performance: GOOD (avg < 100ms)" -ForegroundColor $Colors.Green
    } elseif ($overallAvg -lt 200) {
        Write-Host "`nOverall Performance: ACCEPTABLE (avg < 200ms)" -ForegroundColor $Colors.Yellow
    } elseif ($overallAvg -lt 500) {
        Write-Host "`nOverall Performance: SLOW (avg > 200ms)" -ForegroundColor $Colors.Red
    } else {
        Write-Host "`nOverall Performance: VERY SLOW (avg > 500ms)" -ForegroundColor $Colors.Red
    }
}

Write-Host "`n" + ("=" * 70) -ForegroundColor $Colors.Magenta
Write-Host "PERFORMANCE TEST COMPLETE!" -ForegroundColor $Colors.Magenta
Write-Host ("=" * 70) -ForegroundColor $Colors.Magenta

# Optional: Save results to file
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$results | ConvertTo-Json -Depth 3 | Out-File "performance-results-$timestamp.json"
Write-Host "`nResults saved to: performance-results-$timestamp.json" -ForegroundColor $Colors.Gray