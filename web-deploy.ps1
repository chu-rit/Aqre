# 웹 포팅 자동화 스크립트

Write-Host "웹 포팅 시작..." -ForegroundColor Green

# 1. 빌드 (바로 docs 폴더에 생성)
Write-Host "빌드 중..." -ForegroundColor Yellow
Set-Location aqreRN
npx expo export --output-dir ../docs
Set-Location ..

# 2. .nojekyll 파일 생성
Write-Host ".nojekyll 파일 생성..." -ForegroundColor Yellow
New-Item -Path "docs\.nojekyll" -ItemType File -Force | Out-Null

# 3. assets 중복 구조 수정
Write-Host "assets 중복 구조 수정..." -ForegroundColor Yellow
if (Test-Path "docs\assets\assets") {
    Move-Item -Path "docs\assets\assets\*" -Destination "docs\assets" -Force
    Remove-Item -Path "docs\assets\assets" -Force
}

# 4. JS 파일 경로 수정
Write-Host "JS 파일 경로 수정..." -ForegroundColor Yellow
$jsFile = Get-ChildItem "docs\_expo\static\js\web" -Filter "index-*.js" | Select-Object -First 1
if ($jsFile) {
    (Get-Content $jsFile.FullName) -replace '/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/', '/Aqre/assets/' | Set-Content $jsFile.FullName
    (Get-Content $jsFile.FullName) -replace '/assets/assets/', '/Aqre/assets/' | Set-Content $jsFile.FullName
    (Get-Content $jsFile.FullName) -replace '/assets/', '/Aqre/assets/' | Set-Content $jsFile.FullName
}

# 5. metadata.json 경로 수정
Write-Host "metadata.json 경로 수정..." -ForegroundColor Yellow
if (Test-Path "docs\metadata.json") {
    (Get-Content "docs\metadata.json") -replace 'assets\\node_modules\\@expo\\vector-icons\\build\\vendor\\react-native-vector-icons\\Fonts\\', 'Aqre\\assets\\' | Set-Content "docs\metadata.json"
    (Get-Content "docs\metadata.json") -replace 'assets\\', 'Aqre\\assets\\' | Set-Content "docs\metadata.json"
}

# 6. index.html 경로 수정
Write-Host "index.html 경로 수정..." -ForegroundColor Yellow
if (Test-Path "docs\index.html") {
    (Get-Content "docs\index.html") -replace '/favicon.ico', '/Aqre/favicon.ico' | Set-Content "docs\index.html"
    (Get-Content "docs\index.html") -replace '/_expo/', '/Aqre/_expo/' | Set-Content "docs\index.html"
}

Write-Host "웹 포팅 완료!" -ForegroundColor Green
