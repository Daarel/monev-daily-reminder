# Hapus task pengingat dari Task Scheduler.
param([string]$TaskName = 'MonevDailyReminder')

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Task '$TaskName' dihapus."
