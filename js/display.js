import { db, ref, onValue } from './firebase-config.js';

let prayerSchedule = {};
let cityId = '1301';
let fallbackIndex = 0;
let agendaInterval = null;

const fallbackAyahs = [
  {
    ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    tr: '"Maka sesungguhnya bersama kesulitan ada kemudahan, sesungguhnya bersama kesulitan ada kemudahan." — QS. Al-Insyirah: 5-6'
  },
  {
    ar: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ',
    tr: '"Dan laksanakanlah salat, tunaikanlah zakat, dan rukuklah beserta orang-orang yang rukuk." — QS. Al-Baqarah: 43'
  },
  {
    ar: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    tr: '"Wahai orang-orang yang beriman! Mohonlah pertolongan (kepada Allah) dengan sabar dan salat." — QS. Al-Baqarah: 153'
  }
];

async function fetchRandomQuranVerse() {
  const quranBox = document.getElementById('quran-box');
  quranBox.classList.add('fade-out');

  setTimeout(async () => {
    let isLoaded = false;

    try {
      const randomAyah = Math.floor(Math.random() * 6236) + 1;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyah}/editions/quran-uthmani,id.indonesian`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.data) {
          document.getElementById('quran-arabic').innerText = data.data[0].text;
          document.getElementById('quran-translation').innerText = `"${data.data[1].text}" — QS. ${data.data[0].surah.englishName}: ${data.data[0].numberInSurah}`;
          isLoaded = true;
        }
      }
    } catch (error) {
      isLoaded = false;
    }

    if (!isLoaded) {
      const item = fallbackAyahs[fallbackIndex];
      document.getElementById('quran-arabic').innerText = item.ar;
      document.getElementById('quran-translation').innerText = item.tr;
      fallbackIndex = (fallbackIndex + 1) % fallbackAyahs.length;
    }

    quranBox.classList.remove('fade-out');
  }, 800);
}

function updateDates() {
  const now = new Date();
  const optionsMasehi = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  document.getElementById('date-masehi').innerText = now.toLocaleDateString('id-ID', optionsMasehi);

  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  fetch(`https://api.aladhan.com/v1/gToH/${day}-${month}-${year}`)
    .then((response) => response.json())
    .then((data) => {
      if (data && data.data) {
        const hijriDate = data.data.hijri;
        document.getElementById('date-hijri').innerText = `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} H`;
      }
    })
    .catch(() => {
      document.getElementById('date-hijri').innerText = '-- Safar 1448 H';
    });
}

async function fetchKemenagPrayerTimes() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  try {
    const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`);
    const data = await response.json();

    if (data.status && data.data.jadwal) {
      const j = data.data.jadwal;
      prayerSchedule = {
        Subuh: j.subuh,
        Dzuhur: j.dzuhur,
        Ashar: j.ashar,
        Maghrib: j.maghrib,
        Isya: j.isya
      };

      document.getElementById('time-subuh').innerText = `${j.subuh} WIB`;
      document.getElementById('time-dzuhur').innerText = `${j.dzuhur} WIB`;
      document.getElementById('time-ashar').innerText = `${j.ashar} WIB`;
      document.getElementById('time-maghrib').innerText = `${j.maghrib} WIB`;
      document.getElementById('time-isya').innerText = `${j.isya} WIB`;
    }
  } catch (error) {
    console.error('Gagal mengambil jadwal Kemenag:', error);
  }
}

function updateClockAndCountdown() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('clock').innerText = `${hours}.${minutes}.${seconds} WIB`;

  if (!prayerSchedule.Subuh) return;

  const prayerTimes = [
    { name: 'SUBUH', time: prayerSchedule.Subuh, id: 'p-subuh' },
    { name: 'DZUHUR', time: prayerSchedule.Dzuhur, id: 'p-dzuhur' },
    { name: 'ASHAR', time: prayerSchedule.Ashar, id: 'p-ashar' },
    { name: 'MAGHRIB', time: prayerSchedule.Maghrib, id: 'p-maghrib' },
    { name: 'ISYA', time: prayerSchedule.Isya, id: 'p-isya' }
  ];

  document.querySelectorAll('.prayer-item').forEach((element) => element.classList.remove('active'));

  let nextPrayer = null;
  for (const prayer of prayerTimes) {
    const [prayerHours, prayerMinutes] = prayer.time.split(':').map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(prayerHours, prayerMinutes, 0, 0);

    if (now < prayerDate) {
      nextPrayer = { ...prayer, date: prayerDate };
      break;
    }
  }

  if (!nextPrayer) {
    const [prayerHours, prayerMinutes] = prayerTimes[0].time.split(':').map(Number);
    const prayerDate = new Date();
    prayerDate.setDate(prayerDate.getDate() + 1);
    prayerDate.setHours(prayerHours, prayerMinutes, 0, 0);
    nextPrayer = { ...prayerTimes[0], date: prayerDate };
  }

  document.getElementById(nextPrayer.id).classList.add('active');
  document.getElementById('next-prayer-name').innerText = nextPrayer.name;
  document.getElementById('next-prayer-time').innerText = `Pukul ${nextPrayer.time} WIB`;

  const diffMs = nextPrayer.date - now;
  const diffHours = String(Math.floor((diffMs / (1000 * 60 * 60)) % 24)).padStart(2, '0');
  const diffMinutes = String(Math.floor((diffMs / (1000 * 60)) % 60)).padStart(2, '0');
  const diffSeconds = String(Math.floor((diffMs / 1000) % 60)).padStart(2, '0');

  document.getElementById('countdown').innerText = `${diffHours} : ${diffMinutes} : ${diffSeconds}`;
}

function updateRamadhanCountdown() {
  const now = new Date();
  const ramadhanDate = new Date('2027-02-18T00:00:00');
  const diffMs = ramadhanDate - now;

  if (diffMs > 0) {
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    document.getElementById('ramadhan-timer').innerText = `${days} Hari : ${hours} Jam`;
  } else {
    document.getElementById('ramadhan-timer').innerText = 'Selamat Menunaikan Ibadah Puasa';
  }
}

function bindRealtimeConfig() {
  onValue(ref(db, 'config'), (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (data.nama_masjid) document.getElementById('disp-nama-masjid').innerText = data.nama_masjid;
      if (data.alamat_masjid) document.getElementById('disp-alamat-masjid').innerText = data.alamat_masjid;
      if (data.running_text) document.getElementById('disp-running-text').innerText = data.running_text;
      if (data.city_id) {
        cityId = data.city_id;
        fetchKemenagPrayerTimes();
      }
      if (data.logo_url) {
        document.getElementById('logo-container').innerHTML = `<img src="${data.logo_url}" class="brand-logo-img" alt="Logo Masjid">`;
      }
    }
  });

  onValue(ref(db, 'config/kegiatan_lain'), (snapshot) => {
    const kegiatan = snapshot.val();
    if (kegiatan) {
      if (kegiatan.badge) document.getElementById('keg-badge').innerText = kegiatan.badge;
      if (kegiatan.judul) document.getElementById('agenda-keg-judul').innerText = kegiatan.judul;
      if (kegiatan.speaker) document.getElementById('agenda-keg-speaker').innerText = kegiatan.speaker;
      if (kegiatan.waktu) document.getElementById('agenda-keg-waktu').innerText = kegiatan.waktu;
    }
  });
}

function bindAgendaRotation() {
  onValue(ref(db, 'agendas'), (snapshot) => {
    const agendas = snapshot.val();
    if (agendaInterval) clearInterval(agendaInterval);

    if (agendas) {
      const agendaList = Object.values(agendas);
      let currentIndex = 0;

      const displayAgenda = (index) => {
        const item = agendaList[index];
        document.getElementById('agenda-badge').innerText = item.kategori || 'AGENDA';
        document.getElementById('agenda-judul').innerText = item.judul || '-';
        document.getElementById('agenda-penceramah').innerText = item.penceramah || '-';
        document.getElementById('agenda-waktu').innerText = item.waktu || '-';
      };

      displayAgenda(0);

      if (agendaList.length > 1) {
        agendaInterval = setInterval(() => {
          currentIndex = (currentIndex + 1) % agendaList.length;
          displayAgenda(currentIndex);
        }, 7000);
      }
    } else {
      document.getElementById('agenda-badge').innerText = 'AGENDA';
      document.getElementById('agenda-judul').innerText = 'Belum Ada Agenda';
      document.getElementById('agenda-penceramah').innerText = '-';
      document.getElementById('agenda-waktu').innerText = '-';
    }
  });
}

fetchRandomQuranVerse();
setInterval(fetchRandomQuranVerse, 15000);
updateDates();
fetchKemenagPrayerTimes();
setInterval(updateClockAndCountdown, 1000);
updateRamadhanCountdown();
bindRealtimeConfig();
bindAgendaRotation();
