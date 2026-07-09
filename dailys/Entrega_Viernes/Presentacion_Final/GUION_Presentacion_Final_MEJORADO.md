# GUION — Presentación Final del Producto (mejorado)

> Proyecto HELIOS · Cierre del proyecto · UTP Calidad de Software 2026
> Reparto: **Marian → Ethan → José → Alejandro → Ashley → Marian**
> Duración total ≈ 4 min 5 s · 6 slides · versión "venta"
>
> Cambios vs el guion original (8-jul-2026):
> - El límite de citas por médico pasó de *roadmap* a **producción** (lo construimos hoy).
> - Número alineado al del médico real: **15 citas/día**.
> - Métricas al día: **141 tests** + historia de **CI/CD** (auto-deploy).
> - La demo muestra el **"Día completo"** (el límite en acción).

---

## MARIAN — Slide 1 (Portada + gancho, 20s)
"Buenas, profesora y compañeros. Somos el Grupo HELIOS. En Panamá, agendar una cita en una policlínica todavía significa llamar, esperar o hacer fila. Nosotros construimos un sistema que lo resuelve: agendar, cancelar, reprogramar y recibir notificación — todo en menos de 2 minutos, desde el celular. Hoy no les vamos a contar solo cómo lo construimos: se los vamos a mostrar funcionando, y les vamos a contar qué dijo un médico real que lo probó."

## ETHAN — Slide 2 (Demo en vivo, primero, 60s)
"Empezamos por lo más importante: verlo funcionar.
[Demo en vivo en **helios-web-production.up.railway.app**: registrar paciente → agendar cita → la campanita y el correo llegan solos.]
Lo que acaban de ver no tiene truco: no recargamos la página, no revisamos nada a mano. El sistema avisó solo, en segundos, dentro de la web y al correo. Y fíjense en esto: cuando un médico llena su día, la agenda marca **'Día completo'** y ya no deja agendar — ahora les cuenta José por qué eso está aquí. Le paso."

## JOSÉ — Slide 3 (Validación real: feedback del médico, 60s)
"Todo lo que vieron lo construimos nosotros. Pero lo que de verdad valida un producto de salud es que alguien ajeno al equipo lo use con criterio clínico. Por eso llevamos HELIOS a un médico que trabaja en salud pública, en una policlínica — el contexto real para el que lo diseñamos. Fue una prueba guiada, sin pacientes ni consultas reales.
Su reacción fue clara: le pareció increíble, y destacó algo que no esperábamos — el estilo visual y los colores. En salud eso importa más de lo que parece: un sistema confuso genera desconfianza antes de que el paciente use una sola función.
Pero lo más valioso no fue el elogio — fue su recomendación: establecer un **máximo de 15 pacientes por día por médico**, basado en su propia experiencia gestionando consultas. Esa cifra no salió de nosotros: salió de alguien que vive el problema todos los días. Le paso a Alejandro."

## ALEJANDRO — Slide 4 (De la recomendación a PRODUCCIÓN, 45s)
"Y esto es lo que quiero que vean: no nos quedamos en el elogio. La recomendación del médico — el límite de **15 citas por día por médico** — no la dejamos en el roadmap. **La implementamos, la verificamos y ya está corriendo en producción**, en el mismo ciclo.
Y la blindamos en tres capas: la base de datos rechaza cualquier cita que pase del tope, con un candado que evita que dos pacientes lo salten a la vez; reprogramar también respeta el límite; y la interfaz muestra los días llenos como 'Día completo'. Antes de desplegarlo lo pasamos por una revisión adversarial de cinco enfoques distintos.
Y algo que también corre hoy, no en el roadmap: las notificaciones — campanita y correo — funcionan de forma autónoma. Nadie las reinicia ni las tiene corriendo en su laptop. Eso, para un sistema de salud, es lo que separa un proyecto de clase de algo que se sostiene solo. Le paso a Ashley."

## ASHLEY — Slide 5 (Calidad + ingeniería, 30s)
"Para que sepan que esto no es solo una demo bien montada: **141 pruebas automáticas** corren en cada cambio, con un umbral que rechaza el código si la cobertura baja del 60%. Usamos SonarCloud para calidad de código y Supabase con seguridad a nivel de fila, para que cada paciente y cada médico solo vea lo suyo. Y cada cambio se despliega solo con **integración y despliegue continuo** — dos robots en GitHub Actions. Lo construimos con la misma disciplina con la que lo presentamos."

## MARIAN — Slide 6 (Cierre, 30s)
"HELIOS ya no es un ejercicio de clase — es un sistema desplegado, probado por alguien ajeno al equipo, y funcionando de forma autónoma. Construimos algo que resuelve un problema real en Panamá: que agendar una cita médica no debería tomar más de dos minutos. Pueden probarlo ustedes mismos ahora mismo en el link. ¿Preguntas?"

---

## Notas técnicas por si preguntan
- **¿El límite funciona de verdad?** Sí: `crear_cita_atomica` en la BD rechaza la cita que exceda 15/día con un *advisory lock* por (médico, fecha) que serializa dos agendamientos simultáneos. No es solo visual.
- **¿Y si el médico cancela una cita?** El cupo se libera (el conteo ignora las canceladas).
- **¿Cómo llegan las notificaciones?** Un trigger en la BD encola el aviso; un worker independiente lo procesa (campanita in-app por Realtime; correo por API HTTP de Brevo).
- **¿Cómo despliegan?** Push a `main` → GitHub Actions corre `railway up` → Railway despliega. Sin pasos manuales.
- **Métricas:** 141 tests · cobertura ≥60% (umbral en CI) · RLS por rol · P95 ~300 ms (Locust, 200 usuarios).
