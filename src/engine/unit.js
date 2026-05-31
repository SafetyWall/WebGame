// 직업/몹 데이터(불변)를 전투용 인스턴스(가변 hp/gauge)로 변환.
import { SKILLS } from '../data/skills.js'
let _id = 0

export function makeUnit(job) {
  return {
    id: ++_id,
    name: job.name,
    maxHp: job.hp,
    hp: job.hp,
    atk: job.atk,
    spd: job.spd,
    role: job.role,
    taunt: Boolean(job.taunt),
    heal: job.heal || 0,
    skills: job.skills.map(id => SKILLS[id]), // id → 공유 def 참조. 가변상태(쿨/마나)는 step5에 유닛으로.
    def: 0,            // 플레이어 유닛은 방어 없음
    gauge: 0,
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
    gauge: 0,
    isMob: true,
  }
}
