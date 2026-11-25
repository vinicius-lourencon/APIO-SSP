@echo off
setlocal
rem UTF-8 so the messages (written by Node) show accents correctly
chcp 65001 >nul
title SISAPA - publicado na internet
cd /d "%~dp0"

echo ============================================
echo   SISAPA - publicando na internet
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale o Node 22.12 ou superior: https://nodejs.org
  pause
  exit /b 1
)

rem Instala as dependencias so na primeira vez (ou se a instalacao anterior falhou)
if not exist "node_modules\.modules.yaml" (
  echo Instalando dependencias - pode levar alguns minutos na primeira vez...
  call npx --yes pnpm@10.14.0 install --frozen-lockfile
  if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar as dependencias.
    pause
    exit /b 1
  )
)

rem Cria o .env (se faltar) e pede a conta de e-mail so na primeira vez neste computador
node scripts\configure-email.mjs --if-missing

echo.
echo Gerando a versao de producao...
call npx --yes pnpm@10.14.0 build
if errorlevel 1 (
  echo.
  echo [ERRO] O build falhou. Veja as mensagens acima.
  pause
  exit /b 1
)

rem Sobe o servidor e o tunel; mostra o link publico. Ctrl+C ou fechar a janela tira do ar.
node scripts\publish.mjs

echo.
echo O SISAPA saiu do ar.
pause
