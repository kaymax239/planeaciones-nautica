// Inicialización PEREZOSA de firebase-admin (servidor). Se crea la app solo la
// primera vez que una ruta la necesita en tiempo de ejecución; nunca en el build
// (los handlers no se ejecutan al compilar), así que la ausencia de credenciales
// no rompe la compilación.
//
// Credenciales por variables de entorno (cuenta de servicio):
//   FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
// La private key admite el formato con "\n" escapados (como se pega en Vercel).

import {
  getApps,
  initializeApp,
  cert,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;

/** ¿Están presentes las tres credenciales de la cuenta de servicio? */
export function adminConfigurado(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  );
}

function obtenerApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  );
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
  return app;
}

export function adminAuth(): Auth {
  return getAuth(obtenerApp());
}

export function adminDb(): Firestore {
  return getFirestore(obtenerApp());
}
