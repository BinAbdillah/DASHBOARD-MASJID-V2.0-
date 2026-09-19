import { firebaseService } from './firebase-service.js';
import { $, setValue } from './utils.js';
import { auth, db, ref, set, push, onValue, remove } from './firebase-config.js';
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
  try {
    await firebaseService.saveProfile({
      namaMasjid: $('#inp-nama').value,
      alamatMasjid: $('#inp-alamat').value,
      cityId: $('#inp-city-id').value || '1301',
      logoUrl: logoBase64
    });
    alert('Profil & Logo Masjid Berhasil Disimpan!');
  } catch (error) {
    console.error('Gagal menyimpan profil:', error);
    alert('Gagal menyimpan profil masjid.');
  }
};

$('#btn-add-agenda').onclick = async () => {
  const kategori = $('#inp-kategori').value.trim();
  const judul = $('#inp-judul').value.trim();
  const penceramah = $('#inp-penceramah').value.trim();
  const waktu = $('#inp-waktu').value.trim();

  if (!judul || !waktu) {
    alert('Mohon isi minimal Judul dan Waktu agenda!');
    return;
  }

  try {
    await firebaseService.addAgenda({ kategori, judul, penceramah, waktu });
    alert('Agenda Utama Berhasil Ditambahkan!');
    setValue('#inp-kategori', '');
    setValue('#inp-judul', '');
    setValue('#inp-penceramah', '');
    setValue('#inp-waktu', '');
  } catch (error) {
    console.error('Gagal menambahkan agenda:', error);
    alert('Gagal menambahkan agenda.');
  }
};

$('#btn-save-kegiatan').onclick = async () => {
  try {
    await firebaseService.saveActivity({
      badge: $('#inp-keg-badge').value.trim(),
      judul: $('#inp-keg-judul').value.trim(),
      speaker: $('#inp-keg-speaker').value.trim(),
      waktu: $('#inp-keg-waktu').value.trim()
    });
    alert('Kegiatan Lain (Statis) Berhasil Diperbarui!');
  } catch (error) {
    console.error('Gagal menyimpan kegiatan:', error);
    alert('Gagal menyimpan kegiatan.');
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
        <span class="agenda-badge">${item.kategori}</span>
        <div class="agenda-title">${item.judul}</div>
        <div class="agenda-sub"><i class="fa-solid fa-user-tie"></i> ${item.penceramah} | <i class="fa-solid fa-clock"></i> ${item.waktu}</div>
      </div>
      <button class="btn-delete" data-id="${key}"><i class="fa-solid fa-trash"></i> Hapus</button>
    `;
    listContainer.appendChild(itemEl);
  });

  [...document.querySelectorAll('.btn-delete')].forEach((button) => {
    button.onclick = async (event) => {
      const id = event.currentTarget.getAttribute('data-id');
      if (!confirm('Yakin ingin menghapus agenda ini?')) return;

      try {
        await firebaseService.deleteAgenda(id);
        alert('Agenda berhasil dihapus!');
      } catch (error) {
        console.error('Gagal menghapus:', error);
        alert('Gagal menghapus agenda.');
      }
    };
  });
});

$('#btn-save-running').onclick = async () => {
  try {
    await firebaseService.saveRunningText($('#inp-running-text').value);
    alert('Running Text Berhasil Diperbarui!');
  } catch (error) {
    console.error('Gagal menyimpan running text:', error);
    alert('Gagal menyimpan running text.');
  }
};
