# Base ATB 평타 전투 엔진 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ATB 틱 기반 평타 전투 엔진 + 직업/몹 데이터 + 헤드리스 시뮬 + 브라우저 UI 골격을 zero-dependency 정적 웹으로 만든다.

**Architecture:** 순수 ES 모듈. `engine/battle.js`가 DOM-free 핵심 단위(`runBattle(party, mob) → {winner, rounds, ticks}`)로 브라우저 UI와 node 시뮬이 동일 함수를 재사용. 데이터는 분리된 테이블, 수치는 placeholder.

**Tech Stack:** Vanilla JS (ES modules), Node v24 내장 테스트 러너(`node:test` + `node:assert`), 외부 의존성 0. 배포 = GitHub Pages(정적). 시뮬 = `node sim/sim.js`.

**Spec:** `docs/superpowers/specs/2026-05-30-base-engine-design.md`

---

## Prerequisites

- Node ≥18 (확인됨: v24). 테스트·시뮬 모두 node로만 실행.
- **git 미설치.** 각 Task의 Commit 스텝은 git 설치 전까지 **보류** — 코드/테스트는 그대로 진행하고, git 설치(`winget install Git.Git`) 후 일괄 커밋해도 됨. 커밋 메시지는 각 스텝에 명시.
- 모든 명령은 프로젝트 루트 `C:\Users\SafetyWall\workspace\game`에서 실행 (PowerShell).

## File Structure

| 파일 | 책임 |
|---|---|
| `package.json` | `{"type":"module"}`, test/sim 스크립트. 의존성 0 |
| `src/data/jobs.js` | 직업 5종 테이블 (순수 데이터) |
| `src/data/mobs.js` | 몹 테이블 (순수 데이터) |
| `src/engine/unit.js` | 직업/몹 → 전투용 유닛 인스턴스 팩토리 (hp/gauge 등 런타임 상태 부여) |
| `src/engine/battle.js` | 틱루프·데미지·타게팅·교착. `runBattle` + 순수 헬퍼 export. DOM 0 |
| `src/ui/render.js` | 전투결과 → HTML 문자열 (순수, node 테스트 가능) |
| `src/ui/main.js` | 부트: 데이터→runBattle→render를 `#app`에 mount (DOM 의존, 수동검증) |
| `sim/sim.js` | node 헤드리스: 여러 매치업 → 승/패·틱 출력 |
| `index.html` | 엔트리. `<script type=module>` 로 main.js 로드 |
| `tests/*.test.js` | node:test 테스트 |

---

## Task 0: 프로젝트 골격

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: package.json 작성**

Create `package.json`:
```json
{
  "name": "party-rpg",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "sim": "node sim/sim.js"
  }
}
```

- [ ] **Step 2: .gitignore 작성**

Create `.gitignore`:
```
node_modules/
*.log
.DS_Store
```

- [ ] **Step 3: node 동작 확인**

Run: `node -e "console.log(process.version)"`
Expected: `v24.x.x` 출력 (≥18).

- [ ] **Step 4: Commit (git 설치 후)**

```bash
git add package.json .gitignore
git commit -m "chore: project skeleton (esm, zero-dep)"
```

---

## Task 1: 데이터 테이블 (jobs, mobs)

**Files:**
- Create: `src/data/jobs.js`
- Create: `src/data/mobs.js`
- Test: `tests/data.test.js`

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/data.test.js`:
```js
import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { MOBS } from '../src/data/mobs.js'

test('JOBS has 5 jobs with required fields', () => {
  const keys = Object.keys(JOBS)
  assert.strictEqual(keys.length, 5)
  for (const k of keys) {
    const j = JOBS[k]
    assert.ok(j.name, `${k} has name`)
    assert.ok(Number.isFinite(j.hp), `${k} hp`)
    assert.ok(Number.isFinite(j.atk), `${k} atk`)
    assert.ok(Number.isFinite(j.spd), `${k} spd`)
    assert.ok(['dps', 'tank', 'heal'].includes(j.role), `${k} role`)
  }
  assert.strictEqual(JOBS.guardian.taunt, true)
  assert.strictEqual(JOBS.priest.role, 'heal')
})

test('MOBS entries have combat fields', () => {
  for (const k of Object.keys(MOBS)) {
    const m = MOBS[k]
    assert.ok(m.name)
    assert.ok(Number.isFinite(m.hp))
    assert.ok(Number.isFinite(m.atk))
    assert.ok(Number.isFinite(m.def))
    assert.ok(Number.isFinite(m.spd))
  }
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/data.test.js`
Expected: FAIL (`Cannot find module '../src/data/jobs.js'`).

- [ ] **Step 3: jobs.js 작성**

Create `src/data/jobs.js`:
```js
// 수치는 placeholder — 밸런스는 시뮬 후 튜닝. type 태그는 베이스선 효과 0 (미래 RPS용).
export const JOBS = {
  novice:   { name: '노비스', hp: 70,  atk: 14, type: 'phys',  spd: 7, role: 'dps' },
  warrior:  { name: '전사',   hp: 115, atk: 22, type: 'phys',  spd: 9, role: 'dps' },
  mage:     { name: '마법사', hp: 55,  atk: 32, type: 'magic', spd: 8, role: 'dps' },
  guardian: { name: '가디언', hp: 260, atk: 10, type: 'phys',  spd: 5, role: 'tank', taunt: true },
  priest:   { name: '사제',   hp: 95,  atk: 6,  type: 'heal',  spd: 7, role: 'heal', heal: 30 },
}
```

- [ ] **Step 4: mobs.js 작성**

Create `src/data/mobs.js`:
```js
// 수치 placeholder. aoe=true면 광역(전체 atk*aoeRatio), 아니면 단일.
export const MOBS = {
  slime: { name: '슬라임', hp: 200, atk: 18, def: 3, spd: 8, aoe: false },
  ogre:  { name: '오우거', hp: 400, atk: 28, def: 6, spd: 6, aoe: true, aoeRatio: 0.6 },
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `node --test tests/data.test.js`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit (git 설치 후)**

```bash
git add src/data/jobs.js src/data/mobs.js tests/data.test.js
git commit -m "feat: job and mob data tables"
```

---

## Task 2: 유닛 팩토리 (unit.js)

**Files:**
- Create: `src/engine/unit.js`
- Test: `tests/unit.test.js`

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/unit.test.js`:
```js
import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { MOBS } from '../src/data/mobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'

test('makeUnit copies job stats into runtime unit', () => {
  const u = makeUnit(JOBS.warrior)
  assert.strictEqual(u.name, '전사')
  assert.strictEqual(u.hp, 115)
  assert.strictEqual(u.maxHp, 115)
  assert.strictEqual(u.gauge, 0)
  assert.strictEqual(u.def, 0)         // 플레이어 def 없음 → 0
  assert.strictEqual(u.taunt, false)   // 비탱은 false
})

test('makeUnit preserves taunt and heal', () => {
  assert.strictEqual(makeUnit(JOBS.guardian).taunt, true)
  assert.strictEqual(makeUnit(JOBS.priest).heal, 30)
})

test('makeMob sets runtime hp/gauge and def default', () => {
  const m = makeMob(MOBS.slime)
  assert.strictEqual(m.hp, 200)
  assert.strictEqual(m.maxHp, 200)
  assert.strictEqual(m.gauge, 0)
  assert.strictEqual(m.def, 3)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/unit.test.js`
Expected: FAIL (`Cannot find module '../src/engine/unit.js'`).

- [ ] **Step 3: unit.js 작성**

Create `src/engine/unit.js`:
```js
// 직업/몹 데이터(불변)를 전투용 인스턴스(가변 hp/gauge)로 변환.
let _id = 0

export function makeUnit(job) {
  return {
    id: ++_id,
    name: job.name,
    maxHp: job.hp,
    hp: job.hp,
    atk: job.atk,
    type: job.type,
    spd: job.spd,
    role: job.role,
    taunt: Boolean(job.taunt),
    heal: job.heal || 0,
    def: 0,            // 플레이어 유닛은 방어 없음
    gauge: 0,
  }
}

export function makeMob(mob) {
  return {
    name: mob.name,
    maxHp: mob.hp,
    hp: mob.hp,
    atk: mob.atk,
    def: mob.def || 0,
    spd: mob.spd,
    aoe: Boolean(mob.aoe),
    aoeRatio: mob.aoeRatio || 0.6,
    gauge: 0,
    isMob: true,
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/unit.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit (git 설치 후)**

```bash
git add src/engine/unit.js tests/unit.test.js
git commit -m "feat: unit factory for runtime combat instances"
```

---

## Task 3: 전투 순수 헬퍼 (데미지 + 타게팅)

**Files:**
- Create: `src/engine/battle.js` (헬퍼만 먼저, runBattle은 Task 4)
- Test: `tests/battle-helpers.test.js`

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/battle-helpers.test.js`:
```js
import { test } from 'node:test'
import assert from 'node:assert'
import { damage, lowestHpAlly, selectMobTarget } from '../src/engine/battle.js'

test('damage = atk - def, minimum 1', () => {
  assert.strictEqual(damage(10, 3), 7)
  assert.strictEqual(damage(2, 5), 1)   // 음수 방지 → 1
  assert.strictEqual(damage(5, 5), 1)
})

test('lowestHpAlly picks alive ally with min hp', () => {
  const party = [
    { name: 'a', hp: 50 },
    { name: 'b', hp: 10 },
    { name: 'c', hp: 0 },   // 죽음 제외
  ]
  assert.strictEqual(lowestHpAlly(party).name, 'b')
})

test('selectMobTarget prefers alive taunt tank', () => {
  const party = [
    { name: 'dps', hp: 30, taunt: false },
    { name: 'tank', hp: 200, taunt: true },
  ]
  assert.strictEqual(selectMobTarget(party).name, 'tank')
})

test('selectMobTarget falls back to lowest hp when no taunt alive', () => {
  const party = [
    { name: 'dps', hp: 30, taunt: false },
    { name: 'tank', hp: 0, taunt: true },   // 탱 죽음
  ]
  assert.strictEqual(selectMobTarget(party).name, 'dps')
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/battle-helpers.test.js`
Expected: FAIL (`Cannot find module '../src/engine/battle.js'`).

- [ ] **Step 3: battle.js 헬퍼 작성**

Create `src/engine/battle.js`:
```js
// ATB 평타 전투 엔진. 순수, DOM 의존 0. ui/sim 공용.

export function damage(atk, def) {
  return Math.max(1, atk - def)
}

export function lowestHpAlly(party) {
  const alive = party.filter(u => u.hp > 0)
  if (alive.length === 0) return null
  return alive.reduce((a, b) => (b.hp < a.hp ? b : a), alive[0])
}

export function selectMobTarget(party) {
  const taunt = party.find(u => u.hp > 0 && u.taunt)
  if (taunt) return taunt
  return lowestHpAlly(party)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/battle-helpers.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit (git 설치 후)**

```bash
git add src/engine/battle.js tests/battle-helpers.test.js
git commit -m "feat: combat helpers (damage, targeting)"
```

---

## Task 4: 전투 루프 (runBattle)

**Files:**
- Modify: `src/engine/battle.js` (행동 함수 + runBattle 추가)
- Test: `tests/battle-run.test.js`

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/battle-run.test.js`:
```js
import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { MOBS } from '../src/data/mobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'

test('strong party defeats weak single-target mob', () => {
  const party = [makeUnit(JOBS.warrior), makeUnit(JOBS.mage), makeUnit(JOBS.guardian), makeUnit(JOBS.priest)]
  const mob = makeMob(MOBS.slime)
  const r = runBattle(party, mob)
  assert.strictEqual(r.winner, 'party')
  assert.ok(r.ticks > 0)
  assert.ok(r.rounds.length >= 1)
})

test('result is deterministic (same input → same output)', () => {
  const build = () => ({
    party: [makeUnit(JOBS.warrior), makeUnit(JOBS.priest)],
    mob: makeMob(MOBS.slime),
  })
  const a = build(); const b = build()
  const r1 = runBattle(a.party, a.mob)
  const r2 = runBattle(b.party, b.mob)
  assert.strictEqual(r1.winner, r2.winner)
  assert.strictEqual(r1.ticks, r2.ticks)
})

test('priest gets healed (heal targeting works in battle)', () => {
  // 사제 단독 + 광역몹: 사제는 몹 못 죽임 → 결국 패. 단 회복 로그가 찍혀야 함.
  const party = [makeUnit(JOBS.priest)]
  const mob = makeMob(MOBS.ogre)
  const r = runBattle(party, mob, { maxTicks: 3000 })
  const logs = r.rounds.flatMap(rd => rd.log).join('\n')
  assert.match(logs, /회복/)
})

test('round snapshot shape', () => {
  const party = [makeUnit(JOBS.warrior)]
  const mob = makeMob(MOBS.slime)
  const r = runBattle(party, mob)
  const snap = r.rounds[0]
  assert.ok(Number.isFinite(snap.tick))
  assert.ok(Array.isArray(snap.party))
  assert.ok(snap.mob.name)
  assert.ok(Array.isArray(snap.log))
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/battle-run.test.js`
Expected: FAIL (`runBattle is not a function` / not exported).

- [ ] **Step 3: 행동 함수 + runBattle 추가**

Append to `src/engine/battle.js` (기존 헬퍼 아래에 추가):
```js
const THRESHOLD = 1000
const ROUND_TICKS = 28
const DEFAULT_MAX_TICKS = 20000

function actUnit(u, party, mob, log) {
  if (u.role === 'heal') {
    const target = lowestHpAlly(party)
    if (target) {
      target.hp = Math.min(target.maxHp, target.hp + u.heal)
      log.push(`${u.name} 회복 → ${target.name} (+${u.heal})`)
    }
    return
  }
  // dps/tank → 몹 공격
  const dmg = damage(u.atk, mob.def)
  mob.hp -= dmg
  log.push(`${u.name} 공격 → ${mob.name} (-${dmg})`)
}

function actMob(mob, party, log) {
  if (mob.aoe) {
    const base = Math.floor(mob.atk * mob.aoeRatio)
    for (const u of party) {
      if (u.hp > 0) u.hp -= damage(base, u.def)
    }
    log.push(`${mob.name} 광역 (개당 -${damage(base, 0)})`)
    return
  }
  const target = selectMobTarget(party)
  if (target) {
    const dmg = damage(mob.atk, target.def)
    target.hp -= dmg
    log.push(`${mob.name} 공격 → ${target.name} (-${dmg})`)
  }
}

export function runBattle(party, mob, opts = {}) {
  const maxTicks = opts.maxTicks ?? DEFAULT_MAX_TICKS
  const rounds = []
  let log = []
  let tick = 0

  const snapshot = (t) => ({
    tick: t,
    party: party.map(u => ({ name: u.name, hp: Math.max(0, u.hp), maxHp: u.maxHp })),
    mob: { name: mob.name, hp: Math.max(0, mob.hp), maxHp: mob.maxHp },
    log,
  })
  const finish = (winner) => {
    rounds.push(snapshot(tick))
    return { winner, rounds, ticks: tick }
  }

  while (tick < maxTicks) {
    tick++
    // ② 게이지 증가 (살아있는 유닛만)
    for (const u of party) if (u.hp > 0) u.gauge += u.spd
    if (mob.hp > 0) mob.gauge += mob.spd
    // ③ 행동: 파티 먼저(배열 순), 그다음 몹
    for (const u of party) {
      if (u.hp > 0 && u.gauge >= THRESHOLD) {
        u.gauge -= THRESHOLD
        actUnit(u, party, mob, log)
        if (mob.hp <= 0) break
      }
    }
    if (mob.hp > 0 && mob.gauge >= THRESHOLD) {
      mob.gauge -= THRESHOLD
      actMob(mob, party, log)
    }
    // 라운드 스냅샷 (표시 단위)
    if (tick % ROUND_TICKS === 0) { rounds.push(snapshot(tick)); log = [] }
    // 승패 판정
    if (mob.hp <= 0) return finish('party')
    if (party.every(u => u.hp <= 0)) return finish('mob')
  }
  return finish('mob') // 교착 → 몹 승
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/battle-run.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: 전체 테스트 확인**

Run: `node --test`
Expected: 모든 테스트 PASS (data, unit, helpers, run).

- [ ] **Step 6: Commit (git 설치 후)**

```bash
git add src/engine/battle.js tests/battle-run.test.js
git commit -m "feat: ATB tick battle loop (runBattle)"
```

---

## Task 5: 교착(stalemate) 처리 검증

**Files:**
- Test: `tests/battle-stalemate.test.js`
- Modify: (필요시) `src/engine/battle.js`

- [ ] **Step 1: 실패할 수도 있는 교착 테스트 작성**

Create `tests/battle-stalemate.test.js`:
```js
import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { MOBS } from '../src/data/mobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'

test('maxTicks reached with no death → mob wins (stalemate)', () => {
  // 가디언(spd5) vs 오우거(spd6): maxTicks 50이면 둘 다 게이지 1000 못 채움 → 아무도 행동 못 함 → 교착.
  const party = [makeUnit(JOBS.guardian)]
  const mob = makeMob(MOBS.ogre)
  const r = runBattle(party, mob, { maxTicks: 50 })
  assert.strictEqual(r.winner, 'mob')
  assert.strictEqual(r.ticks, 50)
})
```

- [ ] **Step 2: 테스트 실행**

Run: `node --test tests/battle-stalemate.test.js`
Expected: PASS (Task 4의 `return finish('mob')` 교착 처리가 이미 커버).

- [ ] **Step 3: Commit (git 설치 후)**

```bash
git add tests/battle-stalemate.test.js
git commit -m "test: stalemate → mob win"
```

---

## Task 6: 시뮬레이터 (sim.js)

**Files:**
- Create: `sim/sim.js`

- [ ] **Step 1: sim.js 작성**

Create `sim/sim.js`:
```js
// 헤드리스 밸런스 측정. 평타는 결정론 → 매치업당 단일 결과(승/패 + 킬틱).
import { JOBS } from '../src/data/jobs.js'
import { MOBS } from '../src/data/mobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'

const PARTIES = {
  '균형':   ['warrior', 'mage', 'guardian', 'priest'],
  '딜몰빵': ['mage', 'mage', 'warrior'],
  '탱힐':   ['guardian', 'guardian', 'priest'],
}

console.log('=== 베이스 시뮬 (평타, 결정론) ===')
for (const [pname, jobKeys] of Object.entries(PARTIES)) {
  for (const mkey of Object.keys(MOBS)) {
    const party = jobKeys.map(j => makeUnit(JOBS[j]))
    const mob = makeMob(MOBS[mkey])
    const r = runBattle(party, mob)
    const outcome = r.winner === 'party' ? '승' : '패'
    console.log(`${pname.padEnd(7)} vs ${MOBS[mkey].name.padEnd(5)} → ${outcome} (${r.ticks}틱)`)
  }
}
```

- [ ] **Step 2: 시뮬 실행 확인**

Run: `node sim/sim.js`
Expected: 3 파티 × 2 몹 = 6줄, 각 `승/패 (N틱)` 출력. (수치는 placeholder라 결과 자체는 밸런스 판단용이지 정답 아님.)

- [ ] **Step 3: Commit (git 설치 후)**

```bash
git add sim/sim.js
git commit -m "feat: headless balance simulator"
```

---

## Task 7: 브라우저 UI (render + main + index.html)

**Files:**
- Create: `src/ui/render.js`
- Create: `src/ui/main.js`
- Create: `index.html`
- Test: `tests/render.test.js`

- [ ] **Step 1: render 실패 테스트 작성**

Create `tests/render.test.js`:
```js
import { test } from 'node:test'
import assert from 'node:assert'
import { renderBattle } from '../src/ui/render.js'

test('renderBattle returns html string with outcome and names', () => {
  const result = {
    winner: 'party',
    ticks: 50,
    rounds: [
      { tick: 28, party: [{ name: '전사', hp: 100, maxHp: 115 }], mob: { name: '슬라임', hp: 0, maxHp: 200 }, log: ['전사 공격 → 슬라임 (-19)'] },
    ],
  }
  const html = renderBattle(result)
  assert.strictEqual(typeof html, 'string')
  assert.match(html, /승리/)
  assert.match(html, /전사/)
  assert.match(html, /슬라임/)
})

test('renderBattle shows 패배 when mob wins', () => {
  const html = renderBattle({ winner: 'mob', ticks: 10, rounds: [] })
  assert.match(html, /패배/)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/render.test.js`
Expected: FAIL (`Cannot find module '../src/ui/render.js'`).

- [ ] **Step 3: render.js 작성 (순수 — DOM 의존 없음)**

Create `src/ui/render.js`:
```js
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
    const mob = `<span class="mob">${esc(r.mob.name)} ${r.mob.hp}/${r.mob.maxHp}</span>`
    const log = r.log.map(l => `<div class="log">${esc(l)}</div>`).join('')
    return `<section><h3>라운드 ${i + 1} (틱 ${r.tick})</h3><div>${party}</div><div>${mob}</div>${log}</section>`
  }).join('')
  return head + rounds
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/render.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: main.js 작성 (DOM mount)**

Create `src/ui/main.js`:
```js
import { JOBS } from '../data/jobs.js'
import { MOBS } from '../data/mobs.js'
import { makeUnit, makeMob } from '../engine/unit.js'
import { runBattle } from '../engine/battle.js'
import { renderBattle } from './render.js'

// 베이스: 고정 파티 1개 vs 고정 몹. (선발/경제는 후속 단계.)
const party = [
  makeUnit(JOBS.warrior),
  makeUnit(JOBS.mage),
  makeUnit(JOBS.guardian),
  makeUnit(JOBS.priest),
]
const mob = makeMob(MOBS.ogre)
const result = runBattle(party, mob)
document.getElementById('app').innerHTML = renderBattle(result)
```

- [ ] **Step 6: index.html 작성**

Create `index.html`:
```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Party RPG — 베이스</title>
  <style>
    body { font-family: ui-monospace, monospace; background: #111; color: #ddd; padding: 1rem; line-height: 1.5; }
    h2 { color: #fc6; }
    section { border-top: 1px solid #333; padding: .5rem 0; }
    .hp { color: #6c6; }
    .mob { color: #e88; }
    .log { color: #9af; font-size: .9em; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="src/ui/main.js"></script>
</body>
</html>
```

- [ ] **Step 7: 브라우저 수동 검증**

`index.html`은 ES 모듈이라 `file://` 더블클릭으론 CORS로 막힘. 확인 방법 둘 중 하나:
- GitHub Pages에 push 후 URL 접속, 또는
- 임시 로컬 서버: `node --experimental-default-type=module -e "..."` 대신 간단히 — 이 단계는 Pages 배포로 검증(별도 배포 Task에서). 지금은 `render.js` 단위테스트로 로직 검증 완료로 간주.
Expected: 페이지에 "결과: 승리/패배" + 라운드별 HP·로그 표시.

- [ ] **Step 8: Commit (git 설치 후)**

```bash
git add src/ui/render.js src/ui/main.js index.html tests/render.test.js
git commit -m "feat: browser UI (render + mount + index.html)"
```

---

## Task 8: 전체 검증

- [ ] **Step 1: 전체 테스트**

Run: `node --test`
Expected: 전 테스트 PASS (data, unit, battle-helpers, battle-run, battle-stalemate, render).

- [ ] **Step 2: 시뮬 실행**

Run: `node sim/sim.js`
Expected: 6 매치업 결과 출력.

- [ ] **Step 3: Commit (git 설치 후)**

```bash
git add -A
git commit -m "chore: base ATB engine complete"
```

---

## 후속 (이 계획 범위 밖 — CLAUDE.md §9)
- GitHub Pages 배포 셋업 (별도) — Pages로 브라우저 플레이 검증.
- step3 특수속성/RPS, step4 성장경제, step5 스킬/마나/쿨, 이후 관계망 동사.
