// 직업/몹 데이터(불변)를 전투용 인스턴스(가변 hp/gauge)로 변환.
import { SKILLS } from '../data/skills.js'
import { TRAITS } from '../data/traits.js'
let _id = 0

// 유닛이 전투에서 쓰는 스킬 id = 학습한 액티브 + 평타(job.skills 마지막). learnedSkills 미지정=전체(하위호환).
export function unitSkillIds(job, learnedSkills) {
  const basic = job.skills[job.skills.length - 1]            // 평타 = 마지막
  if (!Array.isArray(learnedSkills)) return job.skills.slice()
  const actives = job.skills.slice(0, -1).filter(id => learnedSkills.includes(id))
  return [...actives, basic]
}

// 우선순위 보정: 액티브만 order대로(누락분 뒤 append), **평타(=validIds 마지막)는 항상 끝 고정**.
// 평타는 cost0=항상 사용가능 → 앞에 오면 selectSkill이 늘 평타만 집어 액티브 무력화. 그래서 위로 못 올림.
export function normalizeSkillOrder(validIds, order) {
  const basic = validIds[validIds.length - 1]
  const reorderable = validIds.slice(0, -1)
  const head = Array.isArray(order) ? order.filter(id => reorderable.includes(id)) : []
  return [...head, ...reorderable.filter(id => !head.includes(id)), basic]
}

export function makeUnit(job, level = 1, skillOrder = null, skillLevels = {}, learnedSkills = null) {
  const s = job.levels[level]
  if (!s) throw new RangeError(`makeUnit: no stats for ${job.name} level ${level}`)
  const avail = unitSkillIds(job, learnedSkills)
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
    skills: normalizeSkillOrder(avail, skillOrder).map(id => SKILLS[id]), // 학습 스킬+평타, 우선순위 반영.
    def: job.def ?? 0, // 직업 메타 상수(탱 레버). % 경감식이라 레벨 불변. 미지정=0(딜러).
    gauge: 0,
    mana: 0,           // step5: 평타가 충전, 발동스킬이 소비
    manaMax: job.mana ?? 100,   // 직업별 마나 상한(레벨 불변, 전직으로만)
    skillLevels: skillLevels || {},   // skillId → 레벨(1~5). 없으면 1(평타·미학습).
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
