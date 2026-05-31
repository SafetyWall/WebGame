// 게임 화면 렌더(순수 HTML 문자열, data-action 속성). phase로 prep/result 분기.
// 전투 로그는 기존 renderBattle 재사용. 버튼 게이팅 상수는 run.js에서 import.
import { renderBattle } from './render.js'
import { JOBS } from '../data/jobs.js'
import { TRAITS } from '../data/traits.js'
import { MAX_LEVEL, RECRUIT_COST, UPGRADE_COST } from '../engine/run.js'

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

function renderPrep(s) {
  const e = s.encounter
  const et = e.traits.length ? ` <span class="traits">[${e.traits.map((id) => esc(TRAITS[id].name)).join(', ')}]</span>` : ''
  const preview = `<div class="preview">다가올 적: <span class="mob">${esc(e.name)}</span> HP${e.hp} ATK${e.atk} DEF${e.def} SPD${e.spd}${et}</div>`
  const roster = s.roster.map((r, i) => {
    const j = JOBS[r.job]
    const lv = j.levels[r.level]
    const inParty = s.party.includes(i)
    const tog = `<button data-action="toggle" data-i="${i}">${inParty ? '대기' : '출전'}</button>`
    const up = (s.gold >= UPGRADE_COST && r.level < MAX_LEVEL) ? ` <button data-action="upgrade" data-i="${i}">강화(${UPGRADE_COST})</button>` : ''
    return `<li class="${inParty ? 'in-party' : ''}">${esc(j.name)} Lv${r.level} <span class="hp">HP${lv.hp}</span> ATK${lv.atk} ${tog}${up}</li>`
  }).join('')
  const recruitBtn = s.gold >= RECRUIT_COST ? `<button data-action="recruit">영입(${RECRUIT_COST})</button>` : ''
  const fightBtn = s.party.length >= 1 ? `<button data-action="fight">전투!</button>` : '<span>출전 유닛을 선택하세요</span>'
  return `<h2>스테이지 ${s.stage} · 골드 ${s.gold} · 슬롯 ${s.slots}</h2>
${preview}
<ul class="roster">${roster}</ul>
<div class="actions">${recruitBtn} <span>출전 ${s.party.length}/${s.slots}</span> ${fightBtn}</div>`
}

function renderResult(s) {
  const { outcome, reward, ticks, rounds } = s.lastResult
  const banner = outcome === 'clear' ? `<h2>🎉 스테이지 ${s.stage} 클리어 — 게임 클리어!</h2>`
    : outcome === 'win' ? `<h2>스테이지 ${s.stage} 승리! 골드 +${reward}</h2>`
    : `<h2>패배… 런 종료</h2>`
  const btn = outcome === 'loss' ? `<button data-action="restart">다시 시작</button>`
    : outcome === 'clear' ? `<button data-action="restart">새 런</button>`
    : `<button data-action="next">다음 스테이지</button>`
  const log = renderBattle({ winner: outcome === 'loss' ? 'mob' : 'party', ticks, rounds })
  return `${banner}
<div class="actions">${btn}</div>
${log}`
}

export function renderGame(s) {
  return s.phase === 'result' ? renderResult(s) : renderPrep(s)
}
