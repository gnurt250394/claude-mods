/** Writes a duration as `<s>s` under a minute and `<m>m <s>s` from a minute; throws on a non-finite or negative value. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    throw new RangeError(`formatDuration: ${ms} is not a duration`)
  }

  const total = Math.floor(ms / 1000)

  return total < 60 ? `${total}s` : `${Math.floor(total / 60)}m ${total % 60}s`
}
