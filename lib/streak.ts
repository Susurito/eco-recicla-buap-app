/**
 * Días locales consecutivos (YYYY-MM-DD) con al menos una clasificación correcta.
 * Si hoy no hay actividad pero ayer sí, la racha sigue contando desde ayer (un día de gracia).
 */
export function datesWithCorrectClassifications(datesUtc: Date[]): Set<string> {
  const set = new Set<string>()
  for (const d of datesUtc) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    set.add(`${y}-${m}-${day}`)
  }
  return set
}

function ymdLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function addDaysLocal(d: Date, delta: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + delta)
  return x
}

export function consecutiveCorrectDaysStreak(activityDates: Set<string>): number {
  const today = ymdLocal(new Date())
  const yesterday = ymdLocal(addDaysLocal(new Date(), -1))

  let cursor = today
  if (!activityDates.has(today)) {
    if (!activityDates.has(yesterday)) return 0
    cursor = yesterday
  }

  let streak = 0
  let d = new Date()
  const [y, m, day] = cursor.split("-").map(Number)
  d.setFullYear(y!, m! - 1, day)

  while (activityDates.has(ymdLocal(d))) {
    streak++
    d = addDaysLocal(d, -1)
  }
  return streak
}
