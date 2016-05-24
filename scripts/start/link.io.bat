@echo off
    IF EXIST "link.io.server.monitoring" GOTO START
    echo Server Link.IO not found, please install it with install.bat
    goto END

:START
    start mongod --dbpath=%CD%\link.io.server.monitoring\db
    SLEEP 2
    mkdir %CD%\link.io.server\log
    cd "link.io.server.monitoring"
    node monitoring.js
    if %ERRORLEVEL% == 0 goto :END
    echo Please install NodeJS and add it to the PATH variable
:END