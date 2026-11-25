import { loadConfig } from './config/index.js';
import { connect, disconnect } from './whatsapp/client.js';
import { listGroups } from './whatsapp/groups.js';
import { sendReminder, skipReason } from './services/reminder.js';

const log = (...args) => console.log(`[${new Date().toISOString()}]`, ...args);

const commands = {
  // Login pertama kali: tampilkan QR, simpan sesi ke auth/.
  async login(config) {
    const sock = await connect({ authDir: config.authDir, allowQr: true });
    log('Login berhasil. Sesi tersimpan di', config.authDir);
    await disconnect(sock);
  },

  // Tampilkan semua grup, untuk memastikan nama grup di config.json.
  async groups(config) {
    const sock = await connect({ authDir: config.authDir });
    try {
      const groups = await listGroups(sock);
      groups.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
      for (const g of groups) console.log(`- ${g.name}`);
    } finally {
      await disconnect(sock);
    }
  },

  // Kirim pengingat (dipanggil Task Scheduler).
  //   --dry-run  cari grupnya saja, tidak mengirim
  //   --force    abaikan cek hari kerja / jam
  async send(config, flags) {
    const dryRun = flags.has('--dry-run');
    if (!dryRun && !flags.has('--force')) {
      const reason = skipReason(config);
      if (reason) {
        log('Lewati:', reason);
        return;
      }
    }

    const sock = await connect({ authDir: config.authDir });
    try {
      const { groupId, sent } = await sendReminder(sock, { ...config, dryRun });
      log(sent ? 'Terkirim ke' : '[dry-run] Grup ditemukan, tidak mengirim:', config.groupName, `(${groupId})`);
    } finally {
      await disconnect(sock);
    }
  },
};

async function main() {
  const [name = 'send', ...rest] = process.argv.slice(2);
  const command = commands[name];
  if (!command) {
    console.error(`Perintah tidak dikenal: ${name}. Pilihan: ${Object.keys(commands).join(', ')}`);
    process.exit(1);
  }
  await command(loadConfig(), new Set(rest));
  process.exit(0);
}

main().catch((err) => {
  log('GAGAL:', err.message);
  process.exit(1);
});
