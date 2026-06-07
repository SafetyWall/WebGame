// 버프/디버프 공용 키워드(슬레이 더 스파이어식). (effect 타입 + 값 방향) → 이름/분류/표기.
// 전투 인스턴스(값 확정)·스킬 스펙 표기 양쪽의 단일 출처. 배율형(dmgTaken/dmgDealt/speed)은 1 기준 방향으로 이름이 갈림.
const pctDelta = (mult) => `${mult >= 1 ? '+' : '-'}${Math.round(Math.abs(mult - 1) * 100)}%`

import { fmtSec } from './time.js'

// (type, value) → 공용 키워드 이름. 배율형만 value(방향) 사용, 나머지는 무관.
export function statusName(type, value = 1) {
  switch (type) {
    case 'dmgTaken':  return value >= 1 ? '취약' : '방어'
    case 'dmgDealt':  return value >= 1 ? '강화' : '약화'
    case 'speed':     return value >= 1 ? '신속' : '둔화'
    case 'stun':      return '기절'
    case 'dot':       return '출혈'
    case 'hot':       return '재생'
    case 'mark':      return '표식'
    case 'reflect':   return '가시'
    case 'intercept': return '수호'
    case 'taunt':     return '도발'
    case 'healReduce':   return value <= 0 ? '회복봉쇄' : '회복약화'   // 몹 오라(파티 디버프)
    case 'manaSuppress': return value <= 0 ? '마나봉쇄' : '마나억제'
    default:          return type
  }
}

// 보유자 기준 이로움(buff)/해로움(debuff). 태그 색·아이콘 구분용.
export function statusKind(type, value = 1) {
  switch (type) {
    case 'dmgTaken':  return value >= 1 ? 'debuff' : 'buff'
    case 'dmgDealt':  return value >= 1 ? 'buff' : 'debuff'
    case 'speed':     return value >= 1 ? 'buff' : 'debuff'
    case 'stun': case 'dot': case 'mark': case 'healReduce': case 'manaSuppress': return 'debuff'
    default:          return 'buff'   // hot/reflect/intercept/taunt = 보유자에 이로움
  }
}

// 전투중 effect 인스턴스(value 확정) → 효과 크기 한 줄. value: 배율형=배율, dot/hot/mark=확정 수치, reflect=비율.
export function instanceDesc(inst) {
  const v = inst.value
  switch (inst.type) {
    case 'dmgTaken':  return `받는 데미지 ${pctDelta(v)}`
    case 'dmgDealt':  return `주는 데미지 ${pctDelta(v)}`
    case 'speed':     return `행동 속도 ${pctDelta(v)}`
    case 'stun':      return '게이지 정지 · 행동 불가'
    case 'dot':       return `${fmtSec(inst.interval)}마다 ${v} 피해`
    case 'hot':       return `${fmtSec(inst.interval)}마다 ${v} 회복`
    case 'mark':      return `피격 시 +${v} 추가 피해`
    case 'reflect':   return `받은 데미지 ${Math.round(v * 100)}% 반사`
    case 'intercept': return '최저체력 아군 대신 피격'
    case 'taunt':     return '적이 강제로 이 유닛 공격'
    case 'healReduce':   return `받는 회복 -${Math.round((1 - v) * 100)}%`
    case 'manaSuppress': return `마나 획득 -${Math.round((1 - v) * 100)}%`
    default:          return inst.type
  }
}
