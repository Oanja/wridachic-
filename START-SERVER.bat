@echo off
echo.
echo  ====================================
echo   wridachic — serveur local
echo  ====================================
echo.
echo  Ouverture sur: http://localhost:8080
echo  Pour arreter: fermer cette fenetre
echo.
start "" "http://localhost:8080"
python -m http.server 8080
pause
