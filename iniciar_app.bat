@echo off
:: Si se pasa el argumento "invisible", saltar el autolanzador
if "%~1"=="invisible" goto :main

:: Crear un script VBS temporal para relanzar este mismo .bat de forma oculta
echo Set WshShell = CreateObject("WScript.Shell") > "%temp%\launch_hidden.vbs"
echo WshShell.Run """%~f0"" invisible", 0, False >> "%temp%\launch_hidden.vbs"
wscript "%temp%\launch_hidden.vbs"
del "%temp%\launch_hidden.vbs"
exit

:main
title Mi Carrera Tech - Gestor Local
color 0A
echo.
echo  ==========================================
echo   Mi Carrera Tech - Licenciatura en GTI
echo  ==========================================
echo.
echo  [INFO] Verificando actualizaciones desde GitHub...
git pull
echo.
echo  Iniciando servidor y abriendo navegador...
echo.
cd backend
if not exist node_modules (
    echo  [INFO] Primera ejecucion: instalando dependencias...
    call npm install
    echo  [OK] Dependencias instaladas.
    echo.
)
echo  [OK] Servidor iniciando en http://localhost:3000
echo  [INFO] El navegador se abrira automaticamente.
echo.
node server.js
