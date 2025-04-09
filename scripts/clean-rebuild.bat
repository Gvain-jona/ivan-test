@echo off
echo === CLEANING PROJECT ===

echo Stopping any running Next.js servers...
taskkill /f /im node.exe 2>nul

echo Deleting .next folder...
rmdir /s /q .next 2>nul

echo Deleting node_modules folder...
rmdir /s /q node_modules 2>nul

echo Clearing npm cache...
call npm cache clean --force

echo Deleting package-lock.json...
del /f package-lock.json 2>nul

echo === REBUILDING PROJECT ===

echo Installing dependencies...
call npm install --legacy-peer-deps

echo === CLEAN REBUILD COMPLETE ===
echo.
echo To start the development server, run:
echo npm run dev
