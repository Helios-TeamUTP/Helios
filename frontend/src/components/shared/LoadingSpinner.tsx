interface Props {
  label?: string
}

export function LoadingSpinner({ label = 'Cargando…' }: Readonly<Props>) {
  return (
    <div className="flex items-center gap-3 text-helios-ink/60">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-helios-primary/30 border-t-helios-primary" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
