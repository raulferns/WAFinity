# WAFinity - Local ModSecurity (OWASP CRS) Docker Starter

Write-Host "========================================================" -ForegroundColor Magenta
Write-Host "   WAFinity - Local ModSecurity (OWASP CRS) Docker     " -ForegroundColor White -NoNewline
Write-Host ""
Write-Host "========================================================" -ForegroundColor Magenta

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker is not installed or not in your PATH." -ForegroundColor Red
    Write-Host "Please start or install Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

Write-Host "[*] Stopping any existing wafinity-modsecurity container..." -ForegroundColor Cyan
docker stop wafinity-modsecurity 2>$null | Out-Null
docker rm wafinity-modsecurity 2>$null | Out-Null

Write-Host "[*] Launching owasp/modsecurity-crs on port 8080..." -ForegroundColor Cyan
docker run -d --name wafinity-modsecurity -p 8080:80 -e PARANOIA=2 -e BACKEND=http://httpbin.org owasp/modsecurity-crs:apache

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✔ ModSecurity OWASP CRS is LIVE!" -ForegroundColor Green
    Write-Host "👉 Target URL for WAFinity: " -NoNewline
    Write-Host "http://localhost:8080" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor DarkGray
    Write-Host "  docker logs -f wafinity-modsecurity   # Live attack logs" -ForegroundColor DarkGray
    Write-Host "  docker stop wafinity-modsecurity      # Stop container" -ForegroundColor DarkGray
} else {
    Write-Host "[ERROR] Failed to start Docker container. Check Docker Desktop status." -ForegroundColor Red
}
