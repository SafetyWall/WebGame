// 게임 화면 렌더(순수 HTML 문자열, data-action 속성). phase로 prep/result 분기.
// 전투 로그는 renderRounds 재사용. 버튼 게이팅 상수는 run.js에서 import.
import { renderRounds } from './render.js'
import { JOBS } from '../data/jobs.js'
import { TRAITS } from '../data/traits.js'
import { SKILLS } from '../data/skills.js'
import { normalizeSkillOrder, unitSkillIds } from '../engine/unit.js'
import { MAX_LEVEL, RECRUIT_COST, UPGRADE_COST, PROMOTE_COST, PROMOTE_TARGETS, slotCost } from '../engine/run.js'

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

function renderPrep(s) {
  const e = s.encounter
  // 고정 능력(광역)을 슬롯 트레잇과 한 대괄호에 같이 표기.
  const labels = [...(e.aoe ? ['광역'] : []), ...e.traits.map((id) => TRAITS[id].name)]
  const et = labels.length ? ` <span class="traits">[${labels.map(esc).join(', ')}]</span>` : ''
  const name = e.boss ? `👑 ${esc(e.name)}` : esc(e.name)
  const preview = `<div class="preview">다가올 적: <span class="mob${e.boss ? ' boss' : ''}">${name}</span> HP${e.hp} ATK${e.atk} DEF${e.def} SPD${e.spd}${et}</div>`
  const full = s.party.length >= s.slots
  const roster = s.roster.map((r, i) => {
    const j = JOBS[r.job]
    const lv = j.levels[r.level]
    const inParty = s.party.includes(i)
    const tog = inParty
      ? `<button data-action="toggle" data-i="${i}">대기</button>`
      : full
        ? `<button disabled title="슬롯 꽉참">출전</button>`
        : `<button data-action="toggle" data-i="${i}">출전</button>`
    const up = (r.job !== 'novice' && s.gold >= UPGRADE_COST && r.level < MAX_LEVEL) ? ` <button data-action="upgrade" data-i="${i}">강화(${UPGRADE_COST})</button>` : ''
    const promo = (r.job === 'novice' && s.gold >= PROMOTE_COST)
      ? ' ' + PROMOTE_TARGETS.map((job) => `<button data-action="promote" data-i="${i}" data-job="${job}">→${esc(JOBS[job].name)}(${PROMOTE_COST})</button>`).join(' ')
      : ''
    // 스킬 우선순위 재배열(스킬 2개+). 위에서부터 "쓸 수 있는 첫 스킬" → ▲▼로 순서 조정.
    const order = normalizeSkillOrder(unitSkillIds(j, r.learnedSkills), r.skillOrder)
    const skillsUi = order.length >= 2
      ? `<div class="skills">우선순위: ${order.map((sid, k) => {
          const upBtn = k > 0 ? `<button data-action="reorder" data-i="${i}" data-skill="${sid}" data-dir="-1">▲</button>` : ''
          const dnBtn = k < order.length - 1 ? `<button data-action="reorder" data-i="${i}" data-skill="${sid}" data-dir="1">▼</button>` : ''
          return `<span class="skill">${k + 1}.${esc(SKILLS[sid].name)}${upBtn}${dnBtn}</span>`
        }).join(' ')}</div>`
      : ''
    return `<li class="${inParty ? 'in-party' : ''}">${esc(j.name)} Lv${r.level} <span class="hp">HP${lv.hp}</span> ATK${lv.atk} ${tog}${up}${promo}${skillsUi}</li>`
  }).join('')
  const recruitBtn = s.gold >= RECRUIT_COST ? `<button data-action="recruit">영입(${RECRUIT_COST})</button>` : ''
  const sc = slotCost(s.slots)
  const expandBtn = s.gold >= sc ? `<button data-action="expand">슬롯확장(${sc})</button>` : ''
  // 출전 순서(=앞열) — party 배열 순서가 줄. 맨앞 = 몹 타겟. ▲▼로 재배열.
  const orderItems = s.party.map((idx, pos) => {
    const jn = JOBS[s.roster[idx].job].name
    const up = pos > 0 ? `<button data-action="reorderParty" data-i="${idx}" data-dir="-1">▲</button>` : ''
    const dn = pos < s.party.length - 1 ? `<button data-action="reorderParty" data-i="${idx}" data-dir="1">▼</button>` : ''
    const front = pos === 0 ? ' <span class="front">🛡️앞열</span>' : ''
    return `<li>${pos + 1}. ${esc(jn)}${front}${up}${dn}</li>`
  }).join('')
  const partyOrder = s.party.length ? `<div class="party-order">출전 순서(앞→뒤): <ol>${orderItems}</ol></div>` : ''
  const count = `<span class="party-count${full ? ' full' : ''}">출전 ${s.party.length}/${s.slots}</span>`
  const fightBtn = s.party.length >= 1 ? `<button data-action="fight">전투!</button>` : '<span>출전 유닛을 선택하세요</span>'
  return `<h2>스테이지 ${s.stage} · 골드 ${s.gold} · 슬롯 ${s.slots}</h2>
${preview}
<ul class="roster">${roster}</ul>
${partyOrder}
<div class="actions">${recruitBtn} ${expandBtn} ${count} ${fightBtn}</div>`
}

function renderResult(s) {
  const { outcome, reward, ticks, rounds } = s.lastResult
  const banner = outcome === 'clear' ? `<h2>🎉 스테이지 ${s.stage} 클리어 — 게임 클리어! (${ticks}틱)</h2>`
    : outcome === 'win' ? `<h2>스테이지 ${s.stage} 승리! 골드 +${reward} (${ticks}틱)</h2>`
    : `<h2>패배… 런 종료 (${ticks}틱)</h2>`
  const btn = outcome === 'loss' ? `<button data-action="restart">다시 시작</button>`
    : outcome === 'clear' ? `<button data-action="restart">새 런</button>`
    : `<button data-action="next">다음 스테이지</button>`
  return `${banner}
<div class="actions">${btn}</div>
${renderRounds(rounds)}`
}

export function renderGame(s) {
  return s.phase === 'result' ? renderResult(s) : renderPrep(s)
}
