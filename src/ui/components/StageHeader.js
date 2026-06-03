// 스테이지/골드/슬롯 헤더 + 레이아웃 토글 버튼.
export function renderStageHeader(run, ui) {
  const next = ui.layout === '2col' ? '1col' : '2col'
  const label = ui.layout === '2col' ? '1열 보기' : '2열 보기'
  return `<div class="stage-header">
  <span class="sh-main">⚔ 스테이지 ${run.stage} · 💰${run.gold} · 슬롯 ${run.slots}</span>
  <button class="layout-toggle" data-action="toggleLayout" data-layout="${next}">${label}</button>
</div>`
}
