// 부트: store + 컴포넌트 마운트 + 이벤트(click 위임 + pointer 드래그 + 툴팁 + 전투 재생) + 영속.
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

const ui0 = { layout: prefs.layout, modal: null, skillDetail: null, frames: [], cursor: 0, playing: false, speed: 1 }
if (runState.phase === 'result') ui0.frames = run.battleFrames(runState)   // 새로고침 복원 시 재생뷰 복구(결정론)

const store = createStore({ run: runState, ui: ui0 })

const appEl = document.getElementById('app')
const app = createComponent({ render: renderApp }).mount(appEl)

// 스킬 상세 팝업을 클릭 위치(앵커) 근처로 배치(뷰포트 클램프). 중앙 모달 대신 툴팁식.
function positionSkillDetail() {
  const sd = store.getState().ui.skillDetail
  const box = appEl.querySelector('.sd-modal')
  if (!sd || !box || sd.x == null) return
  const m = 8
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  box.style.left = Math.max(m, Math.min(sd.x, vw - box.offsetWidth - m)) + 'px'
  box.style.top = Math.max(m, Math.min(sd.y + 6, vh - box.offsetHeight - m)) + 'px'
}

store.subscribe((state) => {
  app.sync(state)
  save(state.run, rng.snapshot())          // 런만 영속(ui.frames는 휘발 — 결정론으로 재생성)
  savePrefs({ layout: state.ui.layout })
  positionSkillDetail()
})

initTooltip()
initDrag(appEl, store)

// === 전투 재생 컨트롤 ===
let playTimer = null
const frameCount = () => (store.getState().ui.frames || []).length
const setCursor = (c) => { const n = frameCount(); store.setUi({ cursor: Math.max(0, Math.min(c, n - 1)) }) }
const SPEED_MS = { 1: 1200, 2: 700, 3: 400 }   // 배속별 스텝 간격(1배=느리게 기본)
function stopPlay() { if (playTimer) { clearInterval(playTimer); playTimer = null } if (store.getState().ui.playing) store.setUi({ playing: false }) }
function startPlay() {
  store.setUi({ playing: true })
  const ms = SPEED_MS[store.getState().ui.speed] || 700
  playTimer = setInterval(() => {
    const ui = store.getState().ui
    const n = (ui.frames || []).length
    if (ui.cursor >= n - 1) { stopPlay(); return }
    store.setUi({ cursor: ui.cursor + 1 })
  }, ms)
}
function togglePlay() { if (playTimer) stopPlay(); else startPlay() }
const refreshFrames = () => {
  const st = store.getState().run
  store.setUi(st.phase === 'result' ? { frames: run.battleFrames(st), cursor: 0, playing: false } : { frames: [], cursor: 0, playing: false })
}

appEl.addEventListener('click', (ev) => {
  // 0) 드래그 직후(350ms 내) click = 무시(카드 드래그 후 모달 안 열림). 타임스탬프라 누수 없음.
  if (appEl._dragEndAt && Date.now() - appEl._dragEndAt < 350) return
  // 1) 스킬/특성 = 툴팁 토글(모달 아님)
  const tip = ev.target.closest('[data-tip]')
  if (tip) { toggleTooltip(tip); return }
  hideTooltip()

  const btn = ev.target.closest('[data-action]')
  if (!btn) return
  if (btn.classList.contains('modal-overlay') && ev.target.closest('[data-stop]')) return

  const i = btn.dataset.i !== undefined ? Number(btn.dataset.i) : undefined
  const cur = () => store.getState().ui.cursor
  switch (btn.dataset.action) {
    case 'toggleLayout': store.setUi({ layout: btn.dataset.layout }); break
    case 'openModal':    store.setUi({ modal: i }); break
    case 'closeModal':   store.setUi({ modal: null, skillDetail: null }); break
    case 'openSkill': {
      const rect = btn.getBoundingClientRect()   // 클릭한 스킬 위치 근처에 띄움(중앙 모달 아님)
      store.setUi({ skillDetail: { i, skillId: btn.dataset.skill, x: rect.left, y: rect.bottom } })
      break
    }
    case 'closeSkill':   store.setUi({ skillDetail: null }); break
    case 'recruit':      store.dispatch((s) => run.recruit(s)); break
    case 'upgrade':      store.dispatch((s) => run.upgrade(s, i)); break
    case 'promote':      store.dispatch((s) => run.changeJob(s, i, btn.dataset.job)); break
    case 'expand':       store.dispatch((s) => run.expandSlot(s)); break
    case 'learnSkill':   store.dispatch((s) => run.learnSkill(s, i, btn.dataset.skill)); break
    case 'levelupSkill': store.dispatch((s) => run.levelUpSkill(s, i, btn.dataset.skill)); break
    case 'toggle':       store.dispatch((s) => run.toggleParty(s, i)); break
    case 'fight':        stopPlay(); store.setUi({ modal: null }); store.dispatch((s) => run.fight(s)); refreshFrames(); break
    case 'next':         stopPlay(); store.dispatch((s) => run.next(s, rng)); refreshFrames(); break
    case 'restart':      stopPlay(); store.dispatch(() => run.restart(rng)); refreshFrames(); break
    // 재생 컨트롤
    case 'pbFirst': stopPlay(); setCursor(0); break
    case 'pbPrev':  stopPlay(); setCursor(cur() - 1); break
    case 'pbNext':  stopPlay(); setCursor(cur() + 1); break
    case 'pbLast':  stopPlay(); setCursor(frameCount() - 1); break
    case 'pbPlay':  togglePlay(); break
    case 'pbSpeed': {
      const wasPlaying = !!playTimer
      if (wasPlaying) stopPlay()
      store.setUi({ speed: Number(btn.dataset.speed) || 1 })
      if (wasPlaying) startPlay()       // 새 배속으로 자동재생 재개
      break
    }
    default: return
  }
})

document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return
  hideTooltip(); stopPlay()
  // 스킬 상세가 열려 있으면 그것부터 닫고(캐릭 모달 유지), 아니면 모달 닫기
  if (store.getState().ui.skillDetail) store.setUi({ skillDetail: null })
  else store.setUi({ modal: null })
})

app.sync(store.getState())
