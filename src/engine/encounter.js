// 절차적 조우 생성. 일반 몹은 풀 랜덤, 보스는 monId 명시(스테이지 배치 미정).
// 트레잇 = 고정(fixed/보스 intrinsic) + 스테이지 슬롯 랜덤 + 보스 bonus 슬롯. 순수(rng 주입).
import { MONSTERS, BOSSES } from '../data/monsters.js'
import { TRAITS } from '../data/traits.js'
import { levelCurve } from '../data/curve.js'
import { STAGES } from '../data/stages.js'

const ALL = { ...MONSTERS, ...BOSSES }

// monId 명시 시 그 몹(일반·보스 무관), 없으면 일반 풀에서 랜덤. (보스는 아직 자동 배치 안 함.)
export function generateEncounter(stage, rng, monId = null) {
  const cfg = STAGES[stage]
  const mon = monId ? ALL[monId] : rng.pick(Object.values(MONSTERS))
  const c = levelCurve(cfg.level)
  const traits = [...(mon.fixed || [])]                                 // 고정 특성 먼저
  const slots = [...cfg.traitSlots, ...(mon.bonus || [])]               // 스테이지 슬롯 + 보스 추가 슬롯
  for (const rarity of slots) {
    const pool = Object.values(TRAITS).filter(t => t.rarity === rarity && !traits.includes(t.id))
    if (pool.length) traits.push(rng.pick(pool).id) // distinct 랜덤 1 (풀 소진 시 스킵)
  }
  return {
    name: mon.name,
    hp:  Math.round(c.hp  * mon.mul.hp),
    atk: Math.round(c.atk * mon.mul.atk),
    def: Math.round(c.def * mon.mul.def),
    spd: Math.round(c.spd * mon.mul.spd),
    aoe: Boolean(mon.aoe),
    boss: Boolean(mon.boss),
    traits,
  }
}
