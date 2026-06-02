// 직업/몹 데이터(불변)를 전투용 인스턴스(가변 hp/gauge)로 변환.
import { SKILLS } from '../data/skills.js'
import { TRAITS } from '../data/traits.js'
let _id = 0

// 플레이어 스킬 우선순위 보정: order에서 직업 보유 스킬만 추려 그 순서로, 누락된 직업 스킬은 뒤에 append.
// → 항상 직업 스킬 전부 1회씩 포함하는 유효 순서. order 없으면 직업 기본 순서(job.skills).
export function normalizeSkillOrder(job, order) {
  if (!Array.isArray(order)) return job.skills.slice()
  const valid = order.filter(id => job.skills.includes(id))
  return [...valid, ...job.skills.filter(id => !valid.includes(id))]
}

export function makeUnit(job, level = 1, skillOrder = null) {
  const s = job.levels[level]
  if (!s) throw new RangeError(`makeUnit: no stats for ${job.name} level ${level}`)
  return {
    id: ++_id,
    name: job.name,
    level,
    maxHp: s.hp,
    hp: s.hp,
    atk: s.atk,
    spd: job.spd,
    role: job.role,
    heal: s.heal || 0,
    skills: normalizeSkillOrder(job, skillOrder).map(id => SKILLS[id]), // id → 공유 def 참조(플레이어 우선순위 반영).
    def: 0,            // 플레이어 유닛은 방어 없음(버프=받는뎀 배율로)
    gauge: 0,
    mana: 0,           // step5: 평타가 충전, 발동스킬이 소비
    manaMax: job.mana ?? 100,   // 직업별 마나 상한(레벨 불변, 전직으로만)
    cooldowns: {},     // skillId → readyTick
    effects: [],       // 전투중 버프/디버프 인스턴스
  }
}

export function makeMob(mob) {
  return {
    name: mob.name,
    maxHp: mob.hp,
    hp: mob.hp,
    atk: mob.atk,
    def: mob.def || 0,
    spd: mob.spd,
    aoe: Boolean(mob.aoe),
    aoeRatio: mob.aoeRatio || 0.6,
    traits: (mob.traits || []).map(id => TRAITS[id]), // id → 공유 def. 없으면 []
    effects: [],       // step5: 전사 방깎·가디언 약뎀감 등 대상
    gauge: 0,
    isMob: true,
  }
}
