import { test } from 'node:test'
import assert from 'node:assert'
import { renderBattleStage } from '../src/ui/components/BattleStage.js'

const FR = [
  { tick: 100, actor: '전사', log: ['전사 공격 → 슬라임 (-30)'],
    party: [{ name: '전사', level: 5, hp: 100, maxHp: 115, mana: 25, manaMax: 100, gauge: 0, alive: true, effects: [{ type: 'dmgDealt', value: 1.3, expireTick: 300 }] }],
    mob: { name: '슬라임', hp: 170, maxHp: 200, boss: false, effects: [] } },
  { tick: 200, actor: '슬라임', log: ['슬라임 공격 → 전사 (-12)'],
    party: [{ name: '전사', level: 5, hp: 88, maxHp: 115, mana: 50, manaMax: 100, gauge: 0, alive: true, effects: [] }],
    mob: { name: '슬라임', hp: 170, maxHp: 200, boss: false, effects: [] } },
]

test('renderBattleStage: frames 없으면 빈 문자열', () => {
  assert.strictEqual(renderBattleStage([], 0), '')
  assert.strictEqual(renderBattleStage(undefined, 0), '')
})

test('renderBattleStage: 전황 + 컨트롤 + 액션 로그', () => {
  const html = renderBattleStage(FR, 0)
  assert.match(html, /battle-stage/)
  assert.match(html, /data-action="pbNext"/)
  assert.match(html, /data-action="pbPlay"/)
  assert.match(html, /전사/)
  assert.match(html, /슬라임/)
  assert.match(html, /100\/115/)          // HP 수치
  assert.match(html, /전사 공격 → 슬라임/) // 액션 로그
  assert.match(html, /강화/)               // dmgDealt↑ = 강화 키워드
  assert.match(html, /data-tip="status" data-type="dmgDealt"/) // 버프 툴팁 연결
  assert.match(html, /1 \/ 2 · 1초/)       // 커서/카운트(틱100=1초)
})

test('renderBattleStage: 첫 frame이면 prev/first disabled', () => {
  const html = renderBattleStage(FR, 0)
  assert.match(html, /data-action="pbPrev" disabled/)
  assert.match(html, /data-action="pbFirst" disabled/)
})

test('renderBattleStage: 마지막 frame이면 next/last disabled', () => {
  const html = renderBattleStage(FR, 1)
  assert.match(html, /data-action="pbNext" disabled/)
  assert.match(html, /data-action="pbLast" disabled/)
  assert.match(html, /2 \/ 2/)
})

test('renderBattleStage: cursor 범위 밖 클램프', () => {
  const html = renderBattleStage(FR, 99)
  assert.match(html, /2 \/ 2 · 2초/)       // 마지막으로 클램프(틱200=2초)
})

test('renderBattleStage: 번호 badge + 행동/피격 테두리 + 배속 셀렉터', () => {
  const FR2 = [
    { tick: 5, actor: '노비스', actorRef: 0, targets: ['mob'], log: ['노비스 공격 → 슬라임 (-10)'],
      party: [
        { name: '노비스', level: 1, hp: 50, maxHp: 50, mana: 0, manaMax: 100, gauge: 0, alive: true, effects: [] },
        { name: '노비스', level: 1, hp: 50, maxHp: 50, mana: 0, manaMax: 100, gauge: 0, alive: true, effects: [] },
      ],
      mob: { name: '슬라임', hp: 170, maxHp: 200, boss: false, effects: [] } },
    { tick: 8, actor: '슬라임', actorRef: 'mob', targets: [1], log: ['슬라임 공격 → 노비스 (-12)'],
      party: [
        { name: '노비스', level: 1, hp: 50, maxHp: 50, mana: 0, manaMax: 100, gauge: 0, alive: true, effects: [] },
        { name: '노비스', level: 1, hp: 38, maxHp: 50, mana: 0, manaMax: 100, gauge: 0, alive: true, effects: [] },
      ],
      mob: { name: '슬라임', hp: 170, maxHp: 200, boss: false, effects: [] } },
  ]
  const h0 = renderBattleStage(FR2, 0, false, 2)
  assert.match(h0, /#1/)                              // 번호 badge
  assert.match(h0, /class="bu acting"/)               // 인덱스0 행동 → 초록 테두리
  assert.match(h0, /class="bu mob-row hit"/)          // 몹 = 타겟 → 빨강 테두리
  assert.match(h0, /data-action="pbSpeed"/)           // 배속 버튼 존재
  assert.match(h0, /data-speed="2" class="on"/)       // 현재 배속 2배 active
  const h1 = renderBattleStage(FR2, 1, false, 1)
  assert.match(h1, /class="bu hit"/)                  // 인덱스1 유닛 피격 → 빨강
  assert.match(h1, /class="bu mob-row acting"/)       // 몹 행동 → 초록
  assert.match(h1, /data-speed="1" class="on"/)       // 배속 1배 active
})

test('renderBattleStage: 몹이 파티보다 위(먼저 렌더)', () => {
  const h = renderBattleStage(FR, 0)
  assert.ok(h.indexOf('mob-side') < h.indexOf('party-side'), '몹 사이드가 파티보다 먼저')
})

test('renderBattleStage: 몹 특성/광역 = data-tip pill, 버프/디버프 = 명명 키워드 + status 툴팁', () => {
  const fr = [{ tick: 100, actor: '전사', actorRef: 0, targets: ['mob'], log: ['x'],
    party: [{ name: '전사', level: 5, hp: 100, maxHp: 100, mana: 0, manaMax: 100, gauge: 0, alive: true, effects: [{ type: 'dmgDealt', value: 1.3, expireTick: 400 }] }],
    mob: { name: '가시거북', hp: 50, maxHp: 60, boss: false, aoe: true, traits: ['melee_evade'], effects: [{ type: 'dmgTaken', value: 1.25, expireTick: 350 }] } }]
  const h = renderBattleStage(fr, 0, false, 1)
  assert.match(h, /data-tip="trait" data-trait="melee_evade"/) // 몹 특성 툴팁
  assert.match(h, /data-tip="aoe"/)                            // 광역 툴팁
  assert.match(h, /취약/)                                       // 몹 받는뎀↑ = 취약(이름)
  assert.match(h, /data-tip="status" data-type="dmgTaken" data-value="1.25" data-remain="250"/) // 정확표기+남은지속(350-100)
  assert.match(h, /강화/)                                       // 유닛 주는뎀↑ = 강화
})

test('renderBattleStage: party(로스터 매핑) 주면 유닛행 클릭=openModal, 없으면 없음', () => {
  assert.match(renderBattleStage(FR, 0, false, 1, [2]), /data-action="openModal"[^>]*data-i="2"/) // party[0]=로스터 idx2
  assert.doesNotMatch(renderBattleStage(FR, 0), /openModal/)  // party 미전달=하위호환(클릭 없음)
})

test('renderBattleStage: 사망 유닛 dead 클래스', () => {
  const dead = [{ tick: 1, actor: '슬라임', log: [], party: [{ name: '전사', level: 1, hp: 0, maxHp: 100, mana: 0, manaMax: 100, gauge: 0, alive: false, effects: [] }], mob: { name: '슬라임', hp: 50, maxHp: 200, boss: false, effects: [] } }]
  assert.match(renderBattleStage(dead, 0), /class="bu dead"/)
})
