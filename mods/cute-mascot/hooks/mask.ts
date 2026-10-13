const MAX_LENGTH = 40

const SECRET_FORMS: readonly [RegExp, string][] = [
  [/([A-Za-z_][A-Za-z0-9_]*=)\S+/g, '$1***'],
  [/(Bearer\s+)\S+/g, '$1***'],
  [/(--token[=\s]+)\S+/g, '$1***'],
  [/(--password[=\s]+)\S+/g, '$1***'],
]

/** Keeps the first line, hides each Secret_Form value behind `***`, then cuts to 40 characters. */
export function maskCommand(command: string): string {
  const [firstLine] = command.split('\n')
  const masked = SECRET_FORMS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), firstLine)

  return masked.slice(0, MAX_LENGTH)
}
