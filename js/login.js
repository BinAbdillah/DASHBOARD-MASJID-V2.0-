import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

document.getElementById('btn-login').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('password').value;

  signInWithEmailAndPassword(auth, email, pass)
    .then(() => {
      window.location.href = 'admin.html';
    })
    .catch((err) => {
      alert('Login gagal: ' + err.message);
    });
});
