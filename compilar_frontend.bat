@echo off
title Mi Carrera Tech - Compilando Frontend
color 0B
echo.
echo  ==========================================
echo   Mi Carrera Tech - Build del Frontend
echo  ==========================================
echo.

cd frontend

if not exist node_modules (
    echo  [INFO] Instalando dependencias del frontend...
    call npm install
    echo  [OK] Dependencias instaladas.
    echo.
)

echo  [INFO] Compilando frontend para produccion...
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] La compilacion fallo. Revisa los errores arriba.
    pause
    exit /b 1
)

echo.
echo  [OK] Frontend compilado exitosamente en frontend/dist/
echo  [INFO] Ahora puedes usar iniciar_app.bat para lanzar la aplicacion.
echo.
pause
