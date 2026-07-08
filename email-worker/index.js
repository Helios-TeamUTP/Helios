/**
 * HELIOS — Worker de correo.
 *
 * Lee la cola de la tabla `notificaciones` (canal='email', estado='pendiente'),
 * envia cada correo por Gmail (Nodemailer) y marca la fila 'enviado' o 'fallido'.
 * Corre en loop (poll). Pensado para un servicio en Railway.
 *
 * Variables de entorno requeridas (se ponen en Railway, NUNCA en el codigo):
 *   SUPABASE_URL                - URL del proyecto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY   - service_role key (lee/actualiza saltando RLS)
 *   GMAIL_USER                  - correo Gmail remitente
 *   GMAIL_APP_PASSWORD          - App Password de 16 letras (no la clave normal)
 *   POLL_MS (opcional)          - intervalo de sondeo, default 8000 ms
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// Local: carga email-worker/.env (Gmail) y reutiliza SUPABASE_* de scripts/.env
// si existen (asi solo pones las credenciales de Gmail). En Railway: usa las
// Variables del servicio (estos archivos no existen alli y no pasa nada).
dotenv.config()
dotenv.config({ path: '../scripts/.env' })

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  POLL_MS = '8000',
} = process.env

const faltan = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GMAIL_USER', 'GMAIL_APP_PASSWORD']
  .filter((k) => !process.env[k])
if (faltan.length) {
  console.error('[config] Faltan variables de entorno:', faltan.join(', '))
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // puerto de "submission": suele estar menos bloqueado que el 465
  secure: false, // 587 usa STARTTLS (se cifra despues de conectar)
  requireTLS: true,
  pool: true, // reusa la conexion SMTP -> menos "connect ETIMEDOUT"
  maxConnections: 1,
  rateDelta: 1000,
  rateLimit: 3, // maximo 3 correos por segundo (evita rafagas que Gmail corta)
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD.replace(/\s/g, ''), // por si la pegan con espacios
  },
})

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
    // Reintenta hasta 3 veces si hay un bajon de red (ETIMEDOUT). Asi un
    // corte momentaneo de internet no marca el correo como fallido.
    let enviado = false
    let ultimoError
    for (let intento = 1; intento <= 3 && !enviado; intento++) {
      try {
        await transporter.sendMail({
          from: `HELIOS Citas <${GMAIL_USER}>`,
          to,
          subject: n.titulo,
          text: n.mensaje,
          html: plantilla(n.titulo, n.mensaje),
        })
        enviado = true
      } catch (e) {
        ultimoError = e
        if (intento < 3) {
          console.warn(`[retry ${intento}/3] ${to}: ${e.message}`)
          await new Promise((r) => setTimeout(r, 2500)) // espera 2.5s y reintenta
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

// Arranque robusto: verifica Gmail con reintentos. Si las credenciales estan
// mal -> sale (no hay nada que hacer). Si es la red la que falla (timeout) ->
// reintenta, y si tras 3 intentos sigue sin responder, arranca el loop igual
// (los envios tienen su propio reintento). Asi un bajon de internet no mata el worker.
async function iniciar() {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      await transporter.verify()
      console.log(`[helios-email-worker] Gmail OK (${GMAIL_USER}). Poll cada ${POLL_MS} ms.`)
      return loop()
    } catch (err) {
      const msg = err && err.message ? err.message : String(err)
      if (/invalid login|535|password not accepted|credentials|badcredentials/i.test(msg)) {
        console.error('[helios-email-worker] Gmail NO autentica (credenciales malas):', msg)
        process.exit(1)
      }
      console.warn(`[verify ${intento}/3] Gmail no respondió (${msg}). Reintentando en 3s...`)
      await new Promise((r) => setTimeout(r, 3000))
    }
  }
  console.warn('[helios-email-worker] Gmail no verificó (red inestable), pero arranco el loop igual.')
  loop()
}
iniciar()
