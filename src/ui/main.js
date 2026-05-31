import { renderGame } from './game.js'
import * as run from '../engine/run.js'
import { makeRng } from '../engine/rng.js'

// 런당 시드 1개(UI 레이어 — 매 페이지 로드 새 런). 엔진은 시드만 받음(순수).
const rng = makeRng(Math.floor(Math.random() * 1e9))
let state = run.newRun(rng)

const app = document.getElementById('app')
const rerender = () => { app.innerHTML = renderGame(state) }

app.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-action]')
  if (!btn) return
  const i = btn.dataset.i !== undefined ? Number(btn.dataset.i) : undefined
  switch (btn.dataset.action) {
    case 'recruit': state = run.recruit(state); break
    case 'upgrade': state = run.upgrade(state, i); break
    case 'toggle':  state = run.toggleParty(state, i); break
    case 'fight':   state = run.fight(state); break
    case 'next':    state = run.next(state, rng); break
    case 'restart': state = run.restart(rng); break
    default: return
  }
  rerender()
})

rerender()
