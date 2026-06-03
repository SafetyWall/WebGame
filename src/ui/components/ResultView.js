// 전투 결과: 배너 + 라운드 로그(render.js renderRounds 재사용). 미래 BattleStage 재생뷰가 같은 자리에 가산.
import { renderRounds } from '../render.js'

export function renderResultView(run) {
  const { outcome, reward, ticks, rounds } = run.lastResult
  const banner = outcome === 'clear' ? `<h2>🎉 스테이지 ${run.stage} 클리어 — 게임 클리어! (${ticks}틱)</h2>`
    : outcome === 'win' ? `<h2>스테이지 ${run.stage} 승리! 골드 +${reward} (${ticks}틱)</h2>`
    : `<h2>패배… 런 종료 (${ticks}틱)</h2>`
  const btn = outcome === 'loss' ? `<button data-action="restart">다시 시작</button>`
    : outcome === 'clear' ? `<button data-action="restart">새 런</button>`
    : `<button data-action="next">다음 스테이지</button>`
  return `<div class="result-view">${banner}
<div class="action-bar">${btn}</div>
${renderRounds(rounds)}</div>`
}
