// pointer 기반 재배열(터치+마우스). HTML5 DnD는 터치 미지원이라 회피.
// 카드 자체 드래그(출전순서) + 모달 우선순위 리스트. 이동 임계값(6px) 넘으면 드래그 = 클릭(모달)과 구분.
import { movePartyTo, movePrioTo } from './dragMove.js'

const THRESH = 6

export function initDrag(appEl, store) {
  let start = null   // { x, y, item, kind, i, skill, list }
  let dragging = false
  let dropIndex = null

  const itemUnder = (x, y, list) => {
    const el = document.elementFromPoint(x, y)
    const item = el && el.closest('[data-drag]')
    return item && item.parentElement === list ? item : null
  }

  const onMove = (ev) => {
    if (!start) return
    if (!dragging) {
      if (Math.abs(ev.clientX - start.x) + Math.abs(ev.clientY - start.y) < THRESH) return
      dragging = true
      start.item.classList.add('dragging')
      document.body.classList.add('drag-lock')   // 드래그 중 스크롤·텍스트선택 잠금
    }
    ev.preventDefault()
    // 끌리는 카드가 포인터 따라 이동(transform). .dragging이 pointer-events:none → 아래 카드 hit-test 가능.
    start.item.style.transform = `translate(${ev.clientX - start.x}px, ${ev.clientY - start.y}px)`
    // 매 move 재계산 — 제자리/유효대상 없음이면 dropIndex 해제(복귀 시 교체 취소)
    const over = itemUnder(ev.clientX, ev.clientY, start.list)
    dropIndex = (over && over !== start.item) ? Array.prototype.indexOf.call(start.list.children, over) : null
    for (const c of start.list.children) c.classList.toggle('drop-target', c === over && over !== start.item)
  }

  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    const s = start, di = dropIndex, didDrag = dragging
    start = null; dragging = false; dropIndex = null
    if (s && s.item) s.item.style.transform = ''   // 드롭 미발생(re-render 없음) 시 잔존 방지
    appEl.querySelectorAll('.dragging,.drop-target').forEach((e) => e.classList.remove('dragging', 'drop-target'))
    document.body.classList.remove('drag-lock')
    if (!s || !didDrag || di == null) return
    appEl._dragEndAt = Date.now()   // 드래그 직후 click(모달) 삼킴 — 타임스탬프(누수 방지, 자동만료)
    if (s.kind === 'party') {
      const len = store.getState().run.party.length
      store.dispatch((st) => movePartyTo(st, s.i, Math.min(di, len - 1)))
    } else if (s.kind === 'prio') {
      store.dispatch((st) => movePrioTo(st, s.i, s.skill, di))
    }
  }

  appEl.addEventListener('pointerdown', (ev) => {
    if (ev.target.closest('button') || ev.target.closest('[data-tip]') || ev.target.closest('.sk')) return  // 버튼·툴팁·스킬 pill은 클릭 통과(드래그 X)
    const item = ev.target.closest('[data-drag]')
    if (!item) return
    start = { x: ev.clientX, y: ev.clientY, item, kind: item.dataset.drag, i: Number(item.dataset.i), skill: item.dataset.skill, list: item.parentElement }
    dragging = false; dropIndex = null
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  })
}
