@echo off
rem Dipanggil oleh Task Scheduler. Kirim pengingat, catat hasilnya di logs\reminder.log.
cd /d "%~dp0.."
if not exist logs mkdir logs
node src\index.js send >> logs\reminder.log 2>&1
