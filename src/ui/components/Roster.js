// 로스터 = 카드 목록. 출전 카드를 파티 순서대로 먼저, 벤치는 뒤(roster 순서).
// → 출전 카드 자체 드래그가 출전 순서(앞→뒤)에 그대로 반영. ui.layout으로 1col/2col 분기.
import { renderCard } from './CharacterCard.js'

export function renderRoster(run, ui) {
  const bench = run.roster.map((_, i) => i).filter((i) => !run.party.includes(i))
  const order = [...run.party, ...bench]   // 출전(파티순서) → 벤치
  const cards = order.map((i) => renderCard(run, i)).join('')
  return `<div class="roster layout-${ui.layout}">
  <div class="sec-label">로스터 — 카드 탭=상세 · 스킬 탭=설명 · 출전 카드 드래그=순서</div>
  <div class="card-list">${cards}</div>
</div>`
}
