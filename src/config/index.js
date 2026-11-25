import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const DEFAULTS = {
  timezone: 'Asia/Jakarta',
  workdays: [1, 2, 3, 4, 5], // 0 = Minggu ... 6 = Sabtu
  skipBeforeHour: 20,
  skipAfterHour: 21,
  authDir: 'auth',
};

export function loadConfig() {
  const path = resolve(ROOT_DIR, 'config.json');
  if (!existsSync(path)) {
    throw new Error('config.json belum ada. Salin dari config.example.json lalu isi groupName.');
  }

  const config = { ...DEFAULTS, ...JSON.parse(readFileSync(path, 'utf8')) };

  if (!config.groupName?.trim()) throw new Error('config.json: "groupName" wajib diisi.');
  if (!config.message?.trim()) throw new Error('config.json: "message" wajib diisi.');

  return { ...config, authDir: resolve(ROOT_DIR, config.authDir) };
}
