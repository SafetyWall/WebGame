// 컴포넌트 공유 헬퍼(순수). esc + 스킬 pill + HP바.
import { JOBS } from '../../data/jobs.js'
import { SKILLS } from '../../data/skills.js'

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const sup = (n) => ['', '', '²', '³', '⁴', '⁵'][n] || ''

// 직업 액티브(평타 제외) 4칸 → 2×2 pill. 학습=have(+Lv), 미학습=no. data-tip=스킬 툴팁용.
// 노비스(액티브 0) = 전직 안내 pill 1개.
export function skillPills(jobKey, r) {
  const actives = JOBS[jobKey].skills.slice(0, -1)
  if (actives.length === 0) return ''   // 노비스 = 액티브 없음 → 빈칸(전직은 모달에서)
  const learned = r.learnedSkills || []
  return actives.map((sid) => {
    const nm = esc(SKILLS[sid].name)
    if (learned.includes(sid)) {
      const lv = (r.skillLevels && r.skillLevels[sid]) || 1
      return `<span class="sk have" data-tip="skill" data-skill="${sid}" data-lvl="${lv}">${nm}<span class="lvb">${sup(lv)}</span></span>`
    }
    return `<span class="sk no" data-tip="skill" data-skill="${sid}" data-lvl="1">${nm}</span>`
  }).join('')
}

export function hpBar(pct, cls = '') {
  const w = Math.max(0, Math.min(100, pct))
  return `<div class="hpbar"><i class="${cls}" style="width:${w}%"></i></div>`
}
