# Issues de Bug pendientes de crear en Jira

> El MCP de Atlassian se desconectó al guardar. José crea estas 3 issues en
> https://helios-group.atlassian.net/jira/software/projects/HELL/boards/1
> con tipo **Bug** y estado **Done** (todas ya están resueltas).

---

## HELL-XX (Bug 1) — Registro duplicado: usuario con auth sin paciente

**Tipo:** Bug
**Estado:** Done
**Responsable:** José Brown (Product Owner)
**Story Points:** 2

**Descripción:**
```
Sintoma: Una usuaria (Marian) inicia sesion correctamente
(su email aparece en el header), pero la pagina /registro le muestra
el formulario completo de "Crear cuenta" en blanco, como si nunca
hubiera existido.

Causa raiz:
- Su fila en pacientes y auth_paciente_link fue borrada cuando se
  re-ejecuto seed_data.py (ver Bug 3)
- Quedo con auth.users vivo pero sin perfil de paciente
- Register.tsx version anterior no detectaba este caso

Fix: Register.tsx ahora detecta 3 escenarios:
1. Cargando sesion -> spinner
2. Auth + paciente completo -> redirige a /agendar
3. Auth sin paciente -> UI "Completa tu perfil de paciente"
   (solo pide nombre/cedula/telefono, reutiliza auth.users existente)
4. Sin sesion -> form normal de crear cuenta

Adicional: Login.tsx redirige inteligentemente segun el estado.
Adicional: auth_paciente_link usa UPSERT por idempotencia.

Archivos modificados:
- frontend/src/pages/Register.tsx
- frontend/src/pages/Login.tsx

Commit: 82dd420

Verificacion: Marian en ventana incognita login con su email -> ve
"Completa tu perfil" (no "Crear cuenta") -> llena 3 campos -> queda
lista en /agendar.
```

---

## HELL-XX (Bug 2) — Toolbar de navegación no responde a clicks

**Tipo:** Bug
**Estado:** Done
**Responsable:** Ethan Gonzalez (Dev Frontend)
**Story Points:** 1

**Descripción:**
```
Sintoma: Los NavLinks "Mis citas", "Agendar cita", "Cerrar sesion"
del header se ven en pantalla pero al hacer click no responden.
Reportado por 2 usuarias durante el demo.

Causa raiz: El <header> de AppLayout.tsx no tenia z-index ni position
definidos. Cuando FullCalendar se renderiza en /agendar, crea un
stacking context propio. En algunas resoluciones/navegadores los
NavLinks quedaban cubiertos por el calendario.

Fix:
- <header> ahora tiene "sticky top-0 z-50 bg-white shadow-sm"
- <nav> interno tiene "relative z-10" como defensa adicional
- <Link> del logo tiene "relative z-10"

Archivos modificados:
- frontend/src/components/layout/AppLayout.tsx

Verificacion: En produccion, hacer click en cada NavLink -> navega
correctamente. Tambien probar en /agendar (donde estaba el conflicto
con FullCalendar) -> clicks responden.

Tambien: el header ahora es "sticky" -> se mantiene visible al hacer
scroll, mejora la UX.
```

---

## HELL-XX (Bug 3) — Seed destructivo borra citas de usuarios reales

**Tipo:** Bug
**Estado:** Done
**Responsable:** Marian Barba (DevOps, dueña del seed)
**Story Points:** 2
**Severidad:** Alta (perdida de datos)

**Descripción:**
```
Sintoma: Una companera agendo una cita la tarde del 26 mayo.
Cuando volvio a entrar mas tarde, la cita habia desaparecido.
Igual paso con la cuenta de paciente de Marian.

Causa raiz: scripts/seed_data.py tenia reset_tables() que ejecutaba
DELETE FROM en TODAS las tablas antes de re-poblar:
- citas (datos de usuarios reales) <- BORRABA
- pacientes (datos de usuarios reales) <- BORRABA
- auth_paciente_link (datos de usuarios reales) <- BORRABA
- horarios (catalogo) - OK borrar
- medicos (catalogo) - OK borrar
- especialidades (catalogo) - OK borrar
- sedes (catalogo) - OK borrar

Cuando se re-ejecuto el seed para mejorar la distribucion de
medicos (garantizar 1 por combinacion sede x especialidad), borro
sin querer los datos reales.

Recuperacion: Supabase Free tier NO tiene Point-in-Time Recovery.
Las citas perdidas no se pueden recuperar.

Fix:
- reset_tables() solo borra catalogo: horarios, medicos,
  especialidades, sedes
- NUNCA toca: citas, pacientes, auth_paciente_link
- Funcion nueva hay_pacientes_reales() detecta si la BD ya tiene
  usuarios reales y omite la insercion de pacientes/citas de demo
- Mensajes claros: "AVISO: solo reemplaza catalogo"

Archivos modificados:
- scripts/seed_data.py

Verificacion: Correr seed contra BD con pacientes reales -> NO
borra pacientes/citas existentes. Solo refresca medicos y horarios.
Output muestra "Pacientes y citas reales PRESERVADAS".

Leccion aprendida: Cualquier script que toque la BD de produccion
debe tener safeguards explicitos para datos de usuarios reales.
```

---

---

## HELL-XX (Bug 4) — Loading infinito en useAuth.tsx (CRÍTICO)

**Tipo:** Bug
**Estado:** Done
**Responsable:** José Brown (Product Owner)
**Story Points:** 3
**Severidad:** Alta (app inutilizable cuando se manifestaba)

**Descripción:**
```
Sintoma: Cuando una usuaria hace click en "Agendar cita" o entra a la
pagina principal, la app se queda mostrando el spinner "Verificando
sesion..." infinitamente. La app es inutilizable.

Reportado por Marian y otra companera durante el demo del 27 mayo.

Causa raiz (3 problemas en useAuth.tsx):

1. onAuthStateChange callback NO llamaba setLoading(false)
   - Tras token refresh o signIn, loading podia quedar en true
   - Codigo viejo solo tenia setSession y setPaciente, sin setLoading

2. loadPaciente() sin try-catch
   - Si Supabase fallaba (RLS, red, timeout, cold start), excepcion
     propagaba y rompia la cadena .then() del getSession
   - setLoading(false) nunca se ejecutaba

3. getSession().then() sin .catch() ni try/finally
   - Mismo sintoma: cualquier fallo de red dejaba loading=true para siempre

Por que se manifesto AHORA y no antes:
- BD con mas datos (20 medicos, 5400 horarios) = queries un poco mas lentas
- Supabase Free tier cold start = 2-5s en primera request
- Probabilidad de timeout/fallo subio de ~1% a ~20-30%
- Sin try/catch, cada fallo dejaba app colgada

Fix aplicado:
1. init() envuelto en try/catch/finally con setLoading(false) en finally
2. onAuthStateChange callback envuelto igual
3. loadPaciente() con try/catch que setea paciente=null si falla
4. Manejo explicito de errores de Supabase (linkErr, pacErr)
5. console.error('[useAuth] ...') para debugging
6. signOut() tambien con try/catch/finally + setSession(null) defensivo

Adicional (encontrado por agente code-reviewer ANTES del deploy):
- HIGH severity: race condition en loadPaciente()
- Si llegan dos llamadas concurrentes con auth_uid distintos, la respuesta
  tardia podia mostrar paciente equivocado
- CRITICO en app medica (datos del paciente anterior tras logout/login)
- Fix con useRef<currentAuthUid> que descarta respuestas tardias

Archivos modificados:
- frontend/src/hooks/useAuth.tsx (refactor completo del provider)
- frontend/src/pages/Login.test.tsx (mock de useAuth agregado)
- frontend/src/pages/Register.test.tsx (mock de useAuth agregado)

Commit: a5e1021

Verificacion:
1. Tests: 39/39 pasan
2. Build: limpio
3. Deploy: HTTP 200 confirmado en produccion
4. Code review: agente pr-review-toolkit:code-reviewer ejecutado
   - 1 HIGH detectado y aplicado (race condition)
   - 2 LOW aplicadas (dependencies y signOut defensivo)
   - Aprobado para deploy
```

---

## Cómo crearlas (paso a paso para José)

1. Entrar a Jira → proyecto Helios → Backlog
2. Click **"Create"** arriba
3. Tipo: **Bug**
4. Pegar el resumen y descripción de cada bug
5. Asignar responsable según la tabla
6. Click el badge **To Do** → cambiar a **Done**
7. Repetir para los 3 bugs
8. Verificar que aparecen en el tab List junto a los 15 anteriores → total 18 issues
