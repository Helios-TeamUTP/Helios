/**
 * HELIOS — Worker de correo (Cloudflare Workers + Cron Trigger).
 *
 * Cada minuto (cron) lee la cola de la tabla `notificaciones`
 * (canal='email', estado='pendiente'), envía cada correo por la API HTTP de
 * Brevo y marca la fila 'enviado' o 'fallido'.
 *
 * Migrado desde Railway (loop de polling con setTimeout). En Workers no hay
 * procesos de larga vida: el Cron Trigger invoca `scheduled()` y cada
 * invocación vacía la cola (hasta LIMITE_POR_CORRIDA correos).
 *
 * Secrets (wrangler secret put <NOMBRE> o panel de Cloudflare — NUNCA en código):
 *   SUPABASE_URL                - URL del proyecto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY   - service_role key (salta RLS)
 *   BREVO_API_KEY               - API key de Brevo (Settings > SMTP & API)
 *   SENDER_EMAIL                - remitente VERIFICADO en Brevo
 *   SENDER_NAME (opcional)      - nombre visible, default "HELIOS Citas"
 */

import { createClient } from '@supabase/supabase-js'

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'
const LIMITE_POR_CORRIDA = 20
const REINTENTOS = 3
const ESPERA_REINTENTO_MS = 2500

/** Plantilla HTML simple con la marca HELIOS. */
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

/** Variables obligatorias que faltan (vacío = todo bien). */
export function faltantes(env) {
  return ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'BREVO_API_KEY', 'SENDER_EMAIL'].filter(
    (k) => !env[k],
  )
}

async function marcar(supabase, id, estado) {
  const patch = { estado }
  if (estado === 'enviado') patch.enviado_at = new Date().toISOString()
  const { error } = await supabase.from('notificaciones').update(patch).eq('id', id)
  if (error) console.error(`[marcar ${estado}] ${id}:`, error.message)
}

/** Envía UN correo por la API de Brevo. Lanza si la API responde con error. */
async function enviarBrevo(env, to, subject, text, html) {
  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: env.SENDER_EMAIL, name: env.SENDER_NAME || 'HELIOS Citas' },
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

/** Reintenta hasta REINTENTOS veces ante fallas puntuales (5xx / red). */
async function enviarConReintentos(env, to, titulo, mensaje) {
  let ultimoError
  for (let intento = 1; intento <= REINTENTOS; intento++) {
    try {
      await enviarBrevo(env, to, titulo, mensaje, plantilla(titulo, mensaje))
      return { ok: true }
    } catch (e) {
      ultimoError = e
      if (intento < REINTENTOS) {
        console.warn(`[retry ${intento}/${REINTENTOS}] ${to}: ${e.message}`)
        await new Promise((r) => setTimeout(r, ESPERA_REINTENTO_MS))
      }
    }
  }
  return { ok: false, error: ultimoError }
}

export async function procesarCola(env) {
  const falta = faltantes(env)
  if (falta.length) {
    console.error('[config] Faltan secrets:', falta.join(', '))
    return
  }
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: pendientes, error } = await supabase
    .from('notificaciones')
    .select('id, titulo, mensaje, destinatario, paciente:pacientes(correo), medico:medicos(correo)')
    .eq('canal', 'email')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })
    .limit(LIMITE_POR_CORRIDA)

  if (error) {
    console.error('[cola] error leyendo:', error.message)
    return
  }
  if (!pendientes || pendientes.length === 0) return

  for (const n of pendientes) {
    const dest = n.destinatario === 'paciente' ? n.paciente : n.medico
    const to = dest?.correo
    if (!to) {
      await marcar(supabase, n.id, 'fallido')
      console.warn(`[skip] notif ${n.id} sin correo de ${n.destinatario}`)
      continue
    }
    const r = await enviarConReintentos(env, to, n.titulo, n.mensaje)
    if (r.ok) {
      await marcar(supabase, n.id, 'enviado')
      console.log(`[ok] "${n.titulo}" -> ${to}`)
    } else {
      await marcar(supabase, n.id, 'fallido')
      console.error(`[fail] notif ${n.id} -> ${to} (tras ${REINTENTOS} intentos):`, r.error?.message)
    }
  }
}

export default {
  /** Cron Trigger (cada minuto, ver wrangler.jsonc). */
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(procesarCola(env))
  },
}
