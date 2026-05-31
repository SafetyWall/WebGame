// 전투 결과 → HTML 문자열. 순수 함수라 node에서도 테스트 가능.
function esc(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
}

export function renderRounds(rounds) {
  return rounds.map((r, i) => {
    const party = r.party
      .map(u => `<span class="hp">${esc(u.name)} ${u.hp}/${u.maxHp}</span>`)
      .join(' | ')
    // 광역(엔진 네이티브 고정 능력)을 트레잇과 한 대괄호에 같이 표기.
    const labels = [...(r.mob.aoe ? ['광역'] : []), ...(r.mob.traits || [])]
    const traits = labels.length ? ` <span class="traits">[${labels.map(esc).join(', ')}]</span>` : ''
    const mob = `<span class="mob">${esc(r.mob.name)} ${r.mob.hp}/${r.mob.maxHp}</span>${traits}`
    const log = r.log.map(l => `<div class="log">${esc(l)}</div>`).join('')
    return `<section><h3>라운드 ${i + 1} (틱 ${r.tick})</h3><div>${party}</div><div>${mob}</div>${log}</section>`
  }).join('')
}

export function renderBattle(result) {
  const outcome = result.winner === 'party' ? '승리' : '패배'
  const head = `<h2>결과: ${outcome} (${result.ticks}틱)</h2>`
  return head + renderRounds(result.rounds)
}
