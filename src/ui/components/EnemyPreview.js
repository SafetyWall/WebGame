// 다가올 적 미리보기. 광역(엔진 네이티브) + 트레잇을 탭/클릭 툴팁 가능한 pill로.
import { TRAITS } from '../../data/traits.js'
import { esc } from './parts.js'

export function renderEnemyPreview(e) {
  const cls = e.boss ? 'mob boss' : 'mob'
  const name = e.boss ? `👑 ${esc(e.name)}` : esc(e.name)
  const pills = []
  if (e.aoe) pills.push(`<span class="trait" data-tip="aoe">광역</span>`)
  for (const id of (e.traits || [])) {
    const t = TRAITS[id]
    if (t) pills.push(`<span class="trait" data-tip="trait" data-trait="${id}">${esc(t.name)}</span>`)
  }
  const traitLine = pills.length ? `<div class="enemy-traits">특성 [${pills.join(', ')}]</div>` : ''
  return `<div class="enemy-preview">
  <div class="enemy-head">다가올 적 <span class="${cls}">${name}</span></div>
  <div class="enemy-stats">HP${e.hp} ATK${e.atk} DEF${e.def} SPD${e.spd}</div>
  ${traitLine}
</div>`
}
