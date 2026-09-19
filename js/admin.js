import { firebaseService } from './firebase-service.js';
import { $, setValue, isNonEmpty, escapeHtml, showToast } from './utils.js';
import { auth, db, ref, onValue } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = 'login.html';
});

const tabs = {
  1: $('#tab-1'),
  2: $('#tab-2'),
  3: $('#tab-3'),
  4: $('#tab-4')
};

const tabButtons = {
  1: $('#tab-btn-1'),
  2: $('#tab-btn-2'),
  3: $('#tab-btn-3'),
  4: $('#tab-btn-4')
};

function resetTabs() {
  Object.values(tabs).forEach((tab) => tab && (tab.style.display = 'none'));
  Object.values(tabButtons).forEach((button) => button && button.classList.remove('active'));
}

Object.entries(tabButtons).forEach(([key, button]) => {
  if (!button) return;
  button.onclick = () => {
    resetTabs();
    if (tabs[key]) tabs[key].style.display = 'block';
    button.classList.add('active');
  };
});

$('#btn-logout').onclick = () => signOut(auth);

let logoBase64 = null;

$('#inp-logo-file').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    logoBase64 = loadEvent.target.result;
    const preview = $('#img-preview');
    if (preview) {
      preview.src = logoBase64;
      preview.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
});

onValue(ref(db, 'config'), (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  if (data.nama_masjid) setValue('#inp-nama', data.nama_masjid);
  if (data.alamat_masjid) setValue('#inp-alamat', data.alamat_masjid);
  if (data.city_id) setValue('#inp-city-id', data.city_id);
  if (data.running_text) setValue('#inp-running-text', data.running_text);

  if (data.logo_url) {
    const preview = $('#img-preview');
    if (preview) {
      preview.src = data.logo_url;
      preview.style.display = 'block';
    }
    logoBase64 = data.logo_url;
  }

  if (data.kegiatan_lain) {
    setValue('#inp-keg-badge', data.kegiatan_lain.badge || 'KEGIATAN LAIN');
    setValue('#inp-keg-judul', data.kegiatan_lain.judul || '');
    setValue('#inp-keg-speaker', data.kegiatan_lain.speaker || '');
    setValue('#inp-keg-waktu', data.kegiatan_lain.waktu || '');
  }
});

$('#btn-save-masjid').onclick = async () => {
  const namaMasjid = $('#inp-nama').value.trim();
  const alamatMasjid = $('#inp-alamat').value.trim();
  const cityId = $('#inp-city-id').value.trim();

  if (!isNonEmpty(namaMasjid) || !isNonEmpty(alamatMasjid)) {
    showToast('Nama masjid dan alamat wajib diisi.', 'error');
    return;
  }

  try {
    await firebaseService.saveProfile({
      namaMasjid,
      alamatMasjid,
      cityId: cityId || '1301',
      logoUrl: logoBase64
    });
    showToast('Profil & Logo Masjid Berhasil Disimpan!', 'success');
  } catch (error) {
    console.error('Gagal menyimpan profil:', error);
    showToast('Gagal menyimpan profil masjid.', 'error');
  }
};

$('#btn-add-agenda').onclick = async () => {
  const kategori = $('#inp-kategori').value.trim();
  const judul = $('#inp-judul').value.trim();
  const penceramah = $('#inp-penceramah').value.trim();
  const waktu = $('#inp-waktu').value.trim();

  if (!isNonEmpty(judul) || !isNonEmpty(waktu)) {
    showToast('Judul dan waktu agenda wajib diisi.', 'error');
    return;
  }

  try {
    await firebaseService.addAgenda({ kategori, judul, penceramah, waktu });
    showToast('Agenda Utama Berhasil Ditambahkan!', 'success');
    setValue('#inp-kategori', '');
    setValue('#inp-judul', '');
    setValue('#inp-penceramah', '');
    setValue('#inp-waktu', '');
  } catch (error) {
    console.error('Gagal menambahkan agenda:', error);
    showToast('Gagal menambahkan agenda.', 'error');
  }
};

$('#btn-save-kegiatan').onclick = async () => {
  const badge = $('#inp-keg-badge').value.trim();
  const judul = $('#inp-keg-judul').value.trim();
  const speaker = $('#inp-keg-speaker').value.trim();
  const waktu = $('#inp-keg-waktu').value.trim();

  if (!isNonEmpty(judul) || !isNonEmpty(waktu)) {
    showToast('Judul dan waktu kegiatan wajib diisi.', 'error');
    return;
  }

  try {
    await firebaseService.saveActivity({ badge, judul, speaker, waktu });
    showToast('Kegiatan Lain (Statis) Berhasil Diperbarui!', 'success');
  } catch (error) {
    console.error('Gagal menyimpan kegiatan:', error);
    showToast('Gagal menyimpan kegiatan.', 'error');
  }
};

onValue(ref(db, 'agendas'), (snapshot) => {
  const agendas = snapshot.val();
  const listContainer = $('#agenda-list-box');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  if (!agendas) {
    listContainer.innerHTML = '<p style="color:#64748b; font-size:13px;">Belum ada agenda tersimpan.</p>';
    return;
  }

  Object.keys(agendas).forEach((key) => {
    const item = agendas[key];
    const itemEl = document.createElement('div');
    itemEl.className = 'agenda-item';
    itemEl.innerHTML = `
      <div class="agenda-info">
        <span class="agenda-badge">${escapeHtml(item.kategori || 'AGENDA')}</span>
        <div class="agenda-title">${escapeHtml(item.judul || '-')}</div>
        <div class="agenda-sub"><i class="fa-solid fa-user-tie"></i> ${escapeHtml(item.penceramah || '-')} | <i class="fa-solid fa-clock"></i> ${escapeHtml(item.waktu || '-')}</div>
      </div>
      <button class="btn-delete" data-id="${escapeHtml(key)}"><i class="fa-solid fa-trash"></i> Hapus</button>
    `;
    listContainer.appendChild(itemEl);
  });

  [...document.querySelectorAll('.btn-delete')].forEach((button) => {
    button.onclick = async (event) => {
      const id = event.currentTarget.getAttribute('data-id');
      if (!confirm('Yakin ingin menghapus agenda ini?')) return;

      try {
        await firebaseService.deleteAgenda(id);
        showToast('Agenda berhasil dihapus!', 'success');
      } catch (error) {
        console.error('Gagal menghapus:', error);
        showToast('Gagal menghapus agenda.', 'error');
      }
    };
  });
});

$('#btn-save-running').onclick = async () => {
  const value = $('#inp-running-text').value.trim();
  if (!isNonEmpty(value)) {
    showToast('Running text tidak boleh kosong.', 'error');
    return;
  }

  try {
    await firebaseService.saveRunningText(value);
    showToast('Running Text Berhasil Diperbarui!', 'success');
  } catch (error) {
    console.error('Gagal menyimpan running text:', error);
    showToast('Gagal menyimpan running text.', 'error');
  }
};
