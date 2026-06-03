// 전투 결과: 배너 + 재생뷰(BattleStage, ui.frames) + 전체 로그(접이식, renderRounds 재사용) + 다음/재시작.
import { renderRounds } from '../render.js'
import { renderBattleStage } from './BattleStage.js'

export function renderResultView(run, ui) {
  const { outcome, reward, ticks, rounds } = run.lastResult
  const banner = outcome === 'clear' ? `<h2>🎉 스테이지 ${run.stage} 클리어 — 게임 클리어! (${ticks}틱)</h2>`
    : outcome === 'win' ? `<h2>스테이지 ${run.stage} 승리! 골드 +${reward} (${ticks}틱)</h2>`
    : `<h2>패배… 런 종료 (${ticks}틱)</h2>`
  const btn = outcome === 'loss' ? `<button data-action="restart">다시 시작</button>`
    : outcome === 'clear' ? `<button data-action="restart">새 런</button>`
    : `<button data-action="next">다음 스테이지</button>`
  const stage = renderBattleStage(ui.frames, ui.cursor, ui.playing)
  return `<div class="result-view">${banner}
<div class="action-bar">${btn}</div>
${stage}
<details class="full-log"><summary>전체 로그 보기</summary>${renderRounds(rounds)}</details></div>`
}
