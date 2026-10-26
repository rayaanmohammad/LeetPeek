$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$outputRoot = Join-Path $projectRoot 'dist'
$expectedParent = [System.IO.Path]::GetFullPath($outputRoot).TrimEnd('\', '/')

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

foreach ($browser in @('firefox', 'chrome')) {
  $packageRoot = Join-Path $outputRoot $browser
  $actualParent = [System.IO.Path]::GetDirectoryName([System.IO.Path]::GetFullPath($packageRoot)).TrimEnd('\', '/')
  if ($actualParent -ne $expectedParent) { throw 'Package path is outside dist.' }

  if (Test-Path -LiteralPath $packageRoot) {
    Remove-Item -LiteralPath $packageRoot -Recurse -Force
  }
  New-Item -ItemType Directory -Path (Join-Path $packageRoot 'icons') -Force | Out-Null

  foreach ($file in @('background.js', 'popup.html', 'popup.js', 'style.css')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination $packageRoot
  }
  Copy-Item -Path (Join-Path $projectRoot 'icons\*.png') -Destination (Join-Path $packageRoot 'icons')

  Copy-Item -LiteralPath (Join-Path $projectRoot "manifest.$browser.json") -Destination (Join-Path $packageRoot 'manifest.json')

  $zipPath = Join-Path $outputRoot "leetpeek-$browser.zip"
  $zipStream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::Create)
  $archive = [System.IO.Compression.ZipArchive]::new($zipStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
  try {
    foreach ($file in (Get-ChildItem -LiteralPath $packageRoot -File -Recurse)) {
      $entryName = $file.FullName.Substring($packageRoot.Length + 1).Replace('\', '/')
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $entryName) | Out-Null
    }
  } finally {
    $archive.Dispose()
    $zipStream.Dispose()
  }

  Write-Host "Built $browser package at $zipPath"
}
