-- ═══════════════════════════════════════════════════════════════════════
-- B-36 — Cerrar EXECUTE anónimo en funciones SECURITY DEFINER + search_path
--
-- Hallazgos del asesor de seguridad de Supabase (30-sep-2026):
--  · 12 funciones SECURITY DEFINER eran ejecutables por `anon` vía /rpc,
--    incluidas funciones de TRIGGER que nadie debe invocar por API.
--  · 3 funciones sin search_path fijo (riesgo de search_path hijacking).
--
-- Cambios (todos reversibles con rollback_B-36_*.sql):
--  1. RPC de negocio (cita/notificaciones) → solo `authenticated` (+service_role).
--     Ya validan auth.uid() por dentro; esto elimina la superficie anónima.
--  2. Funciones de trigger / event trigger → sin EXECUTE para clientes.
--     Los triggers siguen disparándose: Postgres NO exige EXECUTE al
--     disparar un trigger, solo al crearlo.
--  3. search_path fijo en cancelar_cita_atomica, log_cita_historial y
--     clinica_demo_id.
--
-- NO se toca (decisión explícita):
--  · cedula_ya_registrada, correo_ya_registrado → deben ser anónimas
--    (comprobación previa al registro, antes de tener sesión).
--  · clinica_id_actual → la evalúan políticas RLS para el rol que consulta.
--  · paciente_huerfano_id → anónima y sin chequeo de sesión (permite
--    consultar por cédula si hay un paciente huérfano). Solo la usa el flujo
--    de registro de la rama demo-vercel; revocarla requiere confirmar que se
--    llama siempre con sesión. Pendiente de decisión (ver PR).
-- ═══════════════════════════════════════════════════════════════════════

begin;

-- 1) RPC de negocio: solo usuarios autenticados -----------------------------
revoke execute on function public.crear_cita_atomica(uuid, uuid, uuid, uuid, text) from public, anon;
revoke execute on function public.cancelar_cita_atomica(uuid)                      from public, anon;
revoke execute on function public.reprogramar_cita_atomica(uuid, uuid)             from public, anon;
revoke execute on function public.marcar_notificacion_leida(uuid)                  from public, anon;
revoke execute on function public.marcar_todas_notificaciones_leidas()             from public, anon;

grant execute on function public.crear_cita_atomica(uuid, uuid, uuid, uuid, text) to authenticated, service_role;
grant execute on function public.cancelar_cita_atomica(uuid)                      to authenticated, service_role;
grant execute on function public.reprogramar_cita_atomica(uuid, uuid)             to authenticated, service_role;
grant execute on function public.marcar_notificacion_leida(uuid)                  to authenticated, service_role;
grant execute on function public.marcar_todas_notificaciones_leidas()             to authenticated, service_role;

-- 2) Funciones de trigger: no invocables por API ----------------------------
revoke execute on function public.crear_notificacion_desde_historial() from public, anon, authenticated;
revoke execute on function public.log_cita_historial()                 from public, anon, authenticated;
revoke execute on function public.rls_auto_enable()                    from public, anon, authenticated;

-- 3) search_path fijo -------------------------------------------------------
alter function public.cancelar_cita_atomica(uuid) set search_path = public, pg_temp;
alter function public.log_cita_historial()        set search_path = public, pg_temp;
alter function public.clinica_demo_id()           set search_path = public, pg_temp;

commit;
