// 전투 재생뷰: frames[cursor]의 전황(HP·마나·effect) + 액션 로그 + 스텝 컨트롤. frames 없으면 ''.
// 행동자(actorRef)·피격 대상(targets)에 테두리, 동일 이름 유닛은 #번호 badge로 구분. 배속 1/2/3× 셀렉터.
import { esc } from './parts.js'
import { TRAITS } from '../../data/traits.js'
import { statusName, statusKind } from '../status.js'
import { fmtSec } from '../time.js'
import { THRESHOLD } from '../../engine/battle.js'

// 버프/디버프 = 공용 키워드 이름 태그(buff=초록/debuff=빨강). click 툴팁(data-tip="status") = 정확 표기 + 남은 지속(틱).
function effTags(effects, tick) {
  if (!effects || effects.length === 0) return ''
  return effects.map((e) => {
    const remain = (e.expireTick != null && tick != null) ? Math.max(0, e.expireTick - tick) : ''
    const iv = e.interval != null ? ` data-interval="${e.interval}"` : ''
    return `<span class="eff ${statusKind(e.type, e.value)}" data-tip="status" data-type="${e.type}" data-value="${e.value}" data-remain="${remain}"${iv}>${statusName(e.type, e.value)}</span>`
  }).join('')
}

// 몹 고정능력(광역) + 트레잇 = 메인 EnemyPreview와 동일한 data-tip pill(능력 툴팁).
function mobTraitPills(m) {
  const pills = []
  if (m.aoe) pills.push('<span class="trait" data-tip="aoe">광역</span>')
  for (const id of (m.traits || [])) {
    const t = TRAITS[id]
    if (t) pills.push(`<span class="trait" data-tip="trait" data-trait="${id}">${esc(t.name)}</span>`)
  }
  return pills.length ? `<div class="enemy-traits">특성 [${pills.join(', ')}]</div>` : ''
}

const pctw = (a, b) => (b > 0 ? Math.max(0, Math.min(100, (a / b) * 100)) : 0)

// 행동=acting(초록), 피격/힐 대상=hit(빨강). 둘 다면 행동 우선.
const roleCls = (mine, actorRef, targets) => (mine === actorRef ? ' acting' : targets.includes(mine) ? ' hit' : '')

function unitRow(u, idx, actorRef, targets, tick, rosterIdx) {
  // rosterIdx 있으면 행 클릭 = 캐릭터 정보 모달(결과화면 읽기전용). 없으면 비클릭.
  const click = rosterIdx != null ? ` clickable" data-action="openModal" data-i="${rosterIdx}` : ''
  return `<div class="bu${u.alive ? '' : ' dead'}${roleCls(idx, actorRef, targets)}${click}">
    <div class="bu-top"><span class="bu-name"><span class="bu-num">#${idx + 1}</span> ${esc(u.name)} <span class="lv">Lv${u.level}</span></span><span class="bu-hp">${u.hp}/${u.maxHp}</span></div>
    <div class="bar hp"><i style="width:${pctw(u.hp, u.maxHp)}%"></i></div>
    <div class="bar mana"><i style="width:${pctw(u.mana, u.manaMax)}%"></i></div>
    <div class="bar gauge"><i style="width:${pctw(u.gauge, THRESHOLD)}%"></i></div>
    <div class="bu-eff">${effTags(u.effects, tick)}</div>
  </div>`
}

function mobRow(m, actorRef, targets, tick) {
  return `<div class="bu mob-row${m.hp > 0 ? '' : ' dead'}${roleCls('mob', actorRef, targets)}">
    <div class="bu-top"><span class="bu-name ${m.boss ? 'boss' : ''}">${m.boss ? '👑 ' : ''}${esc(m.name)}</span><span class="bu-hp">${m.hp}/${m.maxHp}</span></div>
    <div class="bar hp mob"><i style="width:${pctw(m.hp, m.maxHp)}%"></i></div>
    ${mobTraitPills(m)}
    <div class="bu-eff">${effTags(m.effects, tick)}</div>
  </div>`
}

function speedBtn(sp, cur) {
  return `<button data-action="pbSpeed" data-speed="${sp}"${cur === sp ? ' class="on"' : ''}>${sp}×</button>`
}

export function renderBattleStage(frames, cursor, playing, speed = 1, party = null) {
  if (!frames || frames.length === 0) return ''
  const n = frames.length
  const c = Math.max(0, Math.min(cursor || 0, n - 1))
  const f = frames[c]
  const atStart = c === 0, atEnd = c >= n - 1
  const actorRef = f.actorRef ?? null
  const targets = f.targets || []
  const badge = typeof actorRef === 'number' ? ` #${actorRef + 1}` : ''
  return `<div class="battle-stage">
  <div class="pb-controls">
    <button data-action="pbFirst"${atStart ? ' disabled' : ''} title="처음">⏮</button>
    <button data-action="pbPrev"${atStart ? ' disabled' : ''} title="이전 스텝">|◀</button>
    <button data-action="pbPlay" title="${playing ? '일시정지' : '재생'}">${playing ? '⏸' : '▶'}</button>
    <button data-action="pbNext"${atEnd ? ' disabled' : ''} title="다음 스텝">▶|</button>
    <button data-action="pbLast"${atEnd ? ' disabled' : ''} title="끝">⏭</button>
    <span class="pb-speed">${speedBtn(1, speed)}${speedBtn(2, speed)}${speedBtn(3, speed)}</span>
    <span class="pb-count">${c + 1} / ${n} · ${fmtSec(f.tick)}</span>
  </div>
  <div class="pb-head">▶ ${esc(f.actor)}${badge}</div>
  <div class="pb-log">${f.log.map((l) => `<div class="log">${esc(l)}</div>`).join('') || '<div class="log dim">—</div>'}</div>
  <div class="battlefield">
    <div class="mob-side">${mobRow(f.mob, actorRef, targets, f.tick)}</div>
    <div class="vs">VS</div>
    <div class="party-side">${f.party.map((u, i) => unitRow(u, i, actorRef, targets, f.tick, party ? party[i] : null)).join('')}</div>
  </div>
</div>`
}
