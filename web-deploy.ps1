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

# 4. Fix JS file paths
Write-Host "Fixing JS file paths..." -ForegroundColor Yellow
$jsFile = Get-ChildItem "docs\_expo\static\js\web" -Filter "index-*.js" | Select-Object -First 1
if ($jsFile) {
    (Get-Content $jsFile.FullName) -replace '/Aqre/Aqre/assets/', '/Aqre/assets/' | Set-Content $jsFile.FullName
    (Get-Content $jsFile.FullName) -replace '/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/', '/Aqre/assets/' | Set-Content $jsFile.FullName
    (Get-Content $jsFile.FullName) -replace '/assets/assets/', '/Aqre/assets/' | Set-Content $jsFile.FullName
    (Get-Content $jsFile.FullName) -replace '/assets/', '/Aqre/assets/' | Set-Content $jsFile.FullName
}

# 5. Fix metadata.json
Write-Host "Fixing metadata.json..." -ForegroundColor Yellow
if (Test-Path "docs\metadata.json") {
    (Get-Content "docs\metadata.json") -replace 'assets\\node_modules\\@expo\\vector-icons\\build\\vendor\\react-native-vector-icons\\Fonts\\', 'Aqre\\assets\\' | Set-Content "docs\metadata.json"
    (Get-Content "docs\metadata.json") -replace 'assets\\', 'Aqre\\assets\\' | Set-Content "docs\metadata.json"
}

# 6. Fix index.html
Write-Host "Fixing index.html..." -ForegroundColor Yellow
if (Test-Path "docs\index.html") {
    (Get-Content "docs\index.html") -replace '/favicon.ico', '/Aqre/favicon.ico' | Set-Content "docs\index.html"
    (Get-Content "docs\index.html") -replace '/_expo/', '/Aqre/_expo/' | Set-Content "docs\index.html"
}

Write-Host "Web deployment complete!" -ForegroundColor Green
