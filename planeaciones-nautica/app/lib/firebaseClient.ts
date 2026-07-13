// Inicialización del SDK de Firebase en el CLIENTE (navegador). La configuración
// pública (apiKey, authDomain, etc.) NO es secreta: identifica el proyecto y las
// reglas de seguridad se aplican en el servidor. Si faltan las variables
// NEXT_PUBLIC_FIREBASE_* (p. ej. en un build local sin configurar), se exporta
// `auth = null` y la app muestra un estado de "no configurado" en lugar de
// romper la compilación.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** true cuando la configuración mínima de Firebase está presente. */
export const firebaseConfigurado = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

if (firebaseConfigurado) {
  app = getApps().length ? getApp() : initializeApp(config);
  authInstance = getAuth(app);
}

/** Instancia de Auth del cliente, o null si Firebase no está configurado. */
export const auth = authInstance;

/** Proveedor de Google preconfigurado; el parámetro `hd` (hosted domain) se
 *  añade en el momento del login para sugerir el dominio institucional. */
export const googleProvider = new GoogleAuthProvider();
