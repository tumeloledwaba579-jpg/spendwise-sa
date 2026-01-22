# ============================================
# FastAPI Project Structure Analyzer
# Analyzes router files and their integration in app/main.py
# ============================================

# Configuration
$ProjectRoot = Get-Location
$EndpointsDir = Join-Path $ProjectRoot "app/api/v1/endpoints"
$MainPyPath = Join-Path $ProjectRoot "app/main.py"

# Output styling
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"
$ColorInfo = "Cyan"
$ColorDetail = "Gray"

function Write-Info($message) { Write-Host $message -ForegroundColor $ColorInfo }
function Write-Success($message) { Write-Host $message -ForegroundColor $ColorSuccess }
function Write-Warning($message) { Write-Host $message -ForegroundColor $ColorWarning }
function Write-Error($message) { Write-Host $message -ForegroundColor $ColorError }
function Write-Detail($message) { Write-Host "  $message" -ForegroundColor $ColorDetail }

Write-Info "FastAPI Project Structure Analysis"
Write-Info "====================================="
Write-Host "Project Root: $ProjectRoot" -ForegroundColor White
Write-Host ""

# -----------------------------------------------------------------
# 1. Validate Directory Structure
# -----------------------------------------------------------------
Write-Info "1. Validating Directory Structure..."
if (-not (Test-Path $EndpointsDir)) {
    Write-Error "  [ERROR] Directory not found: $EndpointsDir"
    exit 1
}
Write-Success "  [OK] Endpoints directory exists: $EndpointsDir"

if (-not (Test-Path $MainPyPath)) {
    Write-Error "  [ERROR] Main application file not found: $MainPyPath"
    exit 1
}
Write-Success "  [OK] Main application file exists: $MainPyPath"
Write-Host ""

# -----------------------------------------------------------------
# 2. Discover Router Files
# -----------------------------------------------------------------
Write-Info "2. Discovering Router Files in $EndpointsDir"
$routerFiles = Get-ChildItem -Path $EndpointsDir -Filter "*.py" -File | Sort-Object Name
if (-not $routerFiles) {
    Write-Warning "  [WARN] No Python files found in endpoints directory"
} else {
    Write-Success "  [OK] Found $($routerFiles.Count) Python file(s)"
    $routerFiles | ForEach-Object { Write-Detail "$($_.Name)" }
}
Write-Host ""

# -----------------------------------------------------------------
# 3. Analyze Each Router File
# -----------------------------------------------------------------
Write-Info "3. Analyzing Router Files for APIRouter Definitions"
$foundRouters = @()

foreach ($file in $routerFiles) {
    Write-Host "  [FILE] $($file.Name)" -ForegroundColor Yellow
    Write-Host "  " + ("-" * ($file.Name.Length + 10)) -ForegroundColor DarkGray
    
    $content = Get-Content $file.FullName -Raw
    $lines = Get-Content $file.FullName
    
    # Check for APIRouter instantiation
    $routerPattern = 'router\s*=\s*(?:APIRouter|Router)\([^)]*\)'
    $routerMatch = [regex]::Match($content, $routerPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    
    if ($routerMatch.Success) {
        $routerVarName = "router"
        Write-Success "    [OK] APIRouter found: $($routerMatch.Value.Trim())"
        $foundRouters += @{Name=$file.BaseName; File=$file.FullName; RouterVar=$routerVarName}
    } else {
        Write-Warning "    [WARN] No APIRouter instantiation found (may use different variable name)"
    }
    
    # Find all endpoint decorators
    $decoratorPattern = '@router\.(get|post|put|delete|patch|head|options|trace|websocket)\(["'']([^"'']+)["'']'
    $decoratorMatches = [regex]::Matches($content, $decoratorPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    
    if ($decoratorMatches.Count -gt 0) {
        Write-Success "    [OK] Found $($decoratorMatches.Count) endpoint(s)"
        foreach ($match in $decoratorMatches) {
            $method = $match.Groups[1].Value.ToUpper()
            $path = $match.Groups[2].Value
            Write-Detail "      $method $path"
        }
    } else {
        Write-Warning "    [WARN] No endpoint decorators found (@router.get, @router.post, etc.)"
    }
    
    # Check for imports of APIRouter
    $importPattern = 'from fastapi import.*APIRouter|import.*fastapi.*APIRouter'
    $importMatches = [regex]::Matches($content, $importPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($importMatches.Count -eq 0) {
        Write-Warning "    [WARN] No APIRouter import found (router may not be defined)"
    }
    
    Write-Host ""
}

# -----------------------------------------------------------------
# 4. Analyze app/main.py for Router Integration
# -----------------------------------------------------------------
Write-Info "4. Analyzing app/main.py for Router Integration"
$mainContent = Get-Content $MainPyPath -Raw

# Find all include_router calls
$includePattern = 'include_router\(([^)]+)\)'
$includeMatches = [regex]::Matches($mainContent, $includePattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

Write-Success "  [OK] Found $($includeMatches.Count) include_router() call(s)"
$includedRouters = @()

foreach ($match in $includeMatches) {
    $line = $match.Value
    Write-Detail "$line"
    
    # Extract router variable name
    if ($line -match 'include_router\((\w+)\.router\)') {
        $routerModule = $matches[1]
        $includedRouters += $routerModule
    }
}

# Find all imports from app.api.v1.endpoints
$importPattern = 'from app\.api\.v1\.endpoints import (.+)'
$importMatch = [regex]::Match($mainContent, $importPattern)
$importedModules = @()

if ($importMatch.Success) {
    $importList = $importMatch.Groups[1].Value -replace '\s', ''
    $importedModules = $importList.Split(',')
    Write-Success "  [OK] Imported modules: $importList"
} else {
    Write-Warning "  [WARN] No import found from 'app.api.v1.endpoints'"
}
Write-Host ""

# -----------------------------------------------------------------
# 5. Cross-Validation and Recommendations
# -----------------------------------------------------------------
Write-Info "5. Cross-Validation and Recommendations"
Write-Host ""

# Check for missing router files (imported but not found)
$importedButMissing = @()
foreach ($module in $importedModules) {
    $filePath = Join-Path $EndpointsDir "$module.py"
    if (-not (Test-Path $filePath)) {
        $importedButMissing += $module
    }
}

if ($importedButMissing.Count -gt 0) {
    Write-Error "  [ERROR] CRITICAL ISSUE: These modules are imported in main.py but files don't exist:"
    foreach ($module in $importedButMissing) {
        Write-Error "      - $module.py"
    }
    Write-Host ""
}

# Check for router files not imported
$foundButNotImported = @()
foreach ($router in $foundRouters) {
    if ($router.Name -notin $importedModules) {
        $foundButNotImported += $router.Name
    }
}

if ($foundButNotImported.Count -gt 0) {
    Write-Warning "  [WARN] These router files exist but are not imported in main.py:"
    foreach ($module in $foundButNotImported) {
        Write-Warning "      - $module.py"
    }
    Write-Host ""
}

# Check for imported but not included in include_router
$importedButNotIncluded = @()
foreach ($module in $importedModules) {
    if ($module -notin $includedRouters) {
        $importedButNotIncluded += $module
    }
}

if ($importedButNotIncluded.Count -gt 0) {
    Write-Warning "  [WARN] These modules are imported but not included via include_router():"
    foreach ($module in $importedButNotIncluded) {
        Write-Warning "      - $module"
    }
    Write-Host ""
}

# -----------------------------------------------------------------
# 6. Summary Report
# -----------------------------------------------------------------
Write-Info "6. Summary Report"
Write-Host "================="

$totalIssues = $importedButMissing.Count + $foundButNotImported.Count + $importedButNotIncluded.Count

if ($totalIssues -eq 0) {
    Write-Success "  [OK] All router files are properly imported and included!"
} else {
    Write-Warning "  [WARN] Found $totalIssues issue(s) that need attention"
}

Write-Host ""
Write-Info "File Structure Snapshot:"
Write-Host "  - Router files discovered: $($foundRouters.Count)" -ForegroundColor White
Write-Host "  - Modules imported in main.py: $($importedModules.Count)" -ForegroundColor White
Write-Host "  - include_router() calls: $($includeMatches.Count)" -ForegroundColor White
Write-Host ""

# -----------------------------------------------------------------
# 7. Suggested Corrective Actions
# -----------------------------------------------------------------
if ($totalIssues -gt 0) {
    Write-Info "7. Suggested Corrective Actions"
    Write-Host "================================"
    
    if ($importedButMissing.Count -gt 0) {
        Write-Host "  To fix missing router files:" -ForegroundColor White
        Write-Host "  1. Either create the missing files in app/api/v1/endpoints/" -ForegroundColor Gray
        Write-Host "  2. Or remove the import from app/main.py for: $($importedButMissing -join ', ')" -ForegroundColor Gray
        Write-Host ""
    }
    
    if ($foundButNotImported.Count -gt 0) {
        Write-Host "  To import existing router files:" -ForegroundColor White
        Write-Host "  1. Add the missing imports to app/main.py:" -ForegroundColor Gray
        Write-Host "     from app.api.v1.endpoints import $($foundButNotImported -join ', ')" -ForegroundColor DarkGray
        Write-Host "  2. Then add include_router() calls for each" -ForegroundColor Gray
        Write-Host ""
    }
    
    if ($importedButNotIncluded.Count -gt 0) {
        Write-Host "  To include imported routers:" -ForegroundColor White
        Write-Host "  1. Add include_router() calls in app/main.py:" -ForegroundColor Gray
        foreach ($module in $importedButNotIncluded) {
            Write-Host "     app.include_router($($module).router, prefix=`"/api/v1/$($module)`", tags=[`"$($module)`"])" -ForegroundColor DarkGray
        }
    }
}

# -----------------------------------------------------------------
# 8. Quick Test of Available Endpoints
# -----------------------------------------------------------------
Write-Host ""
Write-Info "8. Quick Endpoint Availability Test"
Write-Host "===================================="
Write-Host "Note: This requires your FastAPI server to be running on http://localhost:8000" -ForegroundColor Yellow

$testEndpoints = @(
    @{Method="GET"; Path="/docs"},
    @{Method="GET"; Path="/openapi.json"},
    @{Method="GET"; Path="/health"}
)

# Add base paths for found routers
foreach ($router in $foundRouters) {
    $testEndpoints += @{Method="GET"; Path="/api/v1/$($router.Name)"}
    $testEndpoints += @{Method="GET"; Path="/api/v1/$($router.Name)/"}
}

foreach ($endpoint in $testEndpoints) {
    $url = "http://localhost:8000$($endpoint.Path)"
    try {
        $response = Invoke-WebRequest -Uri $url -Method $endpoint.Method -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        Write-Success "  [OK] $($endpoint.Method) $($endpoint.Path) - $($response.StatusCode)"
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "TIMEOUT/ERROR" }
        if ($statusCode -eq 404) {
            Write-Detail "  [404] $($endpoint.Method) $($endpoint.Path) - 404 (Not Found)"
        } else {
            Write-Warning "  [WARN] $($endpoint.Method) $($endpoint.Path) - $statusCode"
        }
    }
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Success "Analysis complete! Review the findings above to ensure your FastAPI application is correctly structured."