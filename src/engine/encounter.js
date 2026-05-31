// 절차적 조우 생성. 풀 랜덤 몹 × 레벨커브 + 스테이지 슬롯별 distinct 랜덤 특성.
// 반환 = makeMob이 먹는 평면 스펙(스탯 계산됨 + traits id 배열). 순수(rng 주입).
import { MONSTERS } from '../data/monsters.js'
import { TRAITS } from '../data/traits.js'
import { levelCurve } from '../data/curve.js'
import { STAGES } from '../data/stages.js'

export function generateEncounter(stage, rng) {
  const cfg = STAGES[stage]
  const mon = rng.pick(Object.values(MONSTERS))
  const c = levelCurve(cfg.level)
  const traits = []
  for (const rarity of cfg.traitSlots) {
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
    traits,
  }
}
