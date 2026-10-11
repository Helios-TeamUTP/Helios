-- Rollback de B-36: restaura los EXECUTE originales (anon/PUBLIC) y quita el
-- search_path fijo de las 3 funciones que no lo tenían.
begin;

grant execute on function public.crear_cita_atomica(uuid, uuid, uuid, uuid, text) to public, anon;
grant execute on function public.cancelar_cita_atomica(uuid)                      to public, anon;
grant execute on function public.reprogramar_cita_atomica(uuid, uuid)             to public, anon;
grant execute on function public.marcar_notificacion_leida(uuid)                  to public, anon;
grant execute on function public.marcar_todas_notificaciones_leidas()             to public, anon;

grant execute on function public.crear_notificacion_desde_historial() to public, anon, authenticated;
grant execute on function public.log_cita_historial()                 to public, anon, authenticated;
grant execute on function public.rls_auto_enable()                    to public, anon, authenticated;

alter function public.cancelar_cita_atomica(uuid) reset search_path;
alter function public.log_cita_historial()        reset search_path;
alter function public.clinica_demo_id()           reset search_path;

commit;
