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
      if (ctx.attacker) ctx.attacker.hp -= Math.floor(ctx.damage * rule.value)
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
