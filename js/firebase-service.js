export const firebaseService = {
  async saveProfile({ namaMasjid, alamatMasjid, cityId, logoUrl, removeLogo = false }) {
    const { db, ref, set } = await import('./firebase-config.js');
    await set(ref(db, 'config/nama_masjid'), namaMasjid);
    await set(ref(db, 'config/alamat_masjid'), alamatMasjid);
    await set(ref(db, 'config/city_id'), cityId || '1301');

    if (removeLogo) {
      await set(ref(db, 'config/logo_url'), null);
    } else if (logoUrl) {
      await set(ref(db, 'config/logo_url'), logoUrl);
    }
  },

  async saveActivity({ badge, judul, speaker, waktu }) {
    const { db, ref, set } = await import('./firebase-config.js');
    await set(ref(db, 'config/kegiatan_lain'), {
      badge: badge || 'KEGIATAN LAIN',
      judul,
      speaker,
      waktu
    });
  },

  async saveRunningText(value) {
    const { db, ref, set } = await import('./firebase-config.js');
    await set(ref(db, 'config/running_text'), value);
  },

  async addAgenda({ kategori, judul, penceramah, waktu }) {
    const { db, ref, push } = await import('./firebase-config.js');
    await push(ref(db, 'agendas'), {
      kategori: kategori || 'AGENDA',
      judul,
      penceramah: penceramah || '-',
      waktu
    });
  },

  async updateAgenda(id, { kategori, judul, penceramah, waktu }) {
    const { db, ref, set } = await import('./firebase-config.js');
    await set(ref(db, `agendas/${id}`), {
      kategori: kategori || 'AGENDA',
      judul,
      penceramah: penceramah || '-',
      waktu
    });
  },

  async deleteAgenda(id) {
    const { db, ref, remove } = await import('./firebase-config.js');
    await remove(ref(db, `agendas/${id}`));
  }
};
