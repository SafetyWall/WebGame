// 앱 전체 렌더(순수). state = { run, ui }. prep = 헤더+적+로스터+순서+액션바+모달, result = 결과뷰.
// 컴포넌트 조합만 — 각 컴포넌트는 자기 순수 render 함수.
import { renderStageHeader } from './components/StageHeader.js'
import { renderEnemyPreview } from './components/EnemyPreview.js'
import { renderRoster } from './components/Roster.js'
import { renderActionBar } from './components/ActionBar.js'
import { renderModal } from './components/CharacterModal.js'
import { renderResultView } from './components/ResultView.js'

export function renderApp(state) {
  const { run, ui } = state
  if (run.phase === 'result') return renderResultView(run)
  return renderStageHeader(run, ui)
    + renderEnemyPreview(run.encounter)
    + renderRoster(run, ui)
    + renderActionBar(run)
    + renderModal(run, ui)
}
