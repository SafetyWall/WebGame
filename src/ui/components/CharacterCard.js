// 캐릭터 카드. 좌=기본능력 / 우=스킬 2×2. 본문 탭=상세모달, pill 탭=툴팁, 출전 토글.
// 출전(in-party) 카드 = 자체 드래그로 출전순서 재배열(data-drag/data-pos). 1col/2col 차이는 Roster CSS.
import { JOBS } from '../../data/jobs.js'
import { esc, skillPills, hpBar } from './parts.js'

export function renderCard(run, i) {
  const r = run.roster[i]
  const job = JOBS[r.job]
  const s = job.levels[r.level]
  const pos = run.party.indexOf(i)
  const inParty = pos >= 0
  const isFront = pos === 0
  const full = run.party.length >= run.slots

  const front = isFront ? ` <span class="front">🛡️앞열</span>` : ''
  // 고정 셀(HP·ATK·방어·속도[·힐]). 1열=grid 고정폭으로 카드 간 열 정렬, 2열=flex(빈 칸 숨김).
  // def는 딜러도 빈 셀 렌더 → 1열서 방어 열 자리 유지(속도가 같은 열에 정렬). 힐은 있을 때만.
  const cell = (k, txt) => `<span class="stat st-${k}">${txt}</span>`
  const nums = cell('hp', `HP ${s.hp}`) + cell('atk', `ATK ${s.atk}`)
    + cell('def', job.def ? `방어 ${job.def}` : '') + cell('spd', `속도 ${job.spd}`)
    + (s.heal ? cell('heal', `힐 ${s.heal}`) : '')
  const toggle = inParty
    ? `<button class="mini" data-action="toggle" data-i="${i}">대기</button>`
    : full
      ? `<button class="mini" disabled title="슬롯 꽉참">출전</button>`
      : `<button class="mini" data-action="toggle" data-i="${i}">출전</button>`
  const drag = inParty ? ` data-drag="party" data-pos="${pos}"` : ''

  return `<div class="card${inParty ? ' in' : ''}${isFront ? ' front-card' : ''}" data-action="openModal" data-i="${i}"${drag}>
  <div class="card-main">
    <div class="ctop"><span class="jb">${esc(job.name)}</span> <span class="lv">Lv${r.level}</span>${front}${toggle}</div>
    ${hpBar(100)}
    <div class="numrow"><span class="nums">${nums}</span></div>
  </div>
  <div class="skills2">${skillPills(r.job, r, i)}</div>
</div>`
}
