// 스킬 상세 2차 팝업. ui.skillDetail = { i: roster인덱스, skillId } | null. null이면 ''.
// 상단=코어 설명(부여효과 제외) / 부여 효과=명명 키워드+효과+지속(분리 표기) / 맨 밑=레벨업 시 바뀌는 값만 + 버튼.
import { JOBS } from '../../data/jobs.js'
import { SKILLS } from '../../data/skills.js'
import { LEARN_COST, SKILL_LV_COST, MAX_SKILL_LEVEL } from '../../engine/run.js'
import { skillCoreLines, effectClause, effectShortValue, effectTargetKo } from '../describe.js'
import { statusName, statusKind } from '../status.js'
import { skillUpPreview } from '../preview.js'
import { esc } from './parts.js'

export function renderSkillDetail(run, ui) {
  const d = ui.skillDetail
  if (!d || !run.roster[d.i]) return ''
  const r = run.roster[d.i]
  const skill = SKILLS[d.skillId]
  if (!skill) return ''
  const job = JOBS[r.job]
  const isBasic = d.skillId === job.skills[job.skills.length - 1]
  const isActive = !isBasic
  const learned = (r.learnedSkills || []).includes(d.skillId)
  const lv = (r.skillLevels && r.skillLevels[d.skillId]) || 1
  const dispLv = learned ? lv : 1
  const canLevel = isActive && learned && lv < MAX_SKILL_LEVEL

  const header = `${esc(skill.name)}${isActive && learned ? ` Lv${lv}` : ''}`
  const core = skillCoreLines(skill, dispLv).map((l) => `<div class="sd-line">${esc(l)}</div>`).join('')

  // 부여 효과 = 키워드 pill + 효과 문구 + 지속(라벨). 현재 값만(레벨업 비교는 맨 밑).
  const kw = (skill.effects || []).map((e) => {
    const tgt = effectTargetKo(e.target)
    const dur = e.duration ? `<div class="sd-dur">지속 ${e.duration}틱</div>` : ''
    return `<div class="sd-kw">
      <span class="eff ${statusKind(e.type, e.value)}">${esc(statusName(e.type, e.value))}</span>${tgt ? ` <span class="sd-kw-target">${esc(tgt)}</span>` : ''}
      <div class="sd-kw-desc">${esc(effectClause(e, dispLv))}</div>${dur}
    </div>`
  }).join('')
  const kwBlock = kw ? `<div class="sd-section"><div class="ms-title">부여 효과</div>${kw}</div>` : ''

  // 학습/레벨업 푸터 = 캐릭 모달에서 연 경우만(ui.modal != null). 카드에서 직접 열면 읽기전용(인스펙트).
  const showFooter = ui.modal != null

  // 맨 밑 = 학습/레벨업. 레벨업은 "바뀌는 것만" (위력·effect 값 before→after).
  let foot
  if (!isActive) {
    foot = `<span class="hint">기본 공격 — 학습·레벨업 없음</span>`
  } else if (!learned) {
    foot = `<button data-action="learnSkill" data-i="${d.i}" data-skill="${d.skillId}"${run.gold < LEARN_COST ? ' disabled' : ''}>학습 (${LEARN_COST}골드)</button>`
  } else if (canLevel) {
    const changes = []
    const pv = skillUpPreview(skill, lv)
    if (pv && pv.power) changes.push(`위력 ×${pv.power.before} → ×${pv.power.after}`)
    for (const e of (skill.effects || [])) {
      const b = effectShortValue(e, lv), a = effectShortValue(e, lv + 1)
      // 효과 문구(현재) → 다음 값. "방어 -50%"식 키워드+값 오독 방지(받는 데미지 -50% → -60%).
      if (b != null && a != null && b !== a) changes.push(`${effectClause(e, lv)} → ${a}`)
    }
    const lines = changes.map((c) => `<div class="sd-change">${esc(c)}</div>`).join('')
    foot = `<div class="ms-title">레벨업 Lv${lv} → ${lv + 1}</div>${lines}
      <button data-action="levelupSkill" data-i="${d.i}" data-skill="${d.skillId}"${run.gold < SKILL_LV_COST ? ' disabled' : ''}>레벨업 (${SKILL_LV_COST}골드)</button>`
  } else {
    foot = `<span class="hint">최대 레벨</span>`
  }

  return `<div class="modal-overlay skill-detail-overlay" data-action="closeSkill">
  <div class="modal sd-modal" data-stop="1">
    <div class="modal-head"><span class="jb">${header}</span><button class="modal-close" data-action="closeSkill">✕</button></div>
    <div class="sd-lines">${core}</div>
    ${kwBlock}
    ${showFooter ? `<div class="sd-action">${foot}</div>` : ''}
  </div>
</div>`
}
