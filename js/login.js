import { auth } from './firebase-config.js';
import { $, isValidEmail, isNonEmpty, showToast } from './utils.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

$('#btn-login').addEventListener('click', async () => {
  const email = $('#email').value.trim();
  const password = $('#password').value;

  if (!isValidEmail(email)) {
    showToast('Format email tidak valid.', 'error');
    return;
  }

  if (!isNonEmpty(password)) {
    showToast('Password wajib diisi.', 'error');
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = 'admin.html';
  } catch (error) {
    showToast(`Login gagal: ${error.message}`, 'error');
  }
});
