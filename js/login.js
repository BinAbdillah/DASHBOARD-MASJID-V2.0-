import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { auth } from './firebase-config.js';

document.getElementById('btn-login').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('password').value;

  signInWithEmailAndPassword(auth, email, pass)
    .then(() => {
      window.location.href = 'admin.html';
    })
    .catch((error) => {
      alert(`Login gagal: ${error.message}`);
    });
});
