// 하단 액션바: 영입 / 슬롯확장 / 출전 카운트 / 전투.
import { RECRUIT_COST, slotCost } from '../../engine/run.js'

export function renderActionBar(run) {
  const full = run.party.length >= run.slots
  const sc = slotCost(run.slots)
  const recruit = `<button data-action="recruit"${run.gold < RECRUIT_COST ? ' disabled' : ''}>영입(${RECRUIT_COST})</button>`
  const expand = `<button data-action="expand"${run.gold < sc ? ' disabled' : ''}>슬롯확장(${sc})</button>`
  const count = `<span class="party-count${full ? ' full' : ''}">출전 ${run.party.length}/${run.slots}</span>`
  const fight = run.party.length >= 1
    ? `<button class="fight" data-action="fight">전투!</button>`
    : `<span class="hint">출전 유닛을 선택하세요</span>`
  return `<div class="action-bar">${recruit} ${expand} ${count} ${fight}</div>`
}
