import { renderGame } from './game.js'
import * as run from '../engine/run.js'
import { makeRng } from '../engine/rng.js'
import { save, load } from './persist.js'

// 저장된 런 있으면 복원(rng는 snapshot으로 수열 재개), 없으면 새 런(랜덤 시드).
const saved = load()
let rng = saved ? makeRng(saved.rng) : makeRng(Math.floor(Math.random() * 1e9))
let state = saved ? saved.state : run.newRun(rng)

const app = document.getElementById('app')
const persist = () => save(state, rng.snapshot())
const rerender = () => { persist(); app.innerHTML = renderGame(state) }

app.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-action]')
  if (!btn) return
  const i = btn.dataset.i !== undefined ? Number(btn.dataset.i) : undefined
  switch (btn.dataset.action) {
    case 'recruit': state = run.recruit(state); break
    case 'upgrade': state = run.upgrade(state, i); break
    case 'promote': state = run.changeJob(state, i, btn.dataset.job); break
    case 'expand':  state = run.expandSlot(state); break
    case 'reorder': state = run.reorderSkill(state, i, btn.dataset.skill, Number(btn.dataset.dir)); break
    case 'toggle':  state = run.toggleParty(state, i); break
    case 'fight':   state = run.fight(state); break
    case 'next':    state = run.next(state, rng); break
    case 'restart': state = run.restart(rng); break
    default: return
  }
  rerender()
})

rerender()
