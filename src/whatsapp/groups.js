const normalize = (s) => s.trim().toLowerCase();

export async function listGroups(sock) {
  const groups = await sock.groupFetchAllParticipating();
  return Object.values(groups).map((g) => ({ id: g.id, name: g.subject }));
}

/** Cari ID grup berdasarkan nama (tidak peka huruf besar/kecil). */
export async function findGroupIdByName(sock, name) {
  const groups = await listGroups(sock);
  const matches = groups.filter((g) => normalize(g.name ?? '') === normalize(name));

  if (matches.length === 0) {
    throw new Error(`Grup "${name}" tidak ditemukan. Cek nama grup dengan "npm run groups".`);
  }
  if (matches.length > 1) {
    throw new Error(`Ada ${matches.length} grup bernama "${name}". Ganti nama grup agar unik.`);
  }
  return matches[0].id;
}
