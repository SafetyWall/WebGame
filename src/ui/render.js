// 전투 결과 → HTML 문자열. 순수 함수라 node에서도 테스트 가능.
function esc(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
}

export function renderBattle(result) {
  const outcome = result.winner === 'party' ? '승리' : '패배'
  const head = `<h2>결과: ${outcome} (${result.ticks}틱)</h2>`
  const rounds = result.rounds.map((r, i) => {
    const party = r.party
      .map(u => `<span class="hp">${esc(u.name)} ${u.hp}/${u.maxHp}</span>`)
      .join(' | ')
    const traits = (r.mob.traits && r.mob.traits.length)
      ? ` <span class="traits">[${r.mob.traits.map(esc).join(', ')}]</span>`
      : ''
    const mob = `<span class="mob">${esc(r.mob.name)} ${r.mob.hp}/${r.mob.maxHp}</span>${traits}`
    const log = r.log.map(l => `<div class="log">${esc(l)}</div>`).join('')
    return `<section><h3>라운드 ${i + 1} (틱 ${r.tick})</h3><div>${party}</div><div>${mob}</div>${log}</section>`
  }).join('')
  return head + rounds
}
