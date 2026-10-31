@echo off
setlocal
rem UTF-8 so the setup messages (written by Node) show accents correctly
chcp 65001 >nul
title SISAPA - localhost:8080
cd /d "%~dp0"

echo ============================================
echo   SISAPA - iniciando em http://localhost:8080
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale o Node 22.12 ou superior: https://nodejs.org
  pause
  exit /b 1
)

rem Ja esta rodando? So abre o navegador.
netstat -ano | findstr /r /c:":8080 .*LISTENING" >nul
if not errorlevel 1 (
  echo O SISAPA ja esta rodando. Abrindo o navegador...
  start "" http://localhost:8080
  exit /b 0
)

rem Instala as dependencias so na primeira vez (ou se a instalacao anterior falhou)
if not exist "node_modules\.modules.yaml" (
  echo Instalando dependencias - pode levar alguns minutos na primeira vez...
  call npx --yes pnpm@10.14.0 install --frozen-lockfile
  if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar as dependencias.
    echo Se aparecer ENOENT ou EPERM, o Windows esta bloqueando o Node na pasta Documentos:
    echo   Seguranca do Windows ^> Protecao contra virus e ameacas ^> Gerenciar protecao contra ransomware
    echo   ^> Acesso controlado a pastas ^> Permitir um aplicativo ^> C:\Program Files\nodejs\node.exe
    pause
    exit /b 1
  )
)

rem Cria o .env (se faltar) e pede a conta de e-mail so na primeira vez neste computador
node scripts\configure-email.mjs --if-missing

echo.
echo Abrindo o navegador em alguns segundos...
echo Para parar o servidor, feche esta janela ou pressione Ctrl+C.
echo.
start "" cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:8080"

call npx --yes pnpm@10.14.0 dev

echo.
echo O servidor foi encerrado.
pause
