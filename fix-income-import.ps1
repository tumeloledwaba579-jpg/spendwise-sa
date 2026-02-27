# fix-income-import.ps1 - Simplified version
$incomeFile = "C:\Users\tumel\spendwise-sa\app\api\v1\endpoints\income.py"

Write-Host "🔧 Fixing income.py imports..." -ForegroundColor Cyan

if (Test-Path $incomeFile) {
    # Create backup
    Copy-Item $incomeFile "$incomeFile.backup2" -Force
    Write-Host "✅ Backup created: $incomeFile.backup2" -ForegroundColor Green
    
    # Read the file
    $content = Get-Content $incomeFile -Raw
    
    # Simple replacement
    $newContent = $content -replace 'from app.api.deps import get_db, get_current_user', 'from app.api.deps import get_db'
    $newContent = $newContent -replace 'from app.api.deps import get_current_user', 'from app.api.v1.deps_cookie import get_current_user'
    
    # Add the new import if it doesn't exist
    if ($newContent -notmatch 'from app.api.v1.deps_cookie import get_current_user') {
        $newContent = $newContent -replace '(from app.api.deps import get_db)', "`$1`r`nfrom app.api.v1.deps_cookie import get_current_user"
    }
    
    # Save the file
    $newContent | Set-Content $incomeFile -Encoding UTF8 -Force
    
    Write-Host "✅ Updated imports in income.py" -ForegroundColor Green
    
    # Show the first few lines
    Write-Host "`n📋 First 10 lines of updated file:" -ForegroundColor Cyan
    Get-Content $incomeFile -TotalCount 10
}
else {
    Write-Host "❌ Income file not found at: $incomeFile" -ForegroundColor Red
}

Write-Host "`n🔄 Restart the server for changes to take effect." -ForegroundColor Cyan