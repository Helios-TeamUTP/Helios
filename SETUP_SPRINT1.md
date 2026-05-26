# Setup Sprint 1 — guía paso a paso

Esta guía completa el deploy del Sprint 1 desde el estado actual (código en local, sin pushear). Tiempo total estimado: 25–40 minutos.

Proyecto Supabase ya creado por Marian: `https://uobhbikcctausgpnzsph.supabase.co`

---

## Paso 1 — Configurar credenciales Supabase localmente (5 min)

Las API keys NO se comparten por chat. Las pegas tú directamente en archivos locales (que ya están en `.gitignore`, jamás se subirán al repo).

1. Abre https://supabase.com/dashboard/project/uobhbikcctausgpnzsph/settings/api
2. Copia el **`anon public`** key (es seguro para frontend).
3. Pega ese valor donde dice `PEGAR_ANON_KEY_AQUI` en:
   - `helios-repo/frontend/.env.local`
4. Copia el **`service_role`** key (este NUNCA va a un frontend ni a chats).
5. Pega ese valor donde dice `PEGAR_SERVICE_ROLE_AQUI` en:
   - `helios-repo/scripts/.env`

Ambos archivos están listos con la URL del proyecto ya rellena y placeholders donde van las keys.

---

## Paso 2 — Ejecutar el schema SQL en Supabase (3 min)

1. Abre https://supabase.com/dashboard/project/uobhbikcctausgpnzsph/sql/new
2. Copia el contenido completo de `helios-repo/supabase/schema.sql` (en este repo).
3. Pégalo en el SQL Editor de Supabase y pulsa **Run**.
4. Debes ver "Success. No rows returned." y un mensaje confirmando la creación de 7 tablas, la función RPC y las políticas RLS.
5. Verifica en https://supabase.com/dashboard/project/uobhbikcctausgpnzsph/editor que aparecen las tablas: `sedes`, `especialidades`, `medicos`, `horarios`, `pacientes`, `citas`, `auth_paciente_link`.

---

## Paso 3 — Poblar datos de prueba (3 min)

Desde la raíz de `helios-repo/`:

```powershell
pip install -r scripts/requirements.txt
python scripts/seed_data.py
```

Espera a ver el resumen:
```
[resumen]
  sedes:           3
  especialidades:  5
  medicos:         10
  horarios:        ~1890
  pacientes:       20
```

---

## Paso 4 — Probar la app localmente (2 min)

```powershell
cd frontend
pnpm dev
```

Abre http://localhost:5173 — deberías ver la página HELIOS. Prueba:

1. Click "Crear cuenta gratuita" → Registra con cédula válida (ej. `8-123-4567`).
2. Después de registrarse, click "Agendar una cita" → Wizard de 4 pasos.
3. Confirma la cita y verifica que aparece el código de confirmación.
4. Click "Ver mis citas" → debe listar la cita recién creada.

Si todo funciona, sigue al Paso 5. Si algo falla, abre la consola del navegador y compárteme el error.

---

## Paso 5 — Deploy en Railway (10 min)

### Opción A: Desde la UI Railway (más simple)

1. Entra a https://railway.app/new
2. "Deploy from GitHub repo" → selecciona `MarianC-programing/Helios`
3. En el servicio creado:
   - **Root Directory**: `frontend`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm preview --host 0.0.0.0 --port $PORT`
   - **Variables**: añade las dos variables del Paso 1:
     - `VITE_SUPABASE_URL` = `https://uobhbikcctausgpnzsph.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = (la misma anon key del paso 1)
4. Pestaña **Settings → Networking → Generate Domain**: genera el dominio público (ej. `helios-citas-production.up.railway.app`).
5. Espera ~3 minutos al primer build.

### Opción B: Railway CLI

```powershell
npm install -g @railway/cli
railway login
railway link
railway up --service helios-frontend
railway domain
```

---

## Paso 6 — Generar QR para la demo del jueves (1 min)

Con el URL público de Railway:

```powershell
pip install qrcode[pil]
python -c "import qrcode; qrcode.make('https://TU_DOMINIO.up.railway.app').save('dailys/qr_demo.png')"
```

Pega el QR en la diapositiva 2 del PPTX (slot reservado donde dice "QR aquí").

---

## Paso 7 — Conectar SonarCloud (5 min)

1. Entra a https://sonarcloud.io con la cuenta de GitHub de Marian.
2. **Add new project** → autoriza repo `MarianC-programing/Helios`.
3. Selecciona "Setup with GitHub Actions" si quieres CI automático, o "Manual analysis" para esta semana.
4. Para análisis manual desde local:
   ```powershell
   cd helios-repo
   pnpm --filter frontend test --coverage
   npx -y sonarcloud-scanner
   ```
5. Captura el dashboard → pega en slide 5 del PPTX (donde dice "X" en code smells y debt ratio).

---

## Paso 8 — Correr Locust contra el deploy (3 min)

Una vez Railway está vivo:

```powershell
locust -f scripts/locustfile.py --host=https://uobhbikcctausgpnzsph.supabase.co --users 200 --spawn-rate 20 --run-time 60s --headless --html scripts/locust_report.html
```

(Empezamos con 200 usuarios; si Supabase free tier aguanta, sube a 500.)

El HTML `scripts/locust_report.html` tiene P50/P95/P99 — captura del dashboard y agrega a la diapositiva 5.

---

## Paso 9 — Actualizar PPTX y push final

Después de tener los datos reales (deploy URL, QR, métricas Locust, dashboard Sonar):

1. Reemplaza valores placeholder en la diapositiva 5 con los reales.
2. Cuando estés conforme, autoriza el push:
   ```powershell
   cd helios-repo
   git push -u origin sprint1/bootstrap
   ```
3. Abre el PR con el cuerpo de `PR_BODY.md` (en la raíz del repo).

---

## Si algo falla

- **`pnpm install` falla**: verifica Node ≥20. Tu versión actual es 24.14 ✓.
- **Supabase rechaza el insert del seed**: confirma que copiaste el `service_role` key, no el `anon`.
- **`pnpm dev` muestra "Faltan VITE_SUPABASE_URL"**: el `.env.local` no se cargó. Revísalo y reinicia el dev server.
- **Railway falla el build**: revisa que el Root Directory sea `frontend/` y no la raíz.
- **El wizard no muestra médicos**: el seed no corrió o las tablas están vacías. Vuelve al Paso 3.
