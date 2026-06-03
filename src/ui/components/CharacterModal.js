// 캐릭터 상세 모달. 풀스탯 + 강화/전직/학습/스킬레벨업(+before→after 미리보기) + 우선순위 드래그.
// ui.modal = roster 인덱스 | null. null이면 '' 반환.
import { JOBS } from '../../data/jobs.js'
import { SKILLS } from '../../data/skills.js'
import { unitSkillIds, normalizeSkillOrder } from '../../engine/unit.js'
import {
  UPGRADE_COST, MAX_LEVEL, PROMOTE_COST, PROMOTE_TARGETS,
  LEARN_COST, SKILL_LV_COST, MAX_SKILL_LEVEL,
} from '../../engine/run.js'
import { upgradePreview, skillUpPreview } from '../preview.js'
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

function skillMgmt(run, i, r, job) {
  const actives = job.skills.slice(0, -1)
  if (actives.length === 0) return ''
  const learned = r.learnedSkills || []
  const rows = actives.map((sid) => {
    const nm = esc(SKILLS[sid].name)
    if (learned.includes(sid)) {
      const lv = (r.skillLevels && r.skillLevels[sid]) || 1
      const pv = skillUpPreview(SKILLS[sid], lv)
      const pvTxt = pv && pv.power ? ` <span class="preview">위력 ×${pv.power.before}→×${pv.power.after}</span>`
        : pv ? ` <span class="preview">Lv${pv.fromLevel}→${pv.toLevel}</span>` : ` <span class="hint">만렙</span>`
      const btn = lv < MAX_SKILL_LEVEL
        ? `<button data-action="levelupSkill" data-i="${i}" data-skill="${sid}"${run.gold < SKILL_LV_COST ? ' disabled' : ''}>레벨업(${SKILL_LV_COST})</button>` : ''
      return `<div class="skill-row"><span class="sk-name have" data-tip="skill" data-skill="${sid}" data-lvl="${lv}">${nm} Lv${lv}</span> ${btn}${pvTxt}</div>`
    }
    return `<div class="skill-row"><span class="sk-name no" data-tip="skill" data-skill="${sid}" data-lvl="1">${nm}</span> <button data-action="learnSkill" data-i="${i}" data-skill="${sid}"${run.gold < LEARN_COST ? ' disabled' : ''}>학습(${LEARN_COST})</button></div>`
  }).join('')
  return `<div class="modal-section"><div class="ms-title">스킬</div>${rows}</div>`
}

function priorityList(i, r, job) {
  const order = normalizeSkillOrder(unitSkillIds(job, r.learnedSkills), r.skillOrder)
  if (order.length < 2) return ''
  const items = order.map((sid, k) =>
    `<li class="prio-item" data-drag="prio" data-i="${i}" data-skill="${sid}"><span class="handle">⠿</span> ${k + 1}. ${esc(SKILLS[sid].name)}</li>`
  ).join('')
  return `<div class="modal-section"><div class="ms-title">스킬 우선순위 (드래그)</div><ol class="prio-list">${items}</ol></div>`
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
    ${skillMgmt(run, i, r, job)}
    ${priorityList(i, r, job)}
  </div>
</div>`
}
