// 드래그 드롭 = 목표 인덱스로 이동. 기존 run.js ±1 액션(reorderParty/reorderSkill)을 |delta|회 접어 적용.
// → run.js 무변경(스펙). 순수.
import { JOBS } from '../data/jobs.js'
import { unitSkillIds, normalizeSkillOrder } from '../engine/unit.js'
import * as run from '../engine/run.js'

// 출전 순서: rosterIdx 유닛을 party의 toPos로.
export function movePartyTo(s, rosterIdx, toPos) {
  const from = s.party.indexOf(rosterIdx)
  if (from < 0 || toPos < 0 || toPos >= s.party.length) return s
  const dir = toPos > from ? 1 : -1
  for (let k = 0; k < Math.abs(toPos - from); k++) s = run.reorderParty(s, rosterIdx, dir)
  return s
}

// 스킬 우선순위: roster[i]의 skillId를 order의 toIndex로.
export function movePrioTo(s, i, skillId, toIndex) {
  const r = s.roster[i]
  if (!r) return s
  const order = normalizeSkillOrder(unitSkillIds(JOBS[r.job], r.learnedSkills), r.skillOrder)
  const from = order.indexOf(skillId)
  if (from < 0 || toIndex < 0 || toIndex >= order.length) return s
  const dir = toIndex > from ? 1 : -1
  for (let k = 0; k < Math.abs(toIndex - from); k++) s = run.reorderSkill(s, i, skillId, dir)
  return s
}
