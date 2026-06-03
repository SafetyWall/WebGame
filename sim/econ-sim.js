// 경제 런루프 시뮬. 실제 run.js 상태기계를 "그리디 풀투자" 정책으로 구동 → 시드별 사망/클리어 스테이지 분포.
// 가정(명시): 정책 = 매 prep에 가용 골드를 (전직 → 레벨업 → 스킬학습 → 스킬레벨업 → 영입/슬롯) 순으로 소진.
// 파티 = 비노비스 우선 slots개. 측정용 1개 정책(완벽 최적 아님 — 방향성).
import { makeRng } from '../src/engine/rng.js'
import * as run from '../src/engine/run.js'
import { JOBS } from '../src/data/jobs.js'

const COMP = ['guardian', 'warrior', 'priest', 'mage', 'archer', 'rogue']  // 채울 직업 우선순위(탱·딜·힐)
const MAX_SLOTS = 6
const activesOf = (job) => JOBS[job].skills.slice(0, -1)

function spend(s) {
  for (let guard = 0; guard < 800; guard++) {
    const before = s
    // 1. 노비스 전직(컴프 빈 역할 채움)
    const ni = s.roster.findIndex(r => r.job === 'novice')
    if (ni >= 0 && s.gold >= run.PROMOTE_COST) {
      const have = s.roster.map(r => r.job)
      const role = COMP.find(j => !have.includes(j)) || 'warrior'
      s = run.changeJob(s, ni, role)
      if (s !== before) continue
    }
    // 2. 최저레벨 비노비스 레벨업(→10)
    let li = -1, lv = 99
    s.roster.forEach((r, i) => { if (r.job !== 'novice' && r.level < run.MAX_LEVEL && r.level < lv) { lv = r.level; li = i } })
    if (li >= 0 && s.gold >= run.UPGRADE_COST) { const n = run.upgrade(s, li); if (n !== s) { s = n; continue } }
    // 3. 미학습 액티브 학습
    let did = false
    for (let i = 0; i < s.roster.length && !did; i++) {
      const r = s.roster[i]; if (r.job === 'novice') continue
      const lk = r.learnedSkills || []
      const un = activesOf(r.job).find(sk => !lk.includes(sk))
      if (un && s.gold >= run.LEARN_COST) { const n = run.learnSkill(s, i, un); if (n !== s) { s = n; did = true } }
    }
    if (did) continue
    // 4. 스킬 레벨업(최저)
    for (let i = 0; i < s.roster.length && !did; i++) {
      const r = s.roster[i]; if (r.job === 'novice') continue
      for (const sk of (r.learnedSkills || [])) {
        if ((r.skillLevels?.[sk] || 1) < run.MAX_SKILL_LEVEL && s.gold >= run.SKILL_LV_COST) {
          const n = run.levelUpSkill(s, i, sk); if (n !== s) { s = n; did = true; break }
        }
      }
    }
    if (did) continue
    // 5. 영입(슬롯 여유) / 슬롯확장
    if (s.roster.length < s.slots && s.gold >= run.RECRUIT_COST) { const n = run.recruit(s); if (n !== s) { s = n; continue } }
    if (s.slots < MAX_SLOTS && s.gold >= run.slotCost(s.slots)) { const n = run.expandSlot(s); if (n !== s) { s = n; continue } }
    break
  }
  const idx = s.roster.map((_, i) => i)
  const party = idx.filter(i => s.roster[i].job !== 'novice').slice(0, s.slots)
  return { ...s, party: party.length ? party : idx.slice(0, s.slots) }
}

function runOne(seed) {
  const rng = makeRng(seed)
  let s = run.newRun(rng)
  let earned = 0
  for (let g = 0; g < 100; g++) {
    s = spend(s)
    if (s.party.length === 0) return { death: s.stage, earned }
    const stage = s.stage
    s = run.fight(s)
    if (s.lastResult.outcome === 'loss') return { death: stage, earned }
    earned += s.lastResult.reward
    if (s.lastResult.outcome === 'clear') return { death: 21, earned }   // S20 통과=클리어
    s = run.next(s, rng)
  }
  return { death: 21, earned }
}

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1)
const res = SEEDS.map(runOne)
const deaths = res.map(r => r.death)
const hist = {}
for (const d of deaths) hist[d] = (hist[d] || 0) + 1
console.log('=== econ-sim: 풀투자 정책, 시드30 ===')
console.log('사망/클리어 스테이지 분포 (S21=클리어):')
for (const k of Object.keys(hist).map(Number).sort((a, b) => a - b)) console.log(`  S${k}: ${'#'.repeat(hist[k])} (${hist[k]})`)
const sorted = deaths.slice().sort((a, b) => a - b)
const cleared = deaths.filter(d => d > 20).length
console.log(`클리어: ${cleared}/30 · 중앙값 도달 S${sorted[15]} · 최저 S${sorted[0]} · 최고 S${Math.min(20, sorted[29])}`)
console.log(`평균 누적보상(런당): ${Math.round(res.reduce((a, r) => a + r.earned, 0) / 30)}골드`)
