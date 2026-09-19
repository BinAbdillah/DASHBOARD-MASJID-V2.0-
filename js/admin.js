import { auth, db, ref, set, push, onValue, remove } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = 'login.html';
});

const t1 = document.getElementById('tab-1');
const t2 = document.getElementById('tab-2');
const t3 = document.getElementById('tab-3');
const t4 = document.getElementById('tab-4');

const b1 = document.getElementById('tab-btn-1');
const b2 = document.getElementById('tab-btn-2');
const b3 = document.getElementById('tab-btn-3');
const b4 = document.getElementById('tab-btn-4');

function resetTabs() {
  t1.style.display = 'none';
  t2.style.display = 'none';
  t3.style.display = 'none';
  t4.style.display = 'none';

  b1.classList.remove('active');
  b2.classList.remove('active');
  b3.classList.remove('active');
  b4.classList.remove('active');
}

b1.onclick = () => { resetTabs(); t1.style.display = 'block'; b1.classList.add('active'); };
b2.onclick = () => { resetTabs(); t2.style.display = 'block'; b2.classList.add('active'); };
b3.onclick = () => { resetTabs(); t3.style.display = 'block'; b3.classList.add('active'); };
b4.onclick = () => { resetTabs(); t4.style.display = 'block'; b4.classList.add('active'); };

document.getElementById('btn-logout').onclick = () => signOut(auth);

let logoBase64 = null;

document.getElementById('inp-logo-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (evt) {
      logoBase64 = evt.target.result;
      const imgPreview = document.getElementById('img-preview');
      imgPreview.src = logoBase64;
      imgPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

onValue(ref(db, 'config'), (snapshot) => {
  const data = snapshot.val();
  if (data) {
    if (data.nama_masjid) document.getElementById('inp-nama').value = data.nama_masjid;
    if (data.alamat_masjid) document.getElementById('inp-alamat').value = data.alamat_masjid;
    if (data.city_id) document.getElementById('inp-city-id').value = data.city_id;
    if (data.running_text) document.getElementById('inp-running-text').value = data.running_text;
    if (data.logo_url) {
      const imgPreview = document.getElementById('img-preview');
      imgPreview.src = data.logo_url;
      imgPreview.style.display = 'block';
      logoBase64 = data.logo_url;
    }
    if (data.kegiatan_lain) {
      document.getElementById('inp-keg-badge').value = data.kegiatan_lain.badge || 'KEGIATAN LAIN';
      document.getElementById('inp-keg-judul').value = data.kegiatan_lain.judul || '';
      document.getElementById('inp-keg-speaker').value = data.kegiatan_lain.speaker || '';
      document.getElementById('inp-keg-waktu').value = data.kegiatan_lain.waktu || '';
    }
  }
});

document.getElementById('btn-save-masjid').onclick = () => {
  set(ref(db, 'config/nama_masjid'), document.getElementById('inp-nama').value);
  set(ref(db, 'config/alamat_masjid'), document.getElementById('inp-alamat').value);
  set(ref(db, 'config/city_id'), document.getElementById('inp-city-id').value || '1301');
  if (logoBase64) {
    set(ref(db, 'config/logo_url'), logoBase64);
  }
  alert('Profil & Logo Masjid Berhasil Disimpan!');
};

document.getElementById('btn-add-agenda').onclick = () => {
  const kategori = document.getElementById('inp-kategori').value.trim();
  const judul = document.getElementById('inp-judul').value.trim();
  const penceramah = document.getElementById('inp-penceramah').value.trim();
  const waktu = document.getElementById('inp-waktu').value.trim();

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
    document.getElementById('inp-kategori').value = '';
    document.getElementById('inp-judul').value = '';
    document.getElementById('inp-penceramah').value = '';
    document.getElementById('inp-waktu').value = '';
  });
};

document.getElementById('btn-save-kegiatan').onclick = () => {
  const badge = document.getElementById('inp-keg-badge').value.trim();
  const judul = document.getElementById('inp-keg-judul').value.trim();
  const speaker = document.getElementById('inp-keg-speaker').value.trim();
  const waktu = document.getElementById('inp-keg-waktu').value.trim();

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
  const listContainer = document.getElementById('agenda-list-box');
  listContainer.innerHTML = '';

  if (agendas) {
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

    document.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Yakin ingin menghapus agenda ini?')) {
          remove(ref(db, `agendas/${id}`))
            .then(() => alert('Agenda berhasil dihapus!'))
            .catch((err) => console.error('Gagal menghapus:', err));
        }
      };
    });
  } else {
    listContainer.innerHTML = '<p style="color:#64748b; font-size:13px;">Belum ada agenda tersimpan.</p>';
  }
});

document.getElementById('btn-save-running').onclick = () => {
  set(ref(db, 'config/running_text'), document.getElementById('inp-running-text').value);
  alert('Running Text Berhasil Diperbarui!');
};
