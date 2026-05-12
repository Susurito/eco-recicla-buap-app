import type { TrashPoint } from "@/lib/data"

const ZEROS: TrashPoint["todayStats"] = {
  plastico: 0,
  papel: 0,
  organico: 0,
  general: 0,
  carton: 0,
  vidrio: 0,
  metal: 0,
  basura: 0,
}

export function normalizeTodayStats(raw: unknown): TrashPoint["todayStats"] {
  if (!raw || typeof raw !== "object") return { ...ZEROS }
  const t = raw as Record<string, number>
  return {
    plastico: Number(t.plastico) || 0,
    papel: Number(t.papel) || 0,
    organico: Number(t.organico) || 0,
    general: Number(t.general) || 0,
    carton: Number(t.carton) || 0,
    vidrio: Number(t.vidrio) || 0,
    metal: Number(t.metal) || 0,
    basura: Number(t.basura) || 0,
  }
}
