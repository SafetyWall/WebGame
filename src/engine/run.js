// 런 상태기계(순수, 인메모리). 조우 RNG는 newRun/next에 주입(전투는 결정론).
// RunState = { phase:'prep'|'result', gold, stage, slots, roster:[{job,level}], party:[idx], encounter, lastResult }
import { JOBS } from '../data/jobs.js'
import { makeUnit, makeMob, normalizeSkillOrder, unitSkillIds } from './unit.js'
import { runBattle } from './battle.js'
import { generateEncounter } from './encounter.js'
import { STAGES } from '../data/stages.js'

export const START_GOLD = 20
export const START_SLOTS = 3
export const RECRUIT_COST = 4
export const UPGRADE_COST = 8        // 캐릭 레벨업(스킬레벨업보다 비싸게). 1→10 = 9회.
export const MAX_LEVEL = 10          // 1차 직업 상한(레벨10 = 2차전직 해금 — 2차전직은 후속 조각).
export const MAX_STAGE = Math.max(...Object.keys(STAGES).map(Number))
export const reward = (stage) => 10 + 2 * stage   // 보상↑(만렙+풀스킬 2~3기 골드 목표). 플레이로 튜닝.
export const PROMOTE_COST = 10
// 가디언 = 베이스 전직서 제거(미래 전사 2차전직). JOB 정의는 유지.
export const PROMOTE_TARGETS = ['warrior', 'mage', 'priest', 'rogue', 'archer']
export const PROMOTE_LEVEL = 1   // 노비스 전직 레벨(고정). 이 레벨엔 강화 불가 — 전직만(전직=레벨업).

export function newRun(rng) {
  return {
    phase: 'prep',
    gold: START_GOLD,
    stage: 1,
    slots: START_SLOTS,
    roster: [{ job: 'novice', level: 1 }, { job: 'novice', level: 1 }],
    party: [0, 1],
    encounter: generateEncounter(1, rng),
    lastResult: null,
  }
}

export function recruit(s) {
  if (s.gold < RECRUIT_COST) return s
  return { ...s, gold: s.gold - RECRUIT_COST, roster: [...s.roster, { job: 'novice', level: 1 }] }
}

export function upgrade(s, i) {
  const u = s.roster[i]
  // 노비스는 강화 불가 — 성장 = 전직(전직 레벨에서 강제). 비노비스만 레벨업.
  if (!u || u.job === 'novice' || s.gold < UPGRADE_COST || u.level >= MAX_LEVEL) return s
  const roster = s.roster.map((r, j) => (j === i ? { ...r, level: r.level + 1 } : r))
  return { ...s, gold: s.gold - UPGRADE_COST, roster }
}

// 전직 = 노비스만, 전직 레벨(PROMOTE_LEVEL)에서만. 비가역. 레벨 자동 +1(전직=그 레벨의 레벨업).
export function changeJob(s, i, job) {
  const u = s.roster[i]
  if (!u || u.job !== 'novice' || u.level !== PROMOTE_LEVEL) return s
  if (!PROMOTE_TARGETS.includes(job) || s.gold < PROMOTE_COST) return s
  const basic = JOBS[job].skills[0]   // 전직 시 기본 학습 스킬 1개(첫 액티브)
  const roster = s.roster.map((r, j) => (j === i
    ? { ...r, job, level: r.level + 1, learnedSkills: [basic], skillLevels: { [basic]: 1 }, skillOrder: null }
    : r))
  return { ...s, gold: s.gold - PROMOTE_COST, roster }
}

export const LEARN_COST = 6        // 스킬 학습비(전직 기본 1개 외 3개 유료)
export const SKILL_LV_COST = 4     // 스킬 레벨업비(캐릭 레벨업 8보다 쌈)
export const MAX_SKILL_LEVEL = 5

// 스킬 학습: 해당 직업 액티브(평타 제외)이고 미학습이면 추가(레벨1). 비용 LEARN_COST.
export function learnSkill(s, i, skillId) {
  const u = s.roster[i]
  if (!u || s.gold < LEARN_COST) return s
  const actives = JOBS[u.job].skills.slice(0, -1)   // 평타(마지막) 제외
  const learned = u.learnedSkills || []
  if (!actives.includes(skillId) || learned.includes(skillId)) return s
  const roster = s.roster.map((r, j) => (j === i
    ? { ...r, learnedSkills: [...learned, skillId], skillLevels: { ...(r.skillLevels || {}), [skillId]: 1 } }
    : r))
  return { ...s, gold: s.gold - LEARN_COST, roster }
}

// 스킬 레벨업: 학습됨 & lv<MAX_SKILL_LEVEL이면 +1. 비용 SKILL_LV_COST.
export function levelUpSkill(s, i, skillId) {
  const u = s.roster[i]
  if (!u || s.gold < SKILL_LV_COST) return s
  const learned = u.learnedSkills || []
  const lv = (u.skillLevels && u.skillLevels[skillId]) || 0
  if (!learned.includes(skillId) || lv < 1 || lv >= MAX_SKILL_LEVEL) return s
  const roster = s.roster.map((r, j) => (j === i
    ? { ...r, skillLevels: { ...(r.skillLevels || {}), [skillId]: lv + 1 } }
    : r))
  return { ...s, gold: s.gold - SKILL_LV_COST, roster }
}

export const slotCost = (slots) => 5 + 4 * (slots - 3)   // 체증: 3→4=5, 4→5=9, 5→6=13 (하드상한 없음)

export function expandSlot(s) {
  const cost = slotCost(s.slots)
  if (s.gold < cost) return s
  return { ...s, gold: s.gold - cost, slots: s.slots + 1 }
}

// 스킬 우선순위 재배열(무료, 빌드 단계 선택). dir=-1 위로/+1 아래로. 결과를 roster[i].skillOrder에 저장.
export function reorderSkill(s, i, skillId, dir) {
  const u = s.roster[i]
  if (!u) return s
  const order = normalizeSkillOrder(unitSkillIds(JOBS[u.job], u.learnedSkills), u.skillOrder)
  const basic = order[order.length - 1]                    // 평타 = 우선순위 끝 고정
  if (skillId === basic) return s                          // 평타는 이동 불가
  const idx = order.indexOf(skillId)
  const j = idx + dir
  if (idx < 0 || j < 0 || j >= order.length - 1) return s  // 없는 스킬·경계·평타 슬롯(마지막) 침범 → no-op
  const next = order.slice()
  ;[next[idx], next[j]] = [next[j], next[idx]]
  const roster = s.roster.map((r, k) => (k === i ? { ...r, skillOrder: next } : r))
  return { ...s, roster }
}

// 출전 순서(=앞열) 재배열. i=roster 인덱스. dir=-1 앞으로/+1 뒤로. party 배열 순서가 줄(앞→뒤).
export function reorderParty(s, i, dir) {
  const pos = s.party.indexOf(i)
  const j = pos + dir
  if (pos < 0 || j < 0 || j >= s.party.length) return s     // 미출전·경계 밖 → no-op
  const party = s.party.slice()
  ;[party[pos], party[j]] = [party[j], party[pos]]
  return { ...s, party }
}

export function toggleParty(s, i) {
  if (s.party.includes(i)) return { ...s, party: s.party.filter((x) => x !== i) }
  if (s.party.length >= s.slots) return s
  return { ...s, party: [...s.party, i] }
}

export function fight(s) {
  if (s.phase !== 'prep') return s     // 준비 국면에서만 전투(결과 국면 재실행 → 보상 중복 방지)
  if (s.party.length === 0) return s
  const units = s.party.map((i) => {
    const r = s.roster[i]
    return makeUnit(JOBS[r.job], r.level, r.skillOrder, r.skillLevels, r.learnedSkills)
  })
  const r = runBattle(units, makeMob(s.encounter))
  if (r.winner === 'party') {
    const rw = reward(s.stage)
    const outcome = s.stage >= MAX_STAGE ? 'clear' : 'win'
    return { ...s, phase: 'result', gold: s.gold + rw, lastResult: { outcome, rounds: r.rounds, ticks: r.ticks, reward: rw } }
  }
  return { ...s, phase: 'result', lastResult: { outcome: 'loss', rounds: r.rounds, ticks: r.ticks, reward: 0 } }
}

export function next(s, rng) {
  if (s.stage >= MAX_STAGE) return s   // 최종 스테이지 = 종착, next 거부(STAGES[6] 크래시 방지)
  const stage = s.stage + 1
  return { ...s, phase: 'prep', stage, encounter: generateEncounter(stage, rng), lastResult: null }
}

export function restart(rng) {
  return newRun(rng)
}

// 전투 재생뷰용 액션단위 frame. 전투는 결정론 → 같은 (party,encounter) = lastResult와 동일 전개.
// UI에서만 호출(ui 상태에 보관, 영속 안 함). 빈 파티 = [].
export function battleFrames(s) {
  if (!s.encounter || !s.party || s.party.length === 0) return []
  const units = s.party.map((i) => {
    const r = s.roster[i]
    return makeUnit(JOBS[r.job], r.level, r.skillOrder, r.skillLevels, r.learnedSkills)
  })
  return runBattle(units, makeMob(s.encounter), { record: true }).frames
}
