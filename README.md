# Monev Daily Reminder

Bot kecil yang mengirim pesan **"Jangan lupa absen hari ini ya 🙏"** ke grup WhatsApp magang setiap **Senin–Jumat jam 20:00 WIB**, dari nomor WhatsApp kamu sendiri. Jalan di laptop Windows lewat Task Scheduler, biaya Rp0.

> ⚠️ Memakai [Baileys](https://github.com/WhiskeySockets/Baileys), library WhatsApp **tidak resmi**. Ada risiko kecil nomor diblokir. Kirim sekali sehari ke satu grup termasuk aman-aman saja, tapi jangan dipakai untuk spam.

## Struktur

```
config.json              nama grup, isi pesan, jadwal (tidak di-commit)
src/
  index.js               entry point: perintah login | groups | send
  config/                baca & validasi config.json
  whatsapp/client.js     koneksi WhatsApp + login QR (sesi di auth/)
  whatsapp/groups.js     cari ID grup dari namanya
  services/reminder.js   cek hari kerja/jam, kirim pengingat
scripts/
  run-reminder.cmd       dipanggil Task Scheduler, log ke logs/reminder.log
  register-task.ps1      daftarkan jadwal Senin–Jumat 20:00
  unregister-task.ps1    hapus jadwal
```

## Setup

Butuh Node.js 20+.

```powershell
npm install
```

Edit `config.json` (salin dari `config.example.json` kalau belum ada):

```json
{
  "groupName": "Nama Grup Magang",
  "message": "Jangan lupa absen hari ini ya 🙏",
  "timezone": "Asia/Jakarta",
  "workdays": [1, 2, 3, 4, 5],
  "skipBeforeHour": 20,
  "skipAfterHour": 21,
  "authDir": "auth"
}
```

- `groupName` — nama grup persis seperti di WhatsApp (huruf besar/kecil tidak masalah).
- `workdays` — 0 = Minggu … 6 = Sabtu.
- `skipBeforeHour` / `skipAfterHour` — rentang jam kirim yang diizinkan (default `20:00–21:59`). Kalau laptop baru menyala di luar rentang ini (misal lewat jam 22:00, jam 1 pagi, atau 8 pagi besoknya), pengingat dilewati.

## Login pertama kali (scan QR)

```powershell
npm run login
```

QR muncul di terminal. Di HP buka **WhatsApp → Perangkat tertaut → Tautkan perangkat**, lalu scan. Sesi tersimpan di folder `auth/`, jadi cukup sekali. Jangan bagikan folder `auth/` ke siapa pun, isinya akses ke akun WhatsApp kamu.

## Cek grup & tes

```powershell
npm run groups      # lihat daftar nama grup
npm run dry-run     # cari grup dari config.json, TIDAK mengirim
npm run send:force  # kirim sekarang juga (abaikan cek hari/jam) — pesan beneran terkirim!
```

## Daftarkan jadwal otomatis

```powershell
powershell -ExecutionPolicy Bypass -File scripts\register-task.ps1
```

Task `MonevDailyReminder` akan jalan Senin–Jumat jam 20:00 (jam laptop, pastikan zona waktunya WIB). Kalau laptop sedang mati/sleep, task jalan begitu laptop menyala lagi (selama belum lewat `skipAfterHour`).

- Tes task sekarang: `Start-ScheduledTask MonevDailyReminder` (mengirim pesan kalau hari kerja dan belum lewat `skipAfterHour`).
- Lihat log: `Get-Content logs\reminder.log -Tail 20`
- Hapus jadwal: `powershell -ExecutionPolicy Bypass -File scripts\unregister-task.ps1`

## Kalau ada masalah

- **"Belum login"** → jalankan `npm run login`.
- **"Sesi logout"** → perangkat dilepas dari HP. Hapus folder `auth/`, lalu `npm run login` lagi.
- **"Grup tidak ditemukan"** → cek nama dengan `npm run groups`, samakan di `config.json`.

## Rencana Pengembangan

- **Hidetag (`mentionAll`)** — opsi di `config.json` untuk mention semua anggota grup secara tersembunyi (lewat `groupMetadata` + `mentions` di Baileys) agar semua anggota tetap mendapat notifikasi tanpa memenuhi teks pesan dengan daftar `@nomor`.
