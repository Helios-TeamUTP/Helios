interface Props {
  message: string
}

export function ErrorMessage({ message }: Readonly<Props>) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {message}
    </div>
  )
}
