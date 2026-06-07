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
  const nums = `HP ${s.hp} · ATK ${s.atk}${job.def ? ` · 방어 ${job.def}` : ''}${s.heal ? ` · 힐 ${s.heal}` : ''}`
  const toggle = inParty
    ? `<button class="mini" data-action="toggle" data-i="${i}">대기</button>`
    : full
      ? `<button class="mini" disabled title="슬롯 꽉참">출전</button>`
      : `<button class="mini" data-action="toggle" data-i="${i}">출전</button>`
  const drag = inParty ? ` data-drag="party" data-pos="${pos}"` : ''

  return `<div class="card${inParty ? ' in' : ''}${isFront ? ' front-card' : ''}" data-action="openModal" data-i="${i}"${drag}>
  <div class="card-main">
    <div class="ctop"><span class="jb">${esc(job.name)}</span> <span class="lv">Lv${r.level}</span>${front}</div>
    ${hpBar(100)}
    <div class="numrow"><span class="nums">${nums}</span>${toggle}</div>
  </div>
  <div class="skills2">${skillPills(r.job, r, i)}</div>
</div>`
}
