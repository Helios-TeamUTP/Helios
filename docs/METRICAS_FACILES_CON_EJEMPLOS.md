# Métricas del Sprint 1 — Explicadas con ejemplos de la vida real

> **No te asustes con la jerga.** Cada métrica de la diapositiva 6 está aquí explicada
> como si se la estuvieras contando a alguien que nunca ha programado.
> Léelo en voz alta antes de la presentación.

---

## ¿Por qué tantas métricas?

La profesora quiere que demostremos que medimos la calidad de lo que hicimos.
Es como cuando un cocinero no solo dice **"el pastel quedó bueno"** sino que muestra:
- "El horno estuvo a 180°C exactos" (temperatura)
- "Lo dejé 30 min exactos" (tiempo)
- "Pesa 1.2 kg" (cantidad)
- "Lo probamos 3 personas y todos lo aprobaron" (testing)

Nosotros hacemos lo mismo pero con software.

---

## Métrica 1: Cobertura de Tests = 65.26%

### 🎯 Imagina esto
Tu mamá te dejó una receta de pastel con 100 pasos. Antes de servirlo a la fiesta,
quieres asegurarte de que el pastel quedó bien. Vas paso por paso probando:
"el azúcar está, sí; la harina está, sí; el huevo está, sí..."

Pero solo tienes tiempo de probar 65 pasos de los 100. **Tu cobertura es 65%.**

### 📊 Nuestro número
Nosotros tenemos 65.26% de cobertura. Significa que de cada 100 líneas de código
que escribimos, **65 están probadas automáticamente**.

### 💬 Cómo explicarlo en clase
> *"Cobertura del 65% significa que 65 de cada 100 líneas tienen una prueba automática
> que verifica que funcionan. Es como un examen sorpresa que el código pasa cada
> vez que alguien quiere agregar un cambio nuevo."*

### ❓ Si te preguntan "¿por qué no 100%?"
> *"Llegar al 100% no es realista en una sola semana. Nuestro objetivo del Sprint 1
> era 60% y lo superamos. Sprint 2 vamos por 75%."*

---

## Métrica 2: 39 de 39 tests pasando = 100%

### 🎯 Imagina esto
Tu profesor te puso 39 problemas de matemáticas. Los entregas todos resueltos
y los 39 están bien. **Sacaste 100% en el examen.**

### 📊 Nuestro número
Tenemos 39 pruebas automáticas escritas. Cada vez que cambiamos algo en el código,
las 39 se ejecutan solas en unos 14 segundos. **Las 39 pasan, ninguna falla.**

### 💬 Cómo explicarlo en clase
> *"Tenemos 39 pruebas automatizadas que se corren cada vez que alguien guarda un
> cambio. Como tener 39 vigilantes invisibles que avisan si algo se rompió."*

### ❓ Si te preguntan "¿qué prueban exactamente?"
> *"Cosas como: que la validación de cédula panameña funcione, que el selector de
> especialidad muestre las 5 opciones, que la página de Mis Citas muestre el código
> de confirmación correcto."*

---

## Métrica 3: Latencia P95 = 300ms (target era 2000ms)

### 🎯 Imagina esto
Estás en la fila de un Subway. **P95 significa "el peor de cada 20 clientes".**

Si P95 es 5 minutos, significa que de cada 20 personas en la fila,
solo 1 espera más de 5 minutos. Las otras 19 son más rápidas.

**Nuestro P95 es 300 milisegundos.** Eso es **un tercio de un segundo**.
Un parpadeo dura unos 400 ms — somos más rápidos que un parpadeo.

### 📊 Nuestro número
Cuando 200 personas usan HELIOS al mismo tiempo, **el 95% recibe respuesta en
menos de 0.3 segundos**. Solo el 5% más lento espera hasta 1.1 segundos.

### 💬 Cómo explicarlo en clase
> *"Probamos el sistema con 200 personas usándolo al mismo tiempo durante un minuto.
> El 95% de las respuestas llegaron en menos de 0.3 segundos. El profesor pedía
> menos de 2 segundos — somos 6 veces más rápidos que el objetivo."*

### ❓ Si te preguntan "¿cómo simularon 200 personas?"
> *"Usamos Locust, que es una herramienta de Python que simula usuarios virtuales.
> Cada uno hace clicks y peticiones a Supabase como si fuera un humano real,
> pero todos a la vez."*

---

## Métrica 4: Tasa de error = 0 fallas en 6.105 requests

### 🎯 Imagina esto
Le pediste agua a una mesera 6.105 veces y las 6.105 veces te trajo agua.
**No te falló ni una vez.**

### 📊 Nuestro número
En la prueba de carga, hicimos 6.105 peticiones al sistema.
**0 fallaron. 100% de éxito.**

### 💬 Cómo explicarlo en clase
> *"Durante la prueba de carga el sistema no falló ni una sola vez en 6.105 peticiones.
> Cero errores. Eso valida que la base de datos y los índices aguantan la carga."*

---

## Métrica 5: Throughput = 103.85 requests por segundo

### 🎯 Imagina esto
Una caja de supermercado puede atender 2 clientes por minuto.
Una caja más rápida atiende 10 clientes por minuto.

**HELIOS atiende 103 clientes por segundo** (más de 6.000 por minuto).

### 📊 Nuestro número
**103.85 peticiones por segundo** sostenidas durante 60 segundos seguidos.

### 💬 Cómo explicarlo en clase
> *"El sistema soporta 103 peticiones por segundo sin caerse. Si las policlínicas
> tienen 50.000 a 80.000 interacciones diarias, eso es alrededor de 1 por segundo
> en promedio. Tenemos 100 veces más capacidad que el promedio."*

---

## Métrica 6: 1.71 KLOC (líneas de código)

### 🎯 Imagina esto
Un libro corto tiene 100 páginas. Un libro normal tiene 300. Una enciclopedia
tiene 10.000.

KLOC es lo mismo pero con líneas de código. **1 KLOC = 1.000 líneas.**

**Nosotros escribimos 1.71 KLOC** = unas 1.706 líneas de código útil.

### 📊 Nuestro número
- 1.54 KLOC del **frontend** (React, TypeScript)
- 0.17 KLOC del **schema SQL** (las 7 tablas)
- Total producto: **1.71 KLOC**

### 💬 Cómo explicarlo en clase
> *"Escribimos 1.71 KLOC de código de producto. No es mucho porque Supabase nos
> ahorra construir un backend desde cero — sus servicios reemplazan lo que sería
> 2.000-3.000 líneas más."*

### ❓ Si te preguntan "¿es poco código?"
> *"Para Sprint 1 con setup técnico es normal. Lo importante no es cantidad sino
> calidad. 1.71 KLOC con 65% cobertura es mejor que 5 KLOC sin pruebas."*

---

## Métrica 7: Productividad = 0.342 KLOC por persona

### 🎯 Imagina esto
Si un albañil construye 1 metro cuadrado al día, ese es su productividad.

**Nosotros producimos 342 líneas de código útil por persona** en una semana
de Sprint.

### 📊 Nuestro número
1.71 KLOC ÷ 5 integrantes = **0.342 KLOC por persona por sprint**.

### 💬 Cómo explicarlo en clase
> *"0.342 KLOC por persona en el Sprint. Es aceptable porque incluye todo el setup
> técnico inicial. En Sprint 2 esperamos llegar a 0.5 por persona."*

---

## Métrica 8: Tasa de defectos = 1.75 bugs por KLOC

### 🎯 Imagina esto
Un artesano que hace 100 sillas y entrega 5 defectuosas tiene una tasa de
**5% de defectos**.

**Nosotros escribimos 1.71 KLOC y encontramos 3 bugs durante el desarrollo.**
Eso es 1.75 bugs por cada 1.000 líneas.

### 📊 Los 3 bugs reales
1. **Validación de cédula muy estricta** — rechazaba `PE-12-345` (cédulas
   panameñas de extranjeros). Lo arreglamos cambiando la validación.
2. **Tests no podían hacer mock** — falla técnica de la herramienta Vitest 4.
   Lo arreglamos usando `vi.hoisted()`.
3. **Faker no tenía locale `es_PA`** — la librería de datos falsos no
   reconoce Panamá. Lo cambiamos a `es_MX`.

### 💬 Cómo explicarlo en clase
> *"1.75 bugs por cada 1.000 líneas. La industria considera bueno menos de 5.
> Encontramos 3 defectos durante el desarrollo, todos documentados y resueltos
> antes del demo."*

### ❓ Si te preguntan "¿hubo más bugs?"
> *"Esos 3 son los que llegaron a hacer fallar pruebas o impedir avance. Errores
> tipográficos menores no los contamos como bugs."*

---

## Métrica 9: 100% trazabilidad US → BD → Componente → Test

### 🎯 Imagina esto
Pediste un paquete por Amazon. Puedes rastrearlo en cada paso:
"salió de China → llegó a Miami → en el avión → entregado".

**La trazabilidad es lo mismo pero con código.** Para cada funcionalidad podemos
mostrar:
- Qué pidió el usuario (Historia de Usuario)
- En qué tabla de base de datos vive
- Qué pedazo de código React la hace
- Qué prueba la valida

### 📊 Nuestro número
**5 de 5 historias** del Sprint 1 tienen este rastro completo documentado.

### 💬 Cómo explicarlo en clase
> *"Para cada historia de usuario podemos mostrar dónde está implementada en código,
> en qué tabla guarda datos, y qué pruebas la validan. Si alguien quiere ver el
> camino de la historia US-04 podemos abrir el repo y rastrearlo en vivo."*

---

## Métrica 10: 0 cambios en mid-sprint (Volatilidad)

### 🎯 Imagina esto
Le pediste a un constructor que te haga una casa de 2 pisos. A mitad de la obra
le pides que mejor sean 3 pisos. **Eso es volatilidad de requerimientos.**

Nosotros NO le cambiamos las reglas a mitad del Sprint. Lo que pidió José como
Product Owner al inicio, eso entregamos.

### 📊 Nuestro número
**0 cambios** durante la semana del Sprint 1.

### 💬 Cómo explicarlo en clase
> *"Cero cambios de alcance durante el Sprint. Atribuimos esto a Sprint 0 que
> dedicamos a documentar antes de codear. Sabíamos exactamente qué construir."*

---

## Métrica 11: 7/7 tablas implementadas (100%)

### 🎯 Imagina esto
Le diste al arquitecto un plano con 7 habitaciones. Si el arquitecto construyó
las 7 habitaciones tal como las dibujaste, es **100% fidelidad**.

### 📊 Nuestro número
- En Sprint 0 diseñamos 7 tablas en papel (Obsidian)
- En Sprint 1 implementamos las 7 en Supabase real
- **100% de fidelidad** entre diseño y ejecución

### 💬 Cómo explicarlo en clase
> *"Las 7 tablas que diseñamos en Sprint 0 están en producción real en Supabase
> ahora mismo. Si la profesora quiere verlas, abrimos el dashboard."*

---

## Métrica 12: 9/9 componentes con SRP

### 🎯 Imagina esto
SRP = **"un destornillador no es martillo".**

Un destornillador hace UNA cosa: apretar tornillos. No clava clavos.
Si quisieras un martillo, comprarías un martillo.

**Cada uno de nuestros 9 componentes hace UNA sola cosa:**
- El que muestra especialidades, solo muestra especialidades (no agenda citas)
- El que valida cédula, solo valida cédula (no inicia sesión)
- El que muestra el calendario, solo muestra el calendario (no guarda en BD)

### 📊 Nuestro número
**9 de 9 componentes** principales cumplen este principio.

### 💬 Cómo explicarlo en clase
> *"Aplicamos el principio SOLID-S: cada componente hace UNA sola cosa. Esto hace
> que sean fáciles de testear, fáciles de mantener, y fáciles de reemplazar si
> algo mejor sale."*

---

## Conceptos extras que pueden preguntar

### ¿Qué es ISTQB?

🎯 **El manual mundial de cómo hacer pruebas.** Como una receta universal para
testear software. Define qué tipos de pruebas existen, cómo medir cobertura,
cómo registrar defectos.

**Cómo lo decimos:** *"Aplicamos las categorías de prueba ISTQB: funcionales,
de rendimiento (Locust) y de regresión (Vitest threshold)."*

### ¿Qué es TMMi?

🎯 **Una escala del 1 al 5 que mide qué tan maduro es tu proceso de pruebas.**
Como el "nivel" en un videojuego.
- Nivel 1: ad-hoc (haces pruebas cuando te acuerdas)
- Nivel 2: gestionadas (tienes un plan)
- Nivel 3: definidas (todo el equipo sigue el mismo proceso) ← **AQUÍ ESTAMOS**
- Nivel 4: medidas (con datos cuantitativos)
- Nivel 5: optimizada (mejora continua automática)

**Cómo lo decimos:** *"Estamos en Nivel 3 de TMMi: nuestras pruebas son
trazables, documentadas, y el equipo entero sigue el mismo proceso."*

### ¿Qué es TQM?

🎯 **Filosofía de "siempre mejorar".** No esperar a que algo se rompa para
mejorarlo, sino mejorarlo todas las semanas.

**Cómo lo decimos:** *"Aplicamos TQM con nuestro Daily Scrum semanal. Cada semana
medimos, identificamos qué mejorar, y abrimos tickets para el sprint siguiente."*

### ¿Qué es ISO/IEC 25010?

🎯 **El estándar internacional de "qué hace que un software sea de calidad".**
Define 8 características:
1. **Funcionalidad** — ¿hace lo que prometió?
2. **Fiabilidad** — ¿se cae mucho?
3. **Eficiencia** — ¿es rápido?
4. **Usabilidad** — ¿la gente lo entiende?
5. **Seguridad** — ¿puede ser hackeado?
6. **Compatibilidad** — ¿funciona en distintos dispositivos?
7. **Mantenibilidad** — ¿es fácil de modificar?
8. **Portabilidad** — ¿se puede llevar a otro servidor fácil?

**Cómo lo decimos:** *"Aplicamos ISO/IEC 25010. Medimos funcionalidad
(5/5 US implementadas), fiabilidad (39 tests pasan), y eficiencia
(P95=300ms)."*

---

## La trampa que la profesora puede tender

**Pregunta peligrosa:** *"¿Y si les digo que medirlo así no es correcto porque
[razón técnica X]?"*

**Cómo NO caer:**
> *"Profesora, reconocemos las limitaciones de nuestras mediciones del Sprint 1.
> SonarCloud y el cuestionario SUS están en el backlog del Sprint 2. Las
> métricas que SÍ medimos son verificables — si quiere correr Vitest o Locust
> en vivo, lo podemos hacer ahora."*

Esto se llama **honestidad ganadora**: reconocer lo que falta antes de que te
lo señalen.

---

## La frase mágica de cierre

Si te ahogas con tu minuto, termina con esto:

> *"En resumen: medimos calidad, no la inventamos. Reconocemos lo que falta,
> y tenemos plan claro para Sprint 2."*

Es corta, profesional, y muestra madurez.

---

_Documento mantenido por el equipo HELIOS — UTP 2026._
