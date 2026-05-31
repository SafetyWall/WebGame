// 런 상태기계(순수, 인메모리). 조우 RNG는 newRun/next에 주입(전투는 결정론).
// RunState = { phase:'prep'|'result', gold, stage, slots, roster:[{job,level}], party:[idx], encounter, lastResult }
import { JOBS } from '../data/jobs.js'
import { makeUnit, makeMob } from './unit.js'
import { runBattle } from './battle.js'
import { generateEncounter } from './encounter.js'
import { STAGES } from '../data/stages.js'

export const START_GOLD = 5
export const START_SLOTS = 3
export const RECRUIT_COST = 4
export const UPGRADE_COST = 4
export const MAX_LEVEL = 5
export const MAX_STAGE = Math.max(...Object.keys(STAGES).map(Number))
export const reward = (stage) => 4 + stage

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
  if (!u || s.gold < UPGRADE_COST || u.level >= MAX_LEVEL) return s
  const roster = s.roster.map((r, j) => (j === i ? { ...r, level: r.level + 1 } : r))
  return { ...s, gold: s.gold - UPGRADE_COST, roster }
}

export function toggleParty(s, i) {
  if (s.party.includes(i)) return { ...s, party: s.party.filter((x) => x !== i) }
  if (s.party.length >= s.slots) return s
  return { ...s, party: [...s.party, i] }
}

export function fight(s) {
  if (s.party.length === 0) return s
  const units = s.party.map((i) => makeUnit(JOBS[s.roster[i].job], s.roster[i].level))
  const r = runBattle(units, makeMob(s.encounter))
  if (r.winner === 'party') {
    const rw = reward(s.stage)
    const outcome = s.stage >= MAX_STAGE ? 'clear' : 'win'
    return { ...s, phase: 'result', gold: s.gold + rw, lastResult: { outcome, rounds: r.rounds, ticks: r.ticks, reward: rw } }
  }
  return { ...s, phase: 'result', lastResult: { outcome: 'loss', rounds: r.rounds, ticks: r.ticks, reward: 0 } }
}

export function next(s, rng) {
  const stage = s.stage + 1
  return { ...s, phase: 'prep', stage, encounter: generateEncounter(stage, rng), lastResult: null }
}

export function restart(rng) {
  return newRun(rng)
}
