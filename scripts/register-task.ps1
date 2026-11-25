# Daftarkan task Windows: kirim pengingat Senin-Jumat jam 20:00 (jam laptop).
# Jalankan:  powershell -ExecutionPolicy Bypass -File scripts\register-task.ps1
param(
  [string]$TaskName = 'MonevDailyReminder',
  [string]$At = '20:00'
)

$ErrorActionPreference = 'Stop'
$runner = Join-Path $PSScriptRoot 'run-reminder.cmd'

$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$runner`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday, Tuesday, Wednesday, Thursday, Friday -At $At
# StartWhenAvailable: kalau laptop sleep/mati jam 20:00, task jalan begitu laptop menyala.
# (Kode tetap melewati kiriman yang lewat dari jam "skipAfterHour" di config.json.)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
  -Description 'Kirim pengingat absen ke grup WhatsApp magang' -Force | Out-Null

Write-Host "Task '$TaskName' terdaftar: Senin-Jumat jam $At."
Write-Host "Pastikan zona waktu laptop WIB (UTC+07:00)."
