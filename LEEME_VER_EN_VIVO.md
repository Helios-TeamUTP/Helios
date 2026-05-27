# Como ver HELIOS en vivo mientras Claude trabaja

> Esta guia explica como abrir el proyecto en VS Code y ver en tiempo real
> los cambios que Claude (u otro miembro del equipo) hace al codigo y a la web.
>
> Esta hecha para Jose (PO) — pasos en orden, sin dar nada por sentado.

---

## Resumen en 30 segundos

| Quieres ver... | Haz esto |
|---|---|
| Los archivos que Claude esta editando | Doble-click `abrir-helios.bat` |
| La web HELIOS actualizandose sola | `abrir-helios.bat` + en VS Code corre la tarea `HELIOS: Dev server` |
| Los ultimos commits que hizo Claude | En VS Code: `Ctrl+Shift+P` -> `Run Task` -> `HELIOS: Git log` |

---

## Paso 1 — Abrir el proyecto

### Opcion mas facil (doble-click)

1. Ve a la carpeta `helios-repo/` (donde esta este archivo).
2. Doble-click en **`abrir-helios.bat`**.
3. VS Code se abre con todo el proyecto organizado:
   - Raiz HELIOS (CLAUDE.md, README, configuracion)
   - Frontend (React) — el codigo de la app
   - Docs — documentacion del Sprint 1
   - Scripts (Python) — seed_data, locust
   - Supabase (SQL) — schema de la BD
   - Backend — (vacio por ahora)

### Si el .bat te da error

Significa que VS Code no agrego el comando `code` al PATH de Windows.
Solucion:

1. Abre VS Code manualmente (icono en escritorio o Inicio).
2. Presiona `Ctrl + Shift + P`.
3. Escribe: **`Shell Command: Install 'code' command in PATH`** y selecciona esa opcion.
4. Cierra todas las terminales abiertas.
5. Vuelve a hacer doble-click en `abrir-helios.bat`.

### Opcion manual (sin .bat)

1. Abre VS Code.
2. `File` -> `Open Workspace from File...`
3. Navega a `helios-repo/` y selecciona `helios.code-workspace`.

---

## Paso 2 — Ver la web actualizarse en vivo

Para que cuando Claude cambie un `.tsx`, la pagina del navegador se refresque
sola en menos de un segundo, necesitas levantar el **dev server**.

### Opcion mas facil (atajo de VS Code)

1. Con el workspace abierto en VS Code, presiona `Ctrl + Shift + P`.
2. Escribe **`Run Task`** y dale Enter.
3. Selecciona **`HELIOS: Dev server (Vite + hot reload)`**.
4. Se abre una terminal abajo con esto:
   ```
   VITE v8.x  ready in 1234 ms
   -> Local:   http://localhost:5173/
   ```
5. Abre tu navegador (Chrome/Edge) en `http://localhost:5173`.
6. Listo. La web HELIOS esta corriendo. Cada vez que Claude (o tu) cambie
   codigo, el navegador se refresca solo (Hot Module Replacement de Vite).

### Opcion manual (terminal)

1. En VS Code, abre la terminal: `Ctrl + Ñ` (o menu `Terminal -> New Terminal`).
2. Ejecuta:
   ```powershell
   cd frontend
   pnpm dev
   ```
3. Abre `http://localhost:5173` en el navegador.

---

## Paso 3 — Ver lo que Claude esta cambiando

### A. Archivos modificados (panel de Source Control)

1. En VS Code, click en el icono de **rama** en la barra izquierda (o `Ctrl+Shift+G`).
2. Veras una lista de archivos modificados desde el ultimo commit.
3. Click en cualquier archivo para ver el **diff** lado a lado (verde = agregado, rojo = borrado).

### B. Historial de commits (lo que Claude ya termino)

`Ctrl + Shift + P` -> `Run Task` -> **`HELIOS: Git log (ultimos 10 commits)`**.

Veras algo asi:
```
a0f4d50 team(agentes): activar equipo HELIOS local en .claude/agents
db6105c fix(auth): Bug B-10 - withTimeout en Login y Register evita spinner eterno
bf4455c docs(metricas): tasa defectos 5.26 bugs/KLOC con B-08 y B-09 + practica equipo
87c6c84 fix(security): Bug B-09 - sessionStorage para auth (cerrar tab = logout)
```

### C. Archivos abiertos en tiempo real

Si tienes un archivo abierto en VS Code y Claude lo modifica:
- VS Code detecta el cambio automaticamente.
- El contenido del editor se actualiza.
- Si tenias scroll en cierta parte, se mantiene cerca.

---

## Tareas utiles (atajos desde VS Code)

`Ctrl + Shift + P` -> **`Run Task`** -> elige:

| Tarea | Para que |
|---|---|
| `HELIOS: Dev server (Vite + hot reload)` | Levanta la web en localhost:5173 |
| `HELIOS: Tests (Vitest 52 tests)` | Corre los 52 tests del frontend |
| `HELIOS: Coverage report` | Tests + cobertura (debe ser >=60% statements) |
| `HELIOS: Build (verificar compilacion)` | Verifica que el proyecto compila sin errores |
| `HELIOS: Git status` | Muestra archivos modificados |
| `HELIOS: Git log (ultimos 10 commits)` | Ultimos 10 commits hechos |

---

## Verificar el bug B-10 que se acaba de arreglar

El fix recien empujado (`db6105c`) evita que el spinner del login quede eterno
cuando Supabase tarda. Para verlo funcionando:

1. Levanta el dev server (paso 2 de arriba).
2. Abre `http://localhost:5173/login` en Chrome.
3. Abre DevTools (`F12`) -> pestaña `Network` -> en `Throttling` elige `Offline`.
4. Intenta hacer login con cualquier email/password.
5. **Antes del fix:** el boton "Iniciar sesion" quedaba girando eterno.
6. **Con el fix:** a los 15 segundos aparece el mensaje:
   > "El servidor tardo demasiado en responder. Verifica tu conexion e intenta de nuevo."
7. El boton se rehabilita y puedes reintentar.
8. Cambia Throttling de vuelta a `Online` y prueba con tus credenciales reales.

---

## Si algo falla

### "pnpm no se reconoce como comando"

```powershell
npm install -g pnpm
```
(Necesitas Node.js instalado primero: https://nodejs.org)

### "El puerto 5173 esta en uso"

Hay otro proceso usando el puerto. Cierralo o usa otro:
```powershell
cd frontend
pnpm dev --port 5174
```
Luego abre `http://localhost:5174`.

### No se refresca la web cuando Claude cambia codigo

1. Revisa que el dev server siga corriendo (terminal de VS Code).
2. F5 manualmente en el navegador.
3. Si persiste: en la terminal del dev server presiona `Ctrl + C` para parar,
   y vuelve a ejecutar `pnpm dev`.

### Quiero ver las metricas en vivo

`Ctrl + Shift + P` -> `Run Task` -> `HELIOS: Coverage report`.
Se abrira en otra terminal y al terminar veras:
```
Statements   : 61.4% ( 253/412 )
Branches     : 47.23% ( 162/343 )
Functions    : 90.9% ( 30/33 )
Lines        : 82% ( 205/250 )
```

---

## Atajos de teclado que valen la pena memorizar

| Atajo | Que hace |
|---|---|
| `Ctrl + P` | Buscar archivo por nombre |
| `Ctrl + Shift + F` | Buscar texto en todo el proyecto |
| `Ctrl + Shift + G` | Abrir panel de Git (ver diffs) |
| `Ctrl + Shift + P` | Abrir paleta de comandos (Run Task, etc) |
| `Ctrl + Ñ` | Abrir terminal en VS Code |
| `Ctrl + B` | Mostrar/ocultar barra lateral |
| `Ctrl + ,` | Abrir Settings |
| `F12` | Ir a definicion (sobre una funcion/clase) |

---

_Mantenido por el equipo HELIOS. Si algo no funciona, pinga a Marian (DevOps)._
