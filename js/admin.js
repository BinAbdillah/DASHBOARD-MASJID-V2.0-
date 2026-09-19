import { auth, db, ref, set, push, onValue, remove } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { $, $$, setValue, setText } from './utils.js';

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
  Object.values(tabs).forEach((tab) => {
    if (tab) tab.style.display = 'none';
  });

  Object.values(tabButtons).forEach((button) => {
    if (button) button.classList.remove('active');
  });
}

function bindTabs() {
  Object.entries(tabButtons).forEach(([key, button]) => {
    if (!button) return;
    button.onclick = () => {
      resetTabs();
      if (tabs[key]) {
        tabs[key].style.display = 'block';
      }
      button.classList.add('active');
    };
  });
}

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

$('#btn-save-masjid').onclick = () => {
  set(ref(db, 'config/nama_masjid'), $('#inp-nama').value);
  set(ref(db, 'config/alamat_masjid'), $('#inp-alamat').value);
  set(ref(db, 'config/city_id'), $('#inp-city-id').value || '1301');

  if (logoBase64) {
    set(ref(db, 'config/logo_url'), logoBase64);
  }

  alert('Profil & Logo Masjid Berhasil Disimpan!');
};

$('#btn-add-agenda').onclick = () => {
  const kategori = $('#inp-kategori').value.trim();
  const judul = $('#inp-judul').value.trim();
  const penceramah = $('#inp-penceramah').value.trim();
  const waktu = $('#inp-waktu').value.trim();

  if (!judul || !waktu) {
    alert('Mohon isi minimal Judul dan Waktu agenda!');
    return;
  }

  push(ref(db, 'agendas'), {
    kategori: kategori || 'AGENDA',
    judul,
    penceramah: penceramah || '-',
    waktu
  }).then(() => {
    alert('Agenda Utama Berhasil Ditambahkan!');
    setValue('#inp-kategori', '');
    setValue('#inp-judul', '');
    setValue('#inp-penceramah', '');
    setValue('#inp-waktu', '');
  });
};

$('#btn-save-kegiatan').onclick = () => {
  const badge = $('#inp-keg-badge').value.trim();
  const judul = $('#inp-keg-judul').value.trim();
  const speaker = $('#inp-keg-speaker').value.trim();
  const waktu = $('#inp-keg-waktu').value.trim();

  set(ref(db, 'config/kegiatan_lain'), {
    badge: badge || 'KEGIATAN LAIN',
    judul,
    speaker,
    waktu
  }).then(() => {
    alert('Kegiatan Lain (Statis) Berhasil Diperbarui!');
  });
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

  $$('.btn-delete').forEach((button) => {
    button.onclick = (event) => {
      const id = event.currentTarget.getAttribute('data-id');
      if (confirm('Yakin ingin menghapus agenda ini?')) {
        remove(ref(db, `agendas/${id}`))
          .then(() => alert('Agenda berhasil dihapus!'))
          .catch((error) => console.error('Gagal menghapus:', error));
      }
    };
  });
});

$('#btn-save-running').onclick = () => {
  set(ref(db, 'config/running_text'), $('#inp-running-text').value);
  alert('Running Text Berhasil Diperbarui!');
};

bindTabs();
