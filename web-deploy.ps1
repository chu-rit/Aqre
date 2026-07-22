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

# 4. Copy font files to assets root with original names (gitignore prevents node_modules from being committed)
Write-Host "Copying font files to assets root..." -ForegroundColor Yellow
$fontsDir = "docs\assets\node_modules\@expo\vector-icons\build\vendor\react-native-vector-icons\Fonts"
if (Test-Path $fontsDir) {
    Get-ChildItem $fontsDir -Filter "*.ttf" | ForEach-Object { Copy-Item $_.FullName "docs\assets\" -Force }
}
# Also copy hash-named font files to named versions for JS references
$hashFiles = @{
    'b4eb097d35f44ed943676fd56f6bdc51' = 'Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf'
    '3f78af31cca60105799838a1a7a59fbd' = 'AntDesign.3f78af31cca60105799838a1a7a59fbd.ttf'
    '31b5ffea3daddc69dd01a1f3d6cf63c5' = 'Entypo.31b5ffea3daddc69dd01a1f3d6cf63c5.ttf'
    '140c53a7643ea949007aa9a282153849' = 'EvilIcons.140c53a7643ea949007aa9a282153849.ttf'
    'ca4b48e04dc1ce10bfbddb262c8b835f' = 'Feather.ca4b48e04dc1ce10bfbddb262c8b835f.ttf'
    'b06871f281fee6b241d60582ae9369b9' = 'FontAwesome.b06871f281fee6b241d60582ae9369b9.ttf'
    '3b89dd103490708d19a95adcae52210e' = 'FontAwesome5_Brands.3b89dd103490708d19a95adcae52210e.ttf'
    '1f77739ca9ff2188b539c36f30ffa2be' = 'FontAwesome5_Regular.1f77739ca9ff2188b539c36f30ffa2be.ttf'
    '605ed7926cf39a2ad5ec2d1f9d391d3d' = 'FontAwesome5_Solid.605ed7926cf39a2ad5ec2d1f9d391d3d.ttf'
    '56c8d80832e37783f12c05db7c8849e2' = 'FontAwesome6_Brands.56c8d80832e37783f12c05db7c8849e2.ttf'
    '370dd5af19f8364907b6e2c41f45dbbf' = 'FontAwesome6_Regular.370dd5af19f8364907b6e2c41f45dbbf.ttf'
    'adec7d6f310bc577f05e8fe06a5daccf' = 'FontAwesome6_Solid.adec7d6f310bc577f05e8fe06a5daccf.ttf'
    'b49ae8ab2dbccb02c4d11caaacf09eab' = 'Fontisto.b49ae8ab2dbccb02c4d11caaacf09eab.ttf'
    'e20945d7c929279ef7a6f1db184a4470' = 'Foundation.e20945d7c929279ef7a6f1db184a4470.ttf'
    '4e85bc9ebe07e0340c9c4fc2f6c38908' = 'MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf'
    '6e435534bd35da5fef04168860a9b8fa' = 'MaterialCommunityIcons.6e435534bd35da5fef04168860a9b8fa.ttf'
    '871378c6eab492a3e689a9385dc45a12' = 'Octicons.871378c6eab492a3e689a9385dc45a12.ttf'
    'd2285965fe34b05465047401b8595dd0' = 'SimpleLineIcons.d2285965fe34b05465047401b8595dd0.ttf'
    '1681f34aaca71b8dfb70756bca331eb2' = 'Zocial.1681f34aaca71b8dfb70756bca331eb2.ttf'
}
$hashFiles.GetEnumerator() | ForEach-Object {
    $src = "docs\assets\$($_.Key)"
    $dst = "docs\assets\$($_.Value)"
    if (Test-Path $src) { Copy-Item $src $dst -Force }
}

# 5. Fix JS file paths (add /Aqre prefix)
Write-Host "Fixing JS file paths..." -ForegroundColor Yellow
$jsFile = Get-ChildItem "docs\_expo\static\js\web" -Filter "index-*.js" | Select-Object -First 1
if ($jsFile) {
    (Get-Content $jsFile.FullName) -replace '/assets/assets/', '/Aqre/assets/' | Set-Content $jsFile.FullName
    (Get-Content $jsFile.FullName) -replace '(?<!/Aqre)/assets/', '/Aqre/assets/' | Set-Content $jsFile.FullName
    (Get-Content $jsFile.FullName) -replace '/Aqre/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/', '/Aqre/assets/' | Set-Content $jsFile.FullName
}

# 5. Fix metadata.json (no /Aqre prefix needed)
Write-Host "Fixing metadata.json..." -ForegroundColor Yellow
if (Test-Path "docs\metadata.json") {
    (Get-Content "docs\metadata.json") -replace 'assets\\node_modules\\@expo\\vector-icons\\build\\vendor\\react-native-vector-icons\\Fonts\\', 'assets\\' | Set-Content "docs\metadata.json"
}

Copy-Item "aqreRN\assets\icon.png" "docs\icon.png" -Force
@'
{
  "name": "AQRE",
  "short_name": "AQRE",
  "start_url": "/Aqre/",
  "scope": "/Aqre/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    {
      "src": "/Aqre/icon.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
'@ | Set-Content "docs\manifest.webmanifest"

Write-Host "Fixing index.html..." -ForegroundColor Yellow
if (Test-Path "docs\index.html") {
    (Get-Content "docs\index.html") -replace '<link rel="icon" href="/favicon.ico" />', '<link rel="icon" href="/Aqre/icon.png" /><link rel="apple-touch-icon" href="/Aqre/icon.png" /><link rel="manifest" href="/Aqre/manifest.webmanifest" />' | Set-Content "docs\index.html"
    (Get-Content "docs\index.html") -replace '/_expo/', '/Aqre/_expo/' | Set-Content "docs\index.html"
}

Write-Host "Web deployment complete!" -ForegroundColor Green
