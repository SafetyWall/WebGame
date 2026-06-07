import { test } from 'node:test'
import assert from 'node:assert'
import { renderApp } from '../src/ui/view.js'
import { newRun } from '../src/engine/run.js'
import { makeRng } from '../src/engine/rng.js'

const S = (run, ui = {}) => ({ run, ui: { layout: '2col', modal: null, ...ui } })

test('prep: 헤더/골드/적/기본 액션 노출', () => {
  const html = renderApp(S(newRun(makeRng(1))))
  assert.match(html, /스테이지 1/)
  assert.match(html, /💰20/)
  assert.match(html, /다가올 적/)
  assert.match(html, /data-action="recruit"/)
  assert.match(html, /data-action="toggle"/)
  assert.match(html, /data-action="fight"/)
})

test('prep: 레이아웃 클래스 + 토글 버튼(2col→1col)', () => {
  const html = renderApp(S(newRun(makeRng(1)), { layout: '2col' }))
  assert.match(html, /roster layout-2col/)
  assert.match(html, /data-action="toggleLayout"[^>]*data-layout="1col"/)
  const h1 = renderApp(S(newRun(makeRng(1)), { layout: '1col' }))
  assert.match(h1, /roster layout-1col/)
  assert.match(h1, /data-layout="2col"/)
})

test('prep: 카드 본문=openModal, 스킬 pill=openSkill(상세 팝업)', () => {
  const s = { ...newRun(makeRng(1)), roster: [{ job: 'warrior', level: 2, learnedSkills: ['warrior_cleave'], skillLevels: { warrior_cleave: 1 } }], party: [0] }
  const html = renderApp(S(s))
  assert.match(html, /data-action="openModal"[^>]*data-i="0"/)
  assert.match(html, /class="sk have"[^>]*data-action="openSkill"[^>]*data-i="0"[^>]*data-skill="warrior_cleave"/)   // 학습=have
  assert.match(html, /class="sk no"[^>]*data-action="openSkill"[^>]*data-i="0"[^>]*data-skill="warrior_heavy"/)       // 미학습=no
})

test('prep: 카드/모달에 방어(def)+속도 표기 — 탱만 방어(딜러 def0 미표기)', () => {
  const g = { ...newRun(makeRng(1)), roster: [{ job: 'guardian', level: 2 }], party: [0] }
  const card = renderApp(S(g))
  assert.match(card, /방어 100/)        // 카드 nums (가디언 def100)
  assert.match(card, /속도 5/)          // 카드에 속도(가디언 spd5)
  assert.match(card, /class="stat st-hp"/)  // stats = 고정 셀(열 정렬·값 중간 줄바꿈 방지)
  assert.match(card, /class="stat st-def"><\/span>|class="stat st-def">방어/)  // def 셀 항상 렌더(딜러는 빈 셀=열 자리)
  assert.match(renderApp(S(g, { modal: 0 })), /방어 100/) // 모달 stats
  assert.doesNotMatch(renderApp(S(newRun(makeRng(1)))), /방어 /)  // 노비스(def0) 미표기
})

test('prep: 노비스 카드 = 스킬 영역 빈칸(전직 안내 미노출)', () => {
  const html = renderApp(S(newRun(makeRng(1))))
  assert.doesNotMatch(html, /전직 필요/)
  assert.match(html, /<div class="skills2"><\/div>/)   // 빈 2×2
})

test('prep: 적 특성/광역 = data-tip pill', () => {
  const base = newRun(makeRng(1))
  const s = { ...base, encounter: { ...base.encounter, name: '오우거', boss: true, aoe: true, traits: ['regeneration'] } }
  const html = renderApp(S(s))
  assert.match(html, /data-tip="aoe"/)
  assert.match(html, /data-tip="trait"[^>]*data-trait="regeneration"/)
  assert.match(html, /👑 오우거/)
})

test('prep: 출전 카드 = 자체 드래그(data-drag=party, data-pos)', () => {
  const html = renderApp(S({ ...newRun(makeRng(1)), party: [0, 1] }))
  assert.match(html, /data-action="openModal" data-i="0" data-drag="party" data-pos="0"/)
  // 벤치(미출전)는 drag 속성 없음
  const s = { ...newRun(makeRng(1)), party: [0] }
  const h2 = renderApp(S(s))
  assert.match(h2, /data-action="openModal" data-i="1"(?! data-drag)/)
})

test('prep: 풀파티면 미출전 출전버튼 disabled', () => {
  const html = renderApp(S({ ...newRun(makeRng(1)), slots: 1, party: [0] }))
  assert.match(html, /<button class="mini" disabled[^>]*>출전<\/button>/)
})

test('modal: ui.modal=null이면 모달 없음', () => {
  const html = renderApp(S(newRun(makeRng(1))))
  assert.doesNotMatch(html, /modal-overlay/)
})

test('modal: 비노비스 = 강화 before→after 미리보기', () => {
  const s = { ...newRun(makeRng(1)), gold: 50, roster: [{ job: 'warrior', level: 1 }], party: [0] }
  const html = renderApp(S(s, { modal: 0 }))
  assert.match(html, /modal-overlay/)
  assert.match(html, /data-action="upgrade"[^>]*data-i="0"/)
  assert.match(html, /HP 115→<b>138<\/b>/)
  assert.match(html, /\(\+23\)/)
  assert.match(html, /data-action="closeModal"/)
})

test('modal: 노비스 = 전직 버튼', () => {
  const s = { ...newRun(makeRng(1)), gold: 50 }
  const html = renderApp(S(s, { modal: 0 }))
  assert.match(html, /data-action="promote"[^>]*data-job="warrior"/)
  assert.doesNotMatch(html, /data-action="upgrade"/)
})

test('modal: 스킬 = openSkill 진입(학습 액티브 + 미학습 pill), 인라인 학습/레벨업 없음', () => {
  const s = { ...newRun(makeRng(1)), gold: 50, roster: [{ job: 'warrior', level: 2, learnedSkills: ['warrior_cleave'], skillLevels: { warrior_cleave: 1 } }], party: [0] }
  const html = renderApp(S(s, { modal: 0 }))
  assert.match(html, /data-action="openSkill"[^>]*data-skill="warrior_cleave"/)  // 장착 스킬 클릭→상세
  assert.match(html, /data-action="openSkill"[^>]*data-skill="warrior_heavy"/)   // 미학습 pill 클릭→상세
  assert.doesNotMatch(html, /data-action="learnSkill"/)    // 학습/레벨업은 상세 팝업으로 이동
  assert.doesNotMatch(html, /data-action="levelupSkill"/)
})

test('skillDetail: 코어/부여효과 분리, 레벨업은 맨 밑 변화만', () => {
  const s = { ...newRun(makeRng(1)), gold: 50, roster: [{ job: 'warrior', level: 2, learnedSkills: ['warrior_cleave'], skillLevels: { warrior_cleave: 1 } }], party: [0] }
  const html = renderApp(S(s, { modal: 0, skillDetail: { i: 0, skillId: 'warrior_cleave' } }))
  assert.match(html, /skill-detail-overlay/)
  assert.match(html, /부여 효과/)
  assert.match(html, /취약/)                    // 키워드 pill
  assert.match(html, /적에게/)                  // 대상 라벨(별도)
  assert.match(html, /받는 데미지 \+25%/)        // 효과 문구(보유자 기준, 적 접두 없음)
  assert.match(html, /지속 500틱/)               // 지속 라벨링
  assert.doesNotMatch(html, /\[취약\]/)          // 상단 코어엔 effect 줄 중복 없음
  // 레벨업 = 맨 밑 변화만
  assert.match(html, /위력 ×1\.7 → ×2\.13/)
  assert.match(html, /받는 데미지 \+25% → \+31%/)   // 레벨업 줄 = 효과 문구 기반(보유자 기준)
  assert.match(html, /data-action="levelupSkill"[^>]*data-skill="warrior_cleave"/)
})

test('skillDetail: 미학습 = 학습 버튼', () => {
  const s = { ...newRun(makeRng(1)), gold: 50, roster: [{ job: 'warrior', level: 2, learnedSkills: ['warrior_cleave'] }], party: [0] }
  const html = renderApp(S(s, { modal: 0, skillDetail: { i: 0, skillId: 'warrior_heavy' } }))
  assert.match(html, /data-action="learnSkill"[^>]*data-skill="warrior_heavy"/)
})

test('skillDetail: 기본 공격 = 학습/레벨업 없음', () => {
  const s = { ...newRun(makeRng(1)), roster: [{ job: 'warrior', level: 2 }], party: [0] }
  const html = renderApp(S(s, { modal: 0, skillDetail: { i: 0, skillId: 'melee_strike' } }))
  assert.match(html, /기본 공격 — 학습·레벨업 없음/)
  assert.doesNotMatch(html, /data-action="learnSkill"/)
})

test('skillDetail: null이면 미노출', () => {
  const s = { ...newRun(makeRng(1)), roster: [{ job: 'warrior', level: 2 }], party: [0] }
  assert.doesNotMatch(renderApp(S(s, { modal: 0 })), /skill-detail-overlay/)
})

test('skillDetail: 카드에서 열면(모달 없음) 읽기전용 — 학습/레벨업/최대레벨 푸터 없음', () => {
  const s = { ...newRun(makeRng(1)), gold: 50, roster: [{ job: 'warrior', level: 5, learnedSkills: ['warrior_cleave'], skillLevels: { warrior_cleave: 5 } }], party: [0] }
  const html = renderApp(S(s, { modal: null, skillDetail: { i: 0, skillId: 'warrior_cleave' } }))
  assert.match(html, /skill-detail-overlay/)
  assert.match(html, /부여 효과/)            // 상세 본문은 보임
  assert.doesNotMatch(html, /sd-action/)      // 액션 푸터 없음
  assert.doesNotMatch(html, /levelupSkill/)
  assert.doesNotMatch(html, /최대 레벨/)
})

test('modal: 다중 스킬 = 우선순위 드래그 리스트', () => {
  const s = { ...newRun(makeRng(1)), roster: [{ job: 'warrior', level: 2 }], party: [0] }
  const html = renderApp(S(s, { modal: 0 }))
  assert.match(html, /class="prio-item" data-drag="prio"[^>]*data-skill="warrior_cleave"/)
  assert.match(html, /data-skill="melee_strike"/)
})

test('result: 승리 배너 + 다음 버튼', () => {
  const s = { ...newRun(makeRng(1)), phase: 'result', stage: 2, lastResult: { outcome: 'win', reward: 6, ticks: 100, rounds: [] } }
  const html = renderApp(S(s))
  assert.match(html, /승리/)
  assert.match(html, /골드 \+6/)
  assert.match(html, /data-action="next"/)
})

test('result: 패배=재시작 / 클리어=새 런', () => {
  const loss = renderApp(S({ ...newRun(makeRng(1)), phase: 'result', lastResult: { outcome: 'loss', reward: 0, ticks: 9, rounds: [] } }))
  assert.match(loss, /패배/)
  assert.match(loss, /data-action="restart"/)
  const clear = renderApp(S({ ...newRun(makeRng(1)), phase: 'result', stage: 20, lastResult: { outcome: 'clear', reward: 9, ticks: 100, rounds: [] } }))
  assert.match(clear, /클리어/)
  assert.match(clear, /data-action="restart"/)
})

test('result: ui.frames 있으면 재생뷰(battle-stage) 노출 + 전체로그 접이식', () => {
  const s = { ...newRun(makeRng(1)), phase: 'result', stage: 2, lastResult: { outcome: 'win', reward: 6, ticks: 100, rounds: [{ tick: 50, party: [{ name: '전사', hp: 5, maxHp: 115 }], mob: { name: '슬라임', hp: 0, maxHp: 30, traits: [] }, log: ['끝'] }] } }
  const ui = { layout: '2col', modal: null, cursor: 0, playing: false, frames: [{ tick: 50, actor: '전사', log: ['전사 공격'], party: [{ name: '전사', level: 3, hp: 5, maxHp: 115, mana: 0, manaMax: 100, gauge: 0, alive: true, effects: [] }], mob: { name: '슬라임', hp: 0, maxHp: 30, boss: false, effects: [] } }] }
  const html = renderApp({ run: s, ui })
  assert.match(html, /battle-stage/)
  assert.match(html, /<details class="full-log"><summary>전체 로그 보기/)
  assert.match(html, /라운드 1/)
})

test('result: 재생뷰 유닛 클릭→openModal + 읽기전용 모달(능력치+방어, 강화/스킬액션 없음)', () => {
  const s = { ...newRun(makeRng(1)), phase: 'result', stage: 2, party: [0],
    roster: [{ job: 'guardian', level: 2 }],
    lastResult: { outcome: 'win', reward: 6, ticks: 100, rounds: [] } }
  const ui = { layout: '2col', modal: null, cursor: 0, playing: false, speed: 1,
    frames: [{ tick: 5, actor: '가디언', log: ['x'], party: [{ name: '가디언', level: 2, hp: 100, maxHp: 312, mana: 0, manaMax: 100, gauge: 0, alive: true, effects: [] }], mob: { name: '슬라임', hp: 0, maxHp: 30, boss: false, effects: [] } }] }
  assert.match(renderApp({ run: s, ui }), /data-action="openModal"[^>]*data-i="0"/)   // 재생뷰 유닛=로스터0 클릭
  const opened = renderApp({ run: s, ui: { ...ui, modal: 0 } })
  assert.match(opened, /modal-overlay/)
  assert.match(opened, /방어 100/)                       // 능력치(방어 포함)
  assert.doesNotMatch(opened, /data-action="upgrade"/)   // 읽기전용 — 강화 버튼 없음(비노비스라면 prep엔 있음)
  assert.doesNotMatch(opened, /data-action="openSkill"/) // 스킬 액션 없음
})

test('result: 단일 h2 배너(결과: 헤더 중복 없음) + 라운드 로그 유지', () => {
  const s = { ...newRun(makeRng(1)), phase: 'result', stage: 2,
    lastResult: { outcome: 'win', reward: 6, ticks: 100, rounds: [
      { tick: 50, party: [{ name: '전사', hp: 5, maxHp: 115 }], mob: { name: '슬라임', hp: 0, maxHp: 30, traits: [] }, log: ['끝'] },
    ] } }
  const html = renderApp(S(s))
  assert.doesNotMatch(html, /결과:/)
  assert.strictEqual((html.match(/<h2>/g) || []).length, 1)
  assert.match(html, /라운드 1/)
})
