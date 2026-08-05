import { defineConfig } from "vitest/config";

// Suite de no-regresión del flujo de Inglés Marítimo (D9 de DEUDA-TECNICA-INGLES.md).
//
// Regla de la suite: PURA y SIN RED. Ninguna prueba puede depender de que haya
// un servidor levantado, ni de GEMINI_API_KEY / ANTHROPIC_API_KEY. Una prueba
// que exige una clave no se ejecuta nunca y por tanto no protege nada.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Las pruebas leen la plantilla F-32 y el índice con rutas relativas a la
    // raíz de la app; process.cwd() debe ser esta carpeta.
    root: import.meta.dirname,
    testTimeout: 20000,
  },
});
