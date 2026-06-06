// 캐릭터 상세 모달. 풀스탯 + 강화/전직 + 스킬(우선순위 드래그 · 클릭=상세 2차 팝업).
// 학습/레벨업은 스킬 상세 팝업(SkillDetailModal)으로 이동. ui.modal = roster 인덱스 | null.
import { JOBS } from '../../data/jobs.js'
import { SKILLS } from '../../data/skills.js'
import { unitSkillIds, normalizeSkillOrder } from '../../engine/unit.js'
import { UPGRADE_COST, MAX_LEVEL, PROMOTE_COST, PROMOTE_TARGETS } from '../../engine/run.js'
import { upgradePreview } from '../preview.js'
import { esc } from './parts.js'

const ROLE_KO = { dps: '공격', tank: '탱커', heal: '힐러' }
const STAT_KO = { hp: 'HP', atk: 'ATK', heal: '힐' }

function upgradeBlock(run, i, r, job) {
  if (r.job === 'novice') {
    if (r.level !== 1) return ''
    const btns = PROMOTE_TARGETS.map((jk) =>
      `<button data-action="promote" data-i="${i}" data-job="${jk}"${run.gold < PROMOTE_COST ? ' disabled' : ''}>→${esc(JOBS[jk].name)}</button>`
    ).join(' ')
    return `<div class="modal-section"><div class="ms-title">전직 (${PROMOTE_COST}골드)</div><div class="promote-btns">${btns}</div></div>`
  }
  const pv = upgradePreview(r.job, r.level)
  if (!pv) return `<div class="modal-section"><div class="ms-title">강화</div><span class="hint">만렙</span></div>`
  const delta = pv.stats.map((s) => `${STAT_KO[s.key]} ${s.before}→<b>${s.after}</b> <span class="delta">(+${s.delta})</span>`).join(' · ')
  return `<div class="modal-section"><div class="ms-title">강화</div>
  <button data-action="upgrade" data-i="${i}"${run.gold < UPGRADE_COST ? ' disabled' : ''}>강화 Lv${pv.toLevel} (${UPGRADE_COST})</button>
  <div class="preview">${delta}</div></div>`
}

// 장착 스킬(학습 액티브 + 기본공격) = 우선순위 드래그 리스트(클릭=상세). 미학습 액티브 = pill(클릭=상세→학습).
function skillList(i, r, job) {
  const basic = job.skills[job.skills.length - 1]
  const equipped = normalizeSkillOrder(unitSkillIds(job, r.learnedSkills), r.skillOrder)
  const learned = r.learnedSkills || []
  const draggable = equipped.length > 1
  const items = equipped.map((sid, k) => {
    const lvTxt = sid === basic ? '' : ` Lv${(r.skillLevels && r.skillLevels[sid]) || 1}`
    const dragAttr = draggable ? 'data-drag="prio" ' : ''
    return `<li class="prio-item" ${dragAttr}data-action="openSkill" data-i="${i}" data-skill="${sid}"><span class="handle">⠿</span> ${k + 1}. ${esc(SKILLS[sid].name)}${lvTxt}</li>`
  }).join('')
  const unlearned = job.skills.slice(0, -1).filter((sid) => !learned.includes(sid))
  const unlearnedBlock = unlearned.length
    ? `<div class="ms-title">미학습</div><div class="skill-pills">${unlearned.map((sid) =>
        `<span class="sk no" data-action="openSkill" data-i="${i}" data-skill="${sid}">${esc(SKILLS[sid].name)}</span>`).join('')}</div>`
    : ''
  const title = draggable ? '스킬 (드래그=우선순위 · 클릭=상세)' : '스킬 (클릭=상세)'
  return `<div class="modal-section"><div class="ms-title">${title}</div><ol class="prio-list">${items}</ol>${unlearnedBlock}</div>`
}

export function renderModal(run, ui) {
  const i = ui.modal
  if (i == null || !run.roster[i]) return ''
  const r = run.roster[i]
  const job = JOBS[r.job]
  const s = job.levels[r.level]
  const stats = [`HP ${s.hp}`, `ATK ${s.atk}`, `SPD ${job.spd}`,
    ...(s.heal ? [`힐 ${s.heal}`] : []), `마나 ${job.mana}`, ROLE_KO[job.role] || job.role].join(' · ')
  return `<div class="modal-overlay" data-action="closeModal">
  <div class="modal" data-stop="1">
    <div class="modal-head"><span class="jb">${esc(job.name)} Lv${r.level}</span><button class="modal-close" data-action="closeModal">✕</button></div>
    <div class="modal-stats">${stats}</div>
    ${upgradeBlock(run, i, r, job)}
    ${skillList(i, r, job)}
  </div>
</div>`
}
