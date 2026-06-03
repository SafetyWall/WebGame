// 레벨업/스킬업 전후(before→after) 미리보기 계산(순수). 모달이 표시.
import { JOBS } from '../data/jobs.js'
import { skillLevelMult } from '../engine/battle.js'
import { MAX_LEVEL, MAX_SKILL_LEVEL } from '../engine/run.js'

const round2 = (n) => Math.round(n * 100) / 100

// 캐릭 강화(레벨 +1) 전후 스탯. 노비스·만렙 = null(강화 불가).
export function upgradePreview(jobKey, level) {
  const job = JOBS[jobKey]
  if (!job || jobKey === 'novice' || level >= MAX_LEVEL) return null
  const a = job.levels[level], b = job.levels[level + 1]
  if (!a || !b) return null
  const keys = ['hp', 'atk', 'heal'].filter((k) => a[k] != null || b[k] != null)
  const stats = keys.map((k) => ({ key: k, before: a[k] || 0, after: b[k] || 0, delta: (b[k] || 0) - (a[k] || 0) }))
  return { fromLevel: level, toLevel: level + 1, stats }
}

// 스킬 레벨업(+1) 전후 위력 배율. 미학습(lv0)·만렙 = null.
export function skillUpPreview(skill, curLevel) {
  if (!skill || !curLevel || curLevel >= MAX_SKILL_LEVEL) return null
  const m0 = skillLevelMult(curLevel), m1 = skillLevelMult(curLevel + 1)
  const power = skill.power > 0 ? { before: round2(skill.power * m0), after: round2(skill.power * m1) } : null
  return { fromLevel: curLevel, toLevel: curLevel + 1, multBefore: m0, multAfter: m1, power }
}
