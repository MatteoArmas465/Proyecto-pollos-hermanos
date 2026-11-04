import { auth } from '../firebase/config.js';
import {
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export const ADMIN_EMAIL = '61186037@continental.edu.pe';

export const loginConGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());

export const registrarConCorreo = async (nombre, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (nombre) await updateProfile(cred.user, { displayName: nombre });
    return cred.user;
};

export const loginConCorreo = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

export const cerrarSesion = () => signOut(auth);

export const escucharSesion = (callback) => onAuthStateChanged(auth, callback);

export const esAdmin = (user) =>
    !!user && user.email === ADMIN_EMAIL && user.emailVerified !== false;

// Traduce los errores de Firebase a mensajes claros
export const mensajeError = (err) => {
    const mensajes = {
        'auth/invalid-email': 'El correo no es válido.',
        'auth/missing-password': 'Escribe tu contraseña.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Inicia sesión.',
        'auth/invalid-credential': 'Correo o contraseña incorrectos.',
        'auth/user-not-found': 'Correo o contraseña incorrectos.',
        'auth/wrong-password': 'Correo o contraseña incorrectos.',
        'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
        'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
        'auth/cancelled-popup-request': 'Cerraste la ventana de Google antes de terminar.',
        'auth/popup-blocked': 'Tu navegador bloqueó la ventana. Permite los pop-ups.',
        'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase.',
        'auth/network-request-failed': 'Sin conexión. Revisa tu internet.'
    };
    return mensajes[err.code] || 'No se pudo completar la acción. Intenta de nuevo.';
};