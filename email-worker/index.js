/**
 * HELIOS — Worker de correo (vía API HTTP de Brevo).
 *
 * Lee la cola de la tabla `notificaciones` (canal='email', estado='pendiente'),
 * envia cada correo por la API de Brevo (HTTP, puerto 443) y marca la fila
 * 'enviado' o 'fallido'. Corre en loop (poll). Pensado para Railway.
 *
 * Por qué Brevo API y no SMTP directo: Railway (como casi todos los PaaS)
 * BLOQUEA el SMTP saliente (puertos 25/465/587) → Nodemailer/Gmail da
 * "Connection timeout". La API HTTP de Brevo usa 443, que no está bloqueado.
 *
 * Variables de entorno (se ponen en Railway, NUNCA en el codigo):
 *   SUPABASE_URL                - URL del proyecto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY   - service_role key (lee/actualiza saltando RLS)
 *   BREVO_API_KEY               - API key de Brevo (Settings > SMTP & API)
 *   SENDER_EMAIL (o GMAIL_USER) - correo remitente VERIFICADO en Brevo
 *   SENDER_NAME (opcional)      - nombre visible del remitente
 *   POLL_MS (opcional)          - intervalo de sondeo, default 8000 ms
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Local: carga email-worker/.env y reutiliza SUPABASE_* de scripts/.env si
// existen. En Railway: usa las Variables del servicio (estos archivos no
// existen alli y no pasa nada).
dotenv.config()
dotenv.config({ path: '../scripts/.env' })

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  BREVO_API_KEY,
  POLL_MS = '8000',
} = process.env

// El remitente: SENDER_EMAIL nuevo, con fallback a GMAIL_USER (que ya estaba
// configurado en Railway) para no tener que renombrar la variable.
const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.GMAIL_USER
const SENDER_NAME = process.env.SENDER_NAME || 'HELIOS Citas'

const faltan = Object.entries({
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  BREVO_API_KEY,
  SENDER_EMAIL,
}).filter(([, v]) => !v).map(([k]) => k)
if (faltan.length) {
  console.error('[config] Faltan variables de entorno:', faltan.join(', '))
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

/** Plantilla HTML simple con la marca HELIOS (rojo). */
function plantilla(titulo, mensaje) {
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto">
    <div style="background:#F34B56;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0">
      <span style="font-size:18px;font-weight:700">HELIOS</span>
      <span style="opacity:.85"> · Citas médicas unificadas</span>
    </div>
    <div style="border:1px solid #eee;border-top:none;padding:22px 20px;border-radius:0 0 10px 10px">
      <h2 style="margin:0 0 10px;color:#0F2A36;font-size:18px">${titulo}</h2>
      <p style="margin:0;color:#33414a;font-size:15px;line-height:1.55">${mensaje}</p>
      <p style="margin:18px 0 0;color:#9aa6ad;font-size:12px">
        Este es un correo automático de HELIOS. No respondas a este mensaje.
      </p>
    </div>
  </div>`
}

async function marcar(id, estado) {
  const patch = { estado }
  if (estado === 'enviado') patch.enviado_at = new Date().toISOString()
  const { error } = await supabase.from('notificaciones').update(patch).eq('id', id)
  if (error) console.error(`[marcar ${estado}] ${id}:`, error.message)
}

/** Envia UN correo por la API de Brevo. Lanza si la API responde con error. */
async function enviarBrevo(to, subject, text, html) {
  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: SENDER_EMAIL, name: SENDER_NAME },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  })
  if (!res.ok) {
    const cuerpo = await res.text().catch(() => '')
    throw new Error(`Brevo HTTP ${res.status}: ${cuerpo.slice(0, 200)}`)
  }
}

async function procesarCola() {
  const { data: pendientes, error } = await supabase
    .from('notificaciones')
    .select('id, titulo, mensaje, destinatario, paciente:pacientes(correo), medico:medicos(correo)')
    .eq('canal', 'email')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })
    .limit(20)

  if (error) {
    console.error('[cola] error leyendo:', error.message)
    return
  }
  if (!pendientes || pendientes.length === 0) return

  for (const n of pendientes) {
    const dest = n.destinatario === 'paciente' ? n.paciente : n.medico
    const to = dest?.correo
    if (!to) {
      await marcar(n.id, 'fallido')
      console.warn(`[skip] notif ${n.id} sin correo de ${n.destinatario}`)
      continue
    }
    // Reintenta hasta 3 veces si la API falla puntualmente (5xx / red).
    let enviado = false
    let ultimoError
    for (let intento = 1; intento <= 3 && !enviado; intento++) {
      try {
        await enviarBrevo(to, n.titulo, n.mensaje, plantilla(n.titulo, n.mensaje))
        enviado = true
      } catch (e) {
        ultimoError = e
        if (intento < 3) {
          console.warn(`[retry ${intento}/3] ${to}: ${e.message}`)
          await new Promise((r) => setTimeout(r, 2500))
        }
      }
    }
    if (enviado) {
      await marcar(n.id, 'enviado')
      console.log(`[ok] "${n.titulo}" -> ${to}`)
    } else {
      await marcar(n.id, 'fallido')
      console.error(`[fail] notif ${n.id} -> ${to} (tras 3 intentos):`, ultimoError?.message)
    }
  }
}

async function loop() {
  try {
    await procesarCola()
  } catch (e) {
    console.error('[loop] inesperado:', e)
  }
  setTimeout(loop, Number(POLL_MS))
}

console.log(`[helios-email-worker] Brevo listo (remitente ${SENDER_EMAIL}). Poll cada ${POLL_MS} ms.`)
loop()
