export type EstadoCita = 'confirmada' | 'cancelada' | 'completada' | 'no_asistio'

export interface Sede {
  id: string
  nombre: string
  ciudad: string
  direccion: string | null
  capacidad_diaria: number
  activo: boolean
  created_at: string
}

export interface Especialidad {
  id: string
  nombre: string
  descripcion: string | null
  created_at: string
}

export interface Medico {
  id: string
  nombre: string
  especialidad_id: string | null
  sede_id: string | null
  correo: string | null
  telefono: string | null
  activo: boolean
  created_at: string
}

export interface MedicoConRelaciones extends Medico {
  especialidad?: Especialidad | null
  sede?: Sede | null
}

export interface Horario {
  id: string
  medico_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  disponible: boolean
  created_at: string
}

export interface Paciente {
  id: string
  nombre: string
  cedula: string
  telefono: string | null
  correo: string | null
  fecha_nacimiento: string | null
  created_at: string
}

export interface Cita {
  id: string
  paciente_id: string | null
  medico_id: string | null
  horario_id: string | null
  sede_id: string | null
  estado: EstadoCita
  notas: string | null
  codigo_confirmacion: string
  created_at: string
}

export interface CitaConRelaciones extends Cita {
  horario?: Horario | null
  medico?: (Medico & { especialidad?: Especialidad | null }) | null
  sede?: Sede | null
}

export interface AuthPacienteLink {
  auth_uid: string
  paciente_id: string
  created_at: string
}

/**
 * Bug B-13: vinculo entre auth.users y medicos.
 * Patron 1 de seguridad: solo se crea via service_role (en seed).
 * Frontend NUNCA puede insertar; RLS solo permite SELECT del dueño.
 */
export interface AuthMedicoLink {
  auth_uid: string
  medico_id: string
  created_at: string
}

/**
 * Rol del usuario logueado. Derivado en useAuth segun que tabla
 * de vinculo (auth_paciente_link o auth_medico_link) tenga registro.
 * - 'paciente': tiene vinculo en auth_paciente_link
 * - 'medico': tiene vinculo en auth_medico_link
 * - null: no tiene ningun vinculo (cuenta auth sin perfil, ir a /registro)
 */
export type Role = 'paciente' | 'medico' | null

/**
 * Cita con datos del paciente joinned (para el dashboard del medico).
 * El medico necesita ver quien viene a cada cita.
 */
export interface CitaConPaciente extends Cita {
  paciente?: Paciente | null
  horario?: Horario | null
}

/**
 * Sprint 4 (HELL-5): notificaciones in-app. Una fila por destinatario
 * (paciente XOR medico). Las genera un trigger desde citas_historial.
 */
export type TipoNotificacion =
  | 'creada'
  | 'reprogramada'
  | 'cancelada'
  | 'recordatorio'
  | 'bienvenida'

export type CanalNotificacion = 'in_app' | 'email'
export type EstadoEnvio = 'pendiente' | 'enviado' | 'fallido' | 'no_aplica'

export interface Notificacion {
  id: string
  paciente_id: string | null
  medico_id: string | null
  cita_id: string | null
  destinatario: 'paciente' | 'medico'
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  leida: boolean
  // Campos de envío (diseño fusionado). La campanita usa canal 'in_app';
  // el correo (Fase C) usará canal 'email' + estado/enviado_at.
  canal: CanalNotificacion
  estado: EstadoEnvio
  enviado_at: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      sedes: { Row: Sede; Insert: Partial<Sede>; Update: Partial<Sede> }
      notificaciones: {
        Row: Notificacion
        Insert: Partial<Notificacion>
        Update: Partial<Notificacion>
      }
      especialidades: {
        Row: Especialidad
        Insert: Partial<Especialidad>
        Update: Partial<Especialidad>
      }
      medicos: { Row: Medico; Insert: Partial<Medico>; Update: Partial<Medico> }
      horarios: { Row: Horario; Insert: Partial<Horario>; Update: Partial<Horario> }
      pacientes: { Row: Paciente; Insert: Partial<Paciente>; Update: Partial<Paciente> }
      citas: { Row: Cita; Insert: Partial<Cita>; Update: Partial<Cita> }
      auth_paciente_link: {
        Row: AuthPacienteLink
        Insert: Partial<AuthPacienteLink>
        Update: Partial<AuthPacienteLink>
      }
      auth_medico_link: {
        Row: AuthMedicoLink
        Insert: Partial<AuthMedicoLink>
        Update: Partial<AuthMedicoLink>
      }
    }
  }
}
