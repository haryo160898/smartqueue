Add-Type -AssemblyName System.Drawing
$source = Join-Path $PSScriptRoot '..\public\brand-logo.png'
if (-not (Test-Path $source)) {
    Write-Error "Source image not found: $source"
    exit 1
}
$targetSizes = @{
    'logo.png' = [System.Drawing.Size]::new(320, 100)
    'icon-light-32x32.png' = [System.Drawing.Size]::new(32, 32)
    'icon-dark-32x32.png' = [System.Drawing.Size]::new(32, 32)
    'apple-icon.png' = [System.Drawing.Size]::new(180, 180)
}
$bmp = [System.Drawing.Image]::FromFile($source)
try {
    foreach ($name in $targetSizes.Keys) {
        $size = $targetSizes[$name]
        $out = New-Object System.Drawing.Bitmap $size.Width, $size.Height
        $g = [System.Drawing.Graphics]::FromImage($out)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.DrawImage($bmp, 0, 0, $size.Width, $size.Height)
        $dest = Join-Path $PSScriptRoot "..\public\$name"
        $out.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose()
        $out.Dispose()
    }
    Write-Host "Generated logo and icons from attached image."
} finally {
    $bmp.Dispose()
}
