@echo off
title WAFinity - Local ModSecurity OWASP CRS
echo ========================================================
echo    WAFinity - Local ModSecurity (OWASP CRS) Docker
echo ========================================================
echo.

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker was not found in your PATH.
    echo Please make sure Docker Desktop is installed and started:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

echo Stopping any existing ModSecurity container...
docker stop wafinity-modsecurity >nul 2>nul
docker rm wafinity-modsecurity >nul 2>nul

echo Starting ModSecurity container on port 8080...
echo - Image: owasp/modsecurity-crs:apache
echo - Paranoia Level: 2
echo - Backend: http://httpbin.org
echo.

docker run -d --name wafinity-modsecurity -p 8080:80 -e PARANOIA=2 -e BACKEND=http://httpbin.org owasp/modsecurity-crs:apache

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start container. Is Docker Desktop running?
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo   ModSecurity WAF is successfully running!
echo ========================================================
echo Target URL for WAFinity: http://localhost:8080
echo.
echo To view live WAF block logs: docker logs -f wafinity-modsecurity
echo To stop container:           docker stop wafinity-modsecurity
echo.
pause
