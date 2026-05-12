/** Cada 2000 Eco-Points sube un rango; el primero es Principiante. */
export const ECO_POINTS_PER_TIER = 2000

export const LEVEL_TITLES = [
  "Principiante",
  "Reciclador",
  "Ecologo activo",
  "Guardian verde",
  "Maestro del reciclaje",
  "Embajador Eco",
  "Leyenda BUAP",
] as const

export function ecoLevelTitleFromPoints(points: number): string {
  const idx = Math.min(
    Math.floor(Math.max(0, points) / ECO_POINTS_PER_TIER),
    LEVEL_TITLES.length - 1
  )
  return LEVEL_TITLES[idx]!
}

/** Umbral superior exclusivo del tramo actual (meta mostrada en UI). */
export function nextEcoPointsMilestone(points: number): number {
  const p = Math.max(0, points)
  const tier = Math.floor(p / ECO_POINTS_PER_TIER)
  return (tier + 1) * ECO_POINTS_PER_TIER
}

/** Progreso 0–100 dentro del tramo de 2000 pts hacia la siguiente meta. */
export function progressPercentWithinTier(points: number): number {
  const p = Math.max(0, points)
  const into = p % ECO_POINTS_PER_TIER
  return Math.min(100, Math.round((into / ECO_POINTS_PER_TIER) * 1000) / 10)
}
