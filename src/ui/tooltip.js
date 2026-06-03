// 단일 플로팅 툴팁(DOM). click/tap 토글(PC=모바일 동일, hover 비의존). 바깥 탭/스크롤/재호출로 닫기.
import { SKILLS } from '../data/skills.js'
import { TRAITS } from '../data/traits.js'
import { describeSkillLines, describeTraitLines, describeAoe } from './describe.js'
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
  if (kind === 'skill') {
    const sk = SKILLS[el.dataset.skill]
    if (!sk) return null
    const lv = Number(el.dataset.lvl) || 1
    return { title: sk.name + (lv > 1 ? ` Lv${lv}` : ''), lines: describeSkillLines(sk, lv) }
  }
  if (kind === 'trait') {
    const t = TRAITS[el.dataset.trait]
    if (!t) return null
    return { title: t.name, lines: describeTraitLines(t) }
  }
  if (kind === 'aoe') return { title: '광역', lines: [describeAoe()] }
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
