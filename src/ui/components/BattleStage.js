// 전투 재생뷰: frames[cursor]의 전황(HP·마나·effect) + 액션 로그 + 스텝 컨트롤. frames 없으면 ''.
import { esc } from './parts.js'

const EFF_LABEL = {
  dmgTaken: '받뎀', dmgDealt: '주뎀', speed: '속도', stun: '기절',
  taunt: '도발', intercept: '수호', hot: '재생', dot: '출혈', mark: '표식', reflect: '반사',
}

function effTags(types) {
  if (!types || types.length === 0) return ''
  const m = {}
  for (const t of types) m[t] = (m[t] || 0) + 1
  return Object.entries(m).map(([t, k]) => `<span class="eff eff-${t}">${EFF_LABEL[t] || t}${k > 1 ? '×' + k : ''}</span>`).join('')
}

const pctw = (a, b) => (b > 0 ? Math.max(0, Math.min(100, (a / b) * 100)) : 0)

function unitRow(u) {
  return `<div class="bu${u.alive ? '' : ' dead'}">
    <div class="bu-top"><span class="bu-name">${esc(u.name)} <span class="lv">Lv${u.level}</span></span><span class="bu-hp">${u.hp}/${u.maxHp}</span></div>
    <div class="bar hp"><i style="width:${pctw(u.hp, u.maxHp)}%"></i></div>
    <div class="bar mana"><i style="width:${pctw(u.mana, u.manaMax)}%"></i></div>
    <div class="bu-eff">${effTags(u.effects)}</div>
  </div>`
}

function mobRow(m) {
  return `<div class="bu mob-row${m.hp > 0 ? '' : ' dead'}">
    <div class="bu-top"><span class="bu-name ${m.boss ? 'boss' : ''}">${m.boss ? '👑 ' : ''}${esc(m.name)}</span><span class="bu-hp">${m.hp}/${m.maxHp}</span></div>
    <div class="bar hp mob"><i style="width:${pctw(m.hp, m.maxHp)}%"></i></div>
    <div class="bu-eff">${effTags(m.effects)}</div>
  </div>`
}

export function renderBattleStage(frames, cursor, playing) {
  if (!frames || frames.length === 0) return ''
  const n = frames.length
  const c = Math.max(0, Math.min(cursor || 0, n - 1))
  const f = frames[c]
  const atStart = c === 0, atEnd = c >= n - 1
  return `<div class="battle-stage">
  <div class="pb-controls">
    <button data-action="pbFirst"${atStart ? ' disabled' : ''}>⏮</button>
    <button data-action="pbPrev"${atStart ? ' disabled' : ''}>◀</button>
    <button data-action="pbPlay">${playing ? '⏸' : '▶'}</button>
    <button data-action="pbNext"${atEnd ? ' disabled' : ''}>▶▶</button>
    <button data-action="pbLast"${atEnd ? ' disabled' : ''}>⏭</button>
    <span class="pb-count">${c + 1} / ${n} · 틱 ${f.tick}</span>
  </div>
  <div class="pb-head">▶ ${esc(f.actor)}</div>
  <div class="pb-log">${f.log.map((l) => `<div class="log">${esc(l)}</div>`).join('') || '<div class="log dim">—</div>'}</div>
  <div class="battlefield">
    <div class="party-side">${f.party.map(unitRow).join('')}</div>
    <div class="vs">VS</div>
    <div class="mob-side">${mobRow(f.mob)}</div>
  </div>
</div>`
}
