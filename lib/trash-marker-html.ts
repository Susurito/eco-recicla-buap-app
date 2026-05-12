/** HTML para marcador / tarjeta con anillo de llenado (conic-gradient). */
export function trashFillMarkerHtml(
  fillLevel: number,
  alert: string | null,
  isSelected: boolean,
  sizePx = 40
): string {
  const level = Math.max(0, Math.min(100, Math.round(fillLevel)))
  const ring =
    alert || level > 80
      ? "#ef4444"
      : level > 50
        ? "#eab308"
        : "#10b981"
  const empty = "#e5e7eb"
  const shadow = isSelected
    ? "box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 4px 15px rgba(0,0,0,0.5);"
    : "box-shadow: 0 2px 8px rgba(0,0,0,0.3);"
  const scale = isSelected ? "scale(1.25)" : "scale(1)"
  const inset = Math.max(3, Math.round(sizePx * 0.14))
  const fontPx = sizePx <= 40 ? 10 : sizePx <= 56 ? 12 : 22

  return `
    <div style="width:${sizePx}px;height:${sizePx}px;position:relative;transform:${scale};transition:transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);cursor:pointer;${shadow}border-radius:50%;">
      <div style="position:absolute;inset:0;border-radius:50%;background:conic-gradient(${ring} ${level}%, ${empty} 0);"></div>
      <div style="position:absolute;inset:${inset}px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;font-size:${fontPx}px;font-weight:700;color:#111827;">
        ${level}%
      </div>
    </div>
  `
}
