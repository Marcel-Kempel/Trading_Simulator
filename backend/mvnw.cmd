@REM Maven Wrapper script for Windows
@echo off
setlocal

set MAVEN_PROJECTBASEDIR=%~dp0
set MAVEN_CMD=mvn

where mvn >nul 2>&1
if %ERRORLEVEL% equ 0 (
    %MAVEN_CMD% %*
) else (
    echo Maven not found. Please install Maven 3.9+ or Java 17+ and run:
    echo   mvn spring-boot:run
    echo.
    echo Or install Maven via: https://maven.apache.org/download.cgi
    exit /b 1
)

endlocal
