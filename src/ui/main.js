// 부트: store + 컴포넌트 마운트 + 이벤트(click 위임 + pointer 드래그 + 툴팁) + 영속.
import { renderApp } from './view.js'
import * as run from '../engine/run.js'
import { makeRng } from '../engine/rng.js'
import { save, load } from './persist.js'
import { loadPrefs, savePrefs } from './uiPrefs.js'
import { createStore } from './store.js'
import { createComponent } from './component.js'
import { initTooltip, toggleTooltip, hideTooltip } from './tooltip.js'
import { initDrag } from './drag.js'

const saved = load()
let rng = saved ? makeRng(saved.rng) : makeRng(Math.floor(Math.random() * 1e9))
const runState = saved ? saved.state : run.newRun(rng)
const prefs = loadPrefs()

const store = createStore({ run: runState, ui: { layout: prefs.layout, modal: null } })

const appEl = document.getElementById('app')
const app = createComponent({ render: renderApp }).mount(appEl)

store.subscribe((state) => {
  app.sync(state)
  save(state.run, rng.snapshot())
  savePrefs({ layout: state.ui.layout })
})

initTooltip()
initDrag(appEl, store)

appEl.addEventListener('click', (ev) => {
  // 0) 드래그 직후(350ms 내) click = 무시(카드 드래그 후 모달 안 열림). 타임스탬프라 누수 없음.
  if (appEl._dragEndAt && Date.now() - appEl._dragEndAt < 350) return
  // 1) 스킬/특성 = 툴팁 토글(모달 아님)
  const tip = ev.target.closest('[data-tip]')
  if (tip) { toggleTooltip(tip); return }
  hideTooltip()

  const btn = ev.target.closest('[data-action]')
  if (!btn) return
  // 모달 본문(data-stop) 내부 빈 영역 클릭 = 백드롭 아님 → 닫지 않음
  if (btn.classList.contains('modal-overlay') && ev.target.closest('[data-stop]')) return

  const i = btn.dataset.i !== undefined ? Number(btn.dataset.i) : undefined
  switch (btn.dataset.action) {
    case 'toggleLayout': store.setUi({ layout: btn.dataset.layout }); break
    case 'openModal':    store.setUi({ modal: i }); break
    case 'closeModal':   store.setUi({ modal: null }); break
    case 'recruit':      store.dispatch((s) => run.recruit(s)); break
    case 'upgrade':      store.dispatch((s) => run.upgrade(s, i)); break
    case 'promote':      store.dispatch((s) => run.changeJob(s, i, btn.dataset.job)); break
    case 'expand':       store.dispatch((s) => run.expandSlot(s)); break
    case 'learnSkill':   store.dispatch((s) => run.learnSkill(s, i, btn.dataset.skill)); break
    case 'levelupSkill': store.dispatch((s) => run.levelUpSkill(s, i, btn.dataset.skill)); break
    case 'toggle':       store.dispatch((s) => run.toggleParty(s, i)); break
    case 'fight':        store.setUi({ modal: null }); store.dispatch((s) => run.fight(s)); break
    case 'next':         store.dispatch((s) => run.next(s, rng)); break
    case 'restart':      store.dispatch(() => run.restart(rng)); break
    default: return
  }
})

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') { hideTooltip(); store.setUi({ modal: null }) }
})

// 초기 렌더
app.sync(store.getState())
