// 트레잇 규칙 인터프리터. 순수, DOM·RNG 0. ui/sim 무관.
// applyRules: 주어진 trigger에 매칭+cond통과 규칙을 priority 오름차순으로 적용.
// value-변환 op(mult/add)는 running value 변형, side-effect op(heal/reflect)는 mob/attacker 작용.
// exclusive 규칙 적용 후 중단. 동일 priority = mob.traits 배열 순서(V8 stable sort).

function condMatch(cond, ctx) {
  if (!cond) return true
  for (const k in cond) if (cond[k] !== ctx[k]) return false
  return true
}

function applyOp(rule, value, ctx, mob) {
  switch (rule.op) {
    case 'mult': return value * rule.value
    case 'add':  return value + rule.value
    case 'heal': mob.hp = Math.min(mob.maxHp, mob.hp + rule.value); return value
    case 'reflect':
      if (ctx.attacker) ctx.attacker.hp = Math.max(0, ctx.attacker.hp - Math.floor(ctx.damage * rule.value))
      return value
    default: return value
  }
}

export function applyRules(trigger, value, ctx, mob) {
  const rules = (mob.traits || [])
    .filter(r => r.trigger === trigger && condMatch(r.cond, ctx))
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
  for (const r of rules) {
    value = applyOp(r, value, ctx, mob)
    if (r.exclusive) break
  }
  return value
}

// === 특성 2차 — 몹 공격측 메타 합산(트레잇의 메타 필드 직접 읽음, 최댓값) ===
// 관통: 몹 공격이 플레이어 def 일부 무시(effDef = def×(1−pierce)).
export function pierceFrac(mob) {
  return (mob.traits || []).reduce((m, t) => Math.max(m, t.pierce || 0), 0)
}
// 흡혈: 몹이 가한 데미지의 일부를 자기 회복.
export function lifestealFrac(mob) {
  return (mob.traits || []).reduce((m, t) => Math.max(m, t.lifesteal || 0), 0)
}

// 연타봉쇄: 멀티히트 타격 횟수 상한(트레잇 hitCap 최솟값). 미지정=Infinity(무제한).
export function hitCap(mob) {
  return (mob.traits || []).reduce((m, t) => (t.hitCap !== undefined ? Math.min(m, t.hitCap) : m), Infinity)
}

// 저항 메타 = 남는 위력 배율(resist.<key>). 0=면역, 0.5=절반, 미지정=undefined(무저항). 다중=최솟값(최강 저항).
export function metaResist(mob, key) {
  let v
  for (const t of (mob.traits || [])) {
    const r = t.resist && t.resist[key]
    if (r !== undefined) v = (v === undefined) ? r : Math.min(v, r)
  }
  return v
}
