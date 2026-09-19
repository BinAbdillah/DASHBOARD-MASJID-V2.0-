import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { auth } from './firebase-config.js';
import { $ } from './utils.js';

$('#btn-login').addEventListener('click', () => {
  const email = $('#email').value;
  const password = $('#password').value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = 'admin.html';
    })
    .catch((error) => {
      alert(`Login gagal: ${error.message}`);
    });
});
