import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

const logger = pino({ level: 'silent' });

/**
 * Buka koneksi WhatsApp dan tunggu sampai siap dipakai.
 * Sesi disimpan di `authDir`, jadi QR cuma perlu discan sekali.
 * Kalau sesi belum ada, QR dicetak di terminal (hanya bila allowQr = true).
 */
export async function connect({ authDir, allowQr = false, timeoutMs = 120_000 }) {
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  return new Promise((resolvePromise, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout: gagal terhubung ke WhatsApp.')), timeoutMs);

    const start = () => {
      const sock = makeWASocket({
        version,
        auth: state,
        logger,
        browser: Browsers.windows('Desktop'),
        markOnlineOnConnect: false,
        syncFullHistory: false,
      });

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
          if (!allowQr) {
            clearTimeout(timer);
            sock.end(undefined);
            reject(new Error('Belum login. Jalankan "npm run login" lalu scan QR dulu.'));
            return;
          }
          console.log('\nScan QR ini di WhatsApp > Perangkat tertaut > Tautkan perangkat:\n');
          qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
          clearTimeout(timer);
          resolvePromise(sock);
        }

        if (connection === 'close') {
          const code = lastDisconnect?.error?.output?.statusCode;
          if (code === DisconnectReason.restartRequired) {
            // Normal setelah scan QR pertama kali: WhatsApp minta reconnect.
            start();
            return;
          }
          clearTimeout(timer);
          if (code === DisconnectReason.loggedOut) {
            reject(new Error('Sesi logout. Hapus folder auth/ lalu jalankan "npm run login" lagi.'));
          } else {
            reject(lastDisconnect?.error ?? new Error('Koneksi WhatsApp tertutup.'));
          }
        }
      });
    };

    start();
  });
}

/** Tutup koneksi tanpa logout (sesi tetap tersimpan). */
export async function disconnect(sock) {
  // Beri waktu sebentar agar pesan & kredensial selesai terkirim/tersimpan.
  await new Promise((r) => setTimeout(r, 3_000));
  await sock.end(undefined);
}
