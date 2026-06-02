// 전투중 일시 버프/디버프. 순수, DOM·RNG 0. 몹 트레잇(applyRules)과 평행:
// 트레잇=몹 정적특성(조우생성 고정), effect=전투중 일시상태(스킬 부여·틱 만료).
// effect = { type, value, source, expireTick, interval?, nextTick? }
//   type∈{dmgTaken,dmgDealt,taunt,hot}. value=배율 | 회복량 | 무의미.

// refresh: 같은 (type, source) 있으면 그 자리 교체(expireTick·value 갱신), 없으면 push.
export function applyEffect(target, eff) {
  const i = target.effects.findIndex(e => e.type === eff.type && e.source === eff.source)
  if (i >= 0) target.effects[i] = eff
  else target.effects.push(eff)
}

// 만료(expireTick<=tick) 제거. HoT 적용 뒤에 호출해야 만료틱 마지막 proc 보장.
export function expireEffects(target, tick) {
  target.effects = (target.effects || []).filter(e => e.expireTick > tick)
}

// hot effect 중 nextTick 도달분 회복 적용 + nextTick 전진. 죽은 대상 no-op.
export function tickHoT(target, tick, log) {
  for (const e of (target.effects || [])) {
    if (e.type === 'hot' && e.nextTick <= tick) {
      if (target.hp > 0) {
        target.hp = Math.min(target.maxHp, target.hp + e.value)
        log.push(`${target.name} 지속회복 (+${e.value})`)
      }
      e.nextTick += e.interval
    }
  }
}

export function dmgTakenMult(unit) {
  return (unit.effects || []).reduce((m, e) => (e.type === 'dmgTaken' ? m * e.value : m), 1)
}

export function dmgDealtMult(unit) {
  return (unit.effects || []).reduce((m, e) => (e.type === 'dmgDealt' ? m * e.value : m), 1)
}

export function hasTaunt(unit) {
  return (unit.effects || []).some(e => e.type === 'taunt')
}

// 게이지 증가 속도 배율(buff>1 빠름, debuff<1 느림). speed effect 곱.
export function speedMult(unit) {
  return (unit.effects || []).reduce((m, e) => (e.type === 'speed' ? m * e.value : m), 1)
}

// 스턴 = 게이지 정지 + 행동 불가(stun effect 보유).
export function isStunned(unit) {
  return (unit.effects || []).some(e => e.type === 'stun')
}

// 받은 데미지 반사 비율(reflect effect 합). 공격자에게 floor(받은뎀×비율) 되돌림.
export function reflectFrac(unit) {
  return (unit.effects || []).reduce((s, e) => (e.type === 'reflect' ? s + e.value : s), 0)
}

// 수호 = 최저체력 아군이 받을 데미지를 대신 받음(intercept effect 보유).
export function hasIntercept(unit) {
  return (unit.effects || []).some(e => e.type === 'intercept')
}

// 표식(mark) = 피격 시 추가 데미지(시전자 atk 비례 스냅샷 값의 합).
export function markBonus(unit) {
  return (unit.effects || []).reduce((s, e) => (e.type === 'mark' ? s + e.value : s), 0)
}
