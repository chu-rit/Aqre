# Web Deploy Script

Write-Host "Starting web deployment..." -ForegroundColor Green

# 1. Build
Write-Host "Building..." -ForegroundColor Yellow
Set-Location aqreRN
npx expo export --output-dir ../docs
Set-Location ..

# 2. Create .nojekyll
Write-Host "Creating .nojekyll..." -ForegroundColor Yellow
New-Item -Path "docs\.nojekyll" -ItemType File -Force | Out-Null

# 3. Fix assets structure
Write-Host "Fixing assets structure..." -ForegroundColor Yellow
if (Test-Path "docs\assets\assets") {
    Move-Item -Path "docs\assets\assets\*" -Destination "docs\assets" -Force
    Remove-Item -Path "docs\assets\assets" -Force
}

# 4. Fix JS file paths (no /Aqre prefix needed)
Write-Host "Fixing JS file paths..." -ForegroundColor Yellow
$jsFile = Get-ChildItem "docs\_expo\static\js\web" -Filter "index-*.js" | Select-Object -First 1
if ($jsFile) {
    (Get-Content $jsFile.FullName) -replace '/Aqre/Aqre/assets/', '/assets/' | Set-Content $jsFile.FullName
    (Get-Content $jsFile.FullName) -replace '/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/', '/assets/' | Set-Content $jsFile.FullName
    (Get-Content $jsFile.FullName) -replace '/assets/assets/', '/assets/' | Set-Content $jsFile.FullName
}

# 5. Fix metadata.json (no /Aqre prefix needed)
Write-Host "Fixing metadata.json..." -ForegroundColor Yellow
if (Test-Path "docs\metadata.json") {
    (Get-Content "docs\metadata.json") -replace 'assets\\node_modules\\@expo\\vector-icons\\build\\vendor\\react-native-vector-icons\\Fonts\\', 'assets\\' | Set-Content "docs\metadata.json"
}

# 6. Fix index.html (no /Aqre prefix needed)
Write-Host "Fixing index.html..." -ForegroundColor Yellow
if (Test-Path "docs\index.html") {
    (Get-Content "docs\index.html") -replace '/Aqre/favicon.ico', '/favicon.ico' | Set-Content "docs\index.html"
    (Get-Content "docs\index.html") -replace '/Aqre/_expo/', '/_expo/' | Set-Content "docs\index.html"
}

# 7. Remove Aqre folder if exists
Write-Host "Removing Aqre folder if exists..." -ForegroundColor Yellow
if (Test-Path "docs\Aqre") { Remove-Item -Path "docs\Aqre" -Recurse -Force }

Write-Host "Web deployment complete!" -ForegroundColor Green
