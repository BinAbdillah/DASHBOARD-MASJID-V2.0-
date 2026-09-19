import { db, ref, onValue } from './firebase-config.js';
import { $, $$, setText } from './utils.js';

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

function setTimeText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

async function fetchRandomQuranVerse() {
  const quranBox = $('#quran-box');
  quranBox.classList.add('fade-out');

  setTimeout(async () => {
    let isLoaded = false;

    try {
      const randomAyah = Math.floor(Math.random() * 6236) + 1;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyah}/editions/quran-uthmani,id.indonesian`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.data) {
          setText('#quran-arabic', data.data[0].text);
          setText('#quran-translation', `"${data.data[1].text}" — QS. ${data.data[0].surah.englishName}: ${data.data[0].numberInSurah}`);
          isLoaded = true;
        }
      }
    } catch (error) {
      isLoaded = false;
    }

    if (!isLoaded) {
      const item = fallbackAyahs[fallbackIndex];
      setText('#quran-arabic', item.ar);
      setText('#quran-translation', item.tr);
      fallbackIndex = (fallbackIndex + 1) % fallbackAyahs.length;
    }

    quranBox.classList.remove('fade-out');
  }, 800);
}

function updateDates() {
  const now = new Date();
  const optionsMasehi = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  setText('#date-masehi', now.toLocaleDateString('id-ID', optionsMasehi));

  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  fetch(`https://api.aladhan.com/v1/gToH/${day}-${month}-${year}`)
    .then((response) => response.json())
    .then((data) => {
      if (data && data.data) {
        const hijriDate = data.data.hijri;
        setText('#date-hijri', `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} H`);
      }
    })
    .catch(() => {
      setText('#date-hijri', '-- Safar 1448 H');
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

      setTimeText('time-subuh', `${j.subuh} WIB`);
      setTimeText('time-dzuhur', `${j.dzuhur} WIB`);
      setTimeText('time-ashar', `${j.ashar} WIB`);
      setTimeText('time-maghrib', `${j.maghrib} WIB`);
      setTimeText('time-isya', `${j.isya} WIB`);
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
  setText('#clock', `${hours}.${minutes}.${seconds} WIB`);

  if (!prayerSchedule.Subuh) return;

  const prayerTimes = [
    { name: 'SUBUH', time: prayerSchedule.Subuh, id: 'p-subuh' },
    { name: 'DZUHUR', time: prayerSchedule.Dzuhur, id: 'p-dzuhur' },
    { name: 'ASHAR', time: prayerSchedule.Ashar, id: 'p-ashar' },
    { name: 'MAGHRIB', time: prayerSchedule.Maghrib, id: 'p-maghrib' },
    { name: 'ISYA', time: prayerSchedule.Isya, id: 'p-isya' }
  ];

  $$('.prayer-item').forEach((element) => element.classList.remove('active'));

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
  setText('#next-prayer-name', nextPrayer.name);
  setText('#next-prayer-time', `Pukul ${nextPrayer.time} WIB`);

  const diffMs = nextPrayer.date - now;
  const diffHours = String(Math.floor((diffMs / (1000 * 60 * 60)) % 24)).padStart(2, '0');
  const diffMinutes = String(Math.floor((diffMs / (1000 * 60)) % 60)).padStart(2, '0');
  const diffSeconds = String(Math.floor((diffMs / 1000) % 60)).padStart(2, '0');

  setText('#countdown', `${diffHours} : ${diffMinutes} : ${diffSeconds}`);
}

function updateRamadhanCountdown() {
  const now = new Date();
  const ramadhanDate = new Date('2027-02-18T00:00:00');
  const diffMs = ramadhanDate - now;

  if (diffMs > 0) {
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    setText('#ramadhan-timer', `${days} Hari : ${hours} Jam`);
  } else {
    setText('#ramadhan-timer', 'Selamat Menunaikan Ibadah Puasa');
  }
}

function bindRealtimeConfig() {
  onValue(ref(db, 'config'), (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (data.nama_masjid) setText('#disp-nama-masjid', data.nama_masjid);
      if (data.alamat_masjid) setText('#disp-alamat-masjid', data.alamat_masjid);
      if (data.running_text) setText('#disp-running-text', data.running_text);
      if (data.city_id) {
        cityId = data.city_id;
        fetchKemenagPrayerTimes();
      }
      if (data.logo_url) {
        $('#logo-container').innerHTML = `<img src="${data.logo_url}" class="brand-logo-img" alt="Logo Masjid">`;
      }
    }
  });

  onValue(ref(db, 'config/kegiatan_lain'), (snapshot) => {
    const kegiatan = snapshot.val();
    if (!kegiatan) return;

    if (kegiatan.badge) setText('#keg-badge', kegiatan.badge);
    if (kegiatan.judul) setText('#agenda-keg-judul', kegiatan.judul);
    if (kegiatan.speaker) setText('#agenda-keg-speaker', kegiatan.speaker);
    if (kegiatan.waktu) setText('#agenda-keg-waktu', kegiatan.waktu);
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
        setText('#agenda-badge', item.kategori || 'AGENDA');
        setText('#agenda-judul', item.judul || '-');
        setText('#agenda-penceramah', item.penceramah || '-');
        setText('#agenda-waktu', item.waktu || '-');
      };

      displayAgenda(0);

      if (agendaList.length > 1) {
        agendaInterval = setInterval(() => {
          currentIndex = (currentIndex + 1) % agendaList.length;
          displayAgenda(currentIndex);
        }, 7000);
      }
    } else {
      setText('#agenda-badge', 'AGENDA');
      setText('#agenda-judul', 'Belum Ada Agenda');
      setText('#agenda-penceramah', '-');
      setText('#agenda-waktu', '-');
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
