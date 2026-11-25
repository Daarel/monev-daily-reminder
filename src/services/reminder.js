import { findGroupIdByName } from '../whatsapp/groups.js';

/** Hari (0–6, 0 = Minggu) dan jam (0–23) saat ini di zona waktu yang diberikan. */
export function nowIn(timezone, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, hour: Number(get('hour')) };
}

/**
 * Alasan untuk TIDAK mengirim sekarang, atau null kalau boleh kirim.
 * Mencegah kiriman di akhir pekan, dan kiriman yang sangat telat
 * (misal laptop baru menyala jam 1 pagi lalu task yang terlewat ikut jalan).
 */
export function skipReason(
  { timezone, workdays, skipBeforeHour = 20, skipAfterHour = 21 },
  date = new Date(),
) {
  const { day, hour } = nowIn(timezone, date);
  if (!workdays.includes(day)) return 'hari ini bukan hari kerja';
  if (hour < skipBeforeHour || hour > skipAfterHour) {
    return `di luar jam kirim (${skipBeforeHour}:00–${skipAfterHour}:59), pengingat dilewati`;
  }
  return null;
}

export async function sendReminder(sock, { groupName, message, dryRun = false }) {
  const groupId = await findGroupIdByName(sock, groupName);
  if (dryRun) return { groupId, sent: false };

  await sock.sendMessage(groupId, { text: message });
  return { groupId, sent: true };
}
