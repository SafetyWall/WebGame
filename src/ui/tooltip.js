// 단일 플로팅 툴팁(DOM). click/tap 토글(PC=모바일 동일, hover 비의존). 바깥 탭/스크롤/재호출로 닫기.
import { TRAITS } from '../data/traits.js'
import { describeTraitLines, describeAoe } from './describe.js'
import { statusName, instanceDesc } from './status.js'
import { fmtSec } from './time.js'
import { esc } from './components/parts.js'

let box = null
let anchorEl = null

function ensureBox() {
  if (!box) {
    box = document.createElement('div')
    box.className = 'tooltip-box'
    box.style.display = 'none'
    document.body.appendChild(box)
  }
  return box
}

function contentFor(el) {
  const kind = el.dataset.tip
  // 스킬은 더 이상 툴팁 아님 — 클릭 시 스킬 상세 팝업(openSkill). 여기선 트레잇/광역/전투 effect만.
  if (kind === 'trait') {
    const t = TRAITS[el.dataset.trait]
    if (!t) return null
    return { title: t.name, lines: describeTraitLines(t) }
  }
  if (kind === 'aoe') return { title: '광역', lines: [describeAoe()] }
  if (kind === 'status') {
    const type = el.dataset.type
    const value = el.dataset.value !== undefined ? Number(el.dataset.value) : 1
    const interval = el.dataset.interval ? Number(el.dataset.interval) : undefined
    const lines = [instanceDesc({ type, value, interval })]
    if (el.dataset.remain) lines.push(`남은 ${fmtSec(Number(el.dataset.remain))}`)
    return { title: statusName(type, value), lines }
  }
  return null
}

export function showTooltip(anchor) {
  const c = contentFor(anchor)
  if (!c) return
  const b = ensureBox()
  b.innerHTML = `<div class="tt-title">${esc(c.title)}</div>` +
    c.lines.map((l) => `<div class="tt-line">${esc(l)}</div>`).join('')
  b.style.display = 'block'
  const r = anchor.getBoundingClientRect()
  const maxLeft = window.scrollX + document.documentElement.clientWidth - b.offsetWidth - 8
  b.style.left = Math.max(8, Math.min(r.left + window.scrollX, maxLeft)) + 'px'
  b.style.top = (r.bottom + window.scrollY + 6) + 'px'
  anchorEl = anchor
}

export function hideTooltip() {
  if (box) box.style.display = 'none'
  anchorEl = null
}

export function toggleTooltip(anchor) {
  if (anchorEl === anchor && box && box.style.display === 'block') hideTooltip()
  else showTooltip(anchor)
}

export function initTooltip() {
  window.addEventListener('scroll', hideTooltip, true)
}
