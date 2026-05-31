// ATB 평타 전투 엔진. 순수, DOM 의존 0. ui/sim 공용.

export function damage(atk, def) {
  return Math.max(1, atk - def)
}

export function lowestHpAlly(party) {
  const alive = party.filter(u => u.hp > 0)
  if (alive.length === 0) return null
  return alive.reduce((a, b) => (b.hp < a.hp ? b : a), alive[0])
}

export function selectMobTarget(party) {
  const taunt = party.find(u => u.hp > 0 && u.taunt)
  if (taunt) return taunt
  return lowestHpAlly(party)
}

const THRESHOLD = 1000
export const ROUND_TICKS = 100 // 표시용 라운드 묶음(틱). 전투 계산 영향 0.
const DEFAULT_MAX_TICKS = 20000

// 행동할 스킬 선택. 지금은 항상 첫 스킬. step5에서 마나/쿨/우선순위 canUse가 여기 얹힘.
function selectSkill(u) {
  return u.skills[0]
}

function actUnit(u, party, mob, log) {
  const skill = selectSkill(u)
  if (skill.kind === 'heal') {
    const target = lowestHpAlly(party)
    if (target) {
      target.hp = Math.min(target.maxHp, target.hp + u.heal)
      log.push(`${u.name} 회복 → ${target.name} (+${u.heal})`)
    }
    return
  }
  // kind === 'attack' → 몹 공격. skill.range는 step3b 근접회피가 이 지점에서 소비.
  const dmg = damage(u.atk, mob.def)
  mob.hp -= dmg
  log.push(`${u.name} 공격 → ${mob.name} (-${dmg})`)
}

function actMob(mob, party, log) {
  if (mob.aoe) {
    const base = Math.floor(mob.atk * mob.aoeRatio)
    const ref = party.find(u => u.hp > 0)
    for (const u of party) {
      if (u.hp > 0) u.hp -= damage(base, u.def)
    }
    // 로그는 실제 적용값 기준(하드코딩 0 금지 — 드리프트 방지). 현재 전원 def=0이라 동일.
    log.push(`${mob.name} 광역 (개당 -${damage(base, ref ? ref.def : 0)})`)
    return
  }
  const target = selectMobTarget(party)
  if (target) {
    const dmg = damage(mob.atk, target.def)
    target.hp -= dmg
    log.push(`${mob.name} 공격 → ${target.name} (-${dmg})`)
  }
}

export function runBattle(party, mob, opts = {}) {
  const maxTicks = opts.maxTicks ?? DEFAULT_MAX_TICKS
  const rounds = []
  let log = []
  let tick = 0

  const snapshot = (t) => ({
    tick: t,
    party: party.map(u => ({ name: u.name, hp: Math.max(0, u.hp), maxHp: u.maxHp })),
    mob: { name: mob.name, hp: Math.max(0, mob.hp), maxHp: mob.maxHp },
    log,
  })
  const finish = (winner) => {
    // 라운드 경계 틱(tick%28==0)에 끝나면 위에서 이미 푸시됨 → 같은 틱 중복 방지
    const last = rounds[rounds.length - 1]
    if (!last || last.tick !== tick) rounds.push(snapshot(tick))
    return { winner, rounds, ticks: tick }
  }

  while (tick < maxTicks) {
    tick++
    // ② 게이지 증가 (살아있는 유닛만)
    for (const u of party) if (u.hp > 0) u.gauge += u.spd
    if (mob.hp > 0) mob.gauge += mob.spd
    // ③ 행동: 파티 먼저(배열 순), 그다음 몹.
    // 동시틱 처리 = 파티 우선(의도된 결정, 2026-05-30 사용자 확정). 같은 틱에 양쪽 1000
    // 도달 + 파티가 치명타면 몹은 반격 못 함. ATB 속도순 아님 — 단순성 위해 고정.
    for (const u of party) {
      if (u.hp > 0 && u.gauge >= THRESHOLD) {
        u.gauge -= THRESHOLD
        actUnit(u, party, mob, log)
        if (mob.hp <= 0) break
      }
    }
    if (mob.hp > 0 && mob.gauge >= THRESHOLD) {
      mob.gauge -= THRESHOLD
      actMob(mob, party, log)
    }
    // 라운드 스냅샷 (표시 단위)
    if (tick % ROUND_TICKS === 0) { rounds.push(snapshot(tick)); log = [] }
    // 승패 판정
    if (mob.hp <= 0) return finish('party')
    if (party.every(u => u.hp <= 0)) return finish('mob')
  }
  return finish('mob') // 교착 → 몹 승
}
