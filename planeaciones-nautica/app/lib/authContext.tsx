"use client";

// Contexto de autenticación (cliente). Expone el usuario actual, el estado de
// carga, un posible mensaje de error y las acciones de entrar/salir.
//
// Restricción de dominio en el CLIENTE (primera capa): el login sugiere el
// dominio institucional con `hd` y, si aun así entra un correo de otro dominio,
// se cierra la sesión de inmediato y se muestra un mensaje claro en español. La
// verificación REAL e infalsificable ocurre en el servidor (segunda capa).

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  browserLocalPersistence,
  setPersistence,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, googleProvider, firebaseConfigurado } from "./firebaseClient";
import { DOMINIO_PERMITIDO, esAdminEmail, esDominioPermitido } from "./config";

const MENSAJE_DOMINIO = `Debes usar tu correo institucional de FIDENA (@${DOMINIO_PERMITIDO}).`;

const MENSAJE_FALLO_GENERICO = "No se pudo iniciar sesión. Inténtalo de nuevo.";

/** Causas conocidas de fallo al abrir el acceso con Google, en lenguaje claro
 *  para el docente y accionable para quien da soporte. */
const MENSAJE_FALLO: Record<string, string> = {
  "auth/unauthorized-domain":
    "Esta dirección de internet no está autorizada para iniciar sesión. Entra por la liga oficial: planeaciones-nautica.vercel.app",
  "auth/popup-blocked":
    "El navegador bloqueó la ventana de Google. Permite las ventanas emergentes de este sitio y vuelve a intentar.",
  "auth/operation-not-allowed":
    "El acceso con Google no está habilitado en el proyecto. Contacta al administrador del sistema.",
  "auth/network-request-failed":
    "No hay conexión con Google. Revisa tu internet y vuelve a intentar.",
  "auth/internal-error":
    "Google rechazó la solicitud de acceso. Contacta al administrador del sistema.",
};

type AuthContextValor = {
  /** Usuario autenticado y con dominio válido, o null. */
  usuario: User | null;
  /** true mientras se resuelve el estado inicial de sesión. */
  cargando: boolean;
  /** Mensaje de error para mostrar en la pantalla de login (o null). */
  error: string | null;
  /** ¿La sesión es la cuenta administradora? */
  esAdmin: boolean;
  /** true si faltan las credenciales de Firebase (mal configurado). */
  noConfigurado: boolean;
  entrar: () => Promise<void>;
  salir: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      // Firebase no configurado: no hay sesión posible; dejamos de cargar.
      setCargando(false);
      return;
    }
    // Sesión persistente entre recargas y cierres del navegador.
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && !esDominioPermitido(u.email)) {
        // Correo de otro dominio: rechazar (segunda capa la aplica el servidor).
        setError(MENSAJE_DOMINIO);
        setUsuario(null);
        signOut(auth!).catch(() => {});
      } else {
        setUsuario(u);
        if (u) setError(null);
      }
      setCargando(false);
    });
    return () => unsub();
  }, []);

  const entrar = async () => {
    if (!auth) {
      setError(
        "El acceso aún no está configurado. Contacta al administrador del sistema.",
      );
      return;
    }
    setError(null);
    try {
      // `hd` sugiere el dominio institucional en el selector de Google.
      googleProvider.setCustomParameters({
        hd: DOMINIO_PERMITIDO,
        prompt: "select_account",
      });
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithPopup(auth, googleProvider);
      if (!esDominioPermitido(cred.user.email)) {
        setError(MENSAJE_DOMINIO);
        await signOut(auth);
      }
    } catch (e) {
      // El usuario cerró el popup: no es un fallo, no molestamos con un error.
      const code = (e as { code?: string })?.code ?? "";
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      // El resto sí son fallos reales. Un mensaje genérico deja al docente sin
      // saber qué hacer y a quien da soporte sin saber qué revisar, así que
      // cada causa conocida se nombra y se incluye el código al final.
      setError(`${MENSAJE_FALLO[code] ?? MENSAJE_FALLO_GENERICO} (${code})`);
    }
  };

  const salir = async () => {
    if (auth) await signOut(auth).catch(() => {});
    setUsuario(null);
  };

  const valor: AuthContextValor = {
    usuario,
    cargando,
    error,
    esAdmin: esAdminEmail(usuario?.email),
    noConfigurado: !firebaseConfigurado,
    entrar,
    salir,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValor {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
