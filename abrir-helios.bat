@echo off
REM ============================================================
REM  HELIOS - Abrir proyecto en VS Code
REM  Doble-click sobre este archivo para abrir todo el proyecto.
REM ============================================================

cd /d "%~dp0"

REM Verificar que el comando 'code' esta disponible
where code >nul 2>nul
if errorlevel 1 (
    echo.
    echo  [ERROR] El comando 'code' no esta en el PATH.
    echo.
    echo  Solucion en 4 pasos:
    echo    1. Abre Visual Studio Code manualmente
    echo    2. Presiona Ctrl + Shift + P
    echo    3. Escribe: Shell Command: Install 'code' command in PATH
    echo    4. Cierra esta ventana y vuelve a hacer doble-click aqui
    echo.
    pause
    exit /b 1
)

echo.
echo  Abriendo HELIOS en VS Code...
echo  Workspace: helios.code-workspace
echo.

REM Abrir el workspace de VS Code
start "" code "%~dp0helios.code-workspace"

REM Cerrar esta ventana automaticamente despues de 2 segundos
timeout /t 2 /nobreak >nul
exit /b 0
