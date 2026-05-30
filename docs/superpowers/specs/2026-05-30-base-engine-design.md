# 베이스 — ATB 평타 전투 엔진 (설계)

> 임시 산출물: brainstorming → writing-plans 넘기기용. 구현 끝나면 버려도 됨. 영구 사실은 코드 + CLAUDE.md(기획) + (필요시) project-docs.

## 무엇
성장형 파티빌더 RPG의 **첫 빌드 조각**: ATB 틱 전투 엔진(평타만) + 직업/몹 데이터 테이블 + 헤드리스 시뮬레이터 + 브라우저 UI 골격. 텍스트 RPG, 정적 웹. 범위 = `CLAUDE.md` §9 로드맵 step 1+2.

## 스택 (결정)
- 소스 = 멀티파일 **정적**. 엔진·데이터 = 순수 ES 모듈, 외부 의존성 0.
- 플레이 배포 = **GitHub Pages** (정적·무료·멀티파일 그대로 서빙).
- 시뮬 = **로컬 node** (`node sim/sim.js`), 같은 엔진 모듈 import.
- **이유:** 엔진을 DOM-free로 두면 브라우저·node 양쪽이 재사용 → 시뮬레이터 재사용이 핵심(§8). 정적이라 Pages 무료 + 오프라인 로컬도 가능. 번들러·빌드 없음(§11 작게).
- 모든 수치는 **placeholder**. 밸런스·기획 수치는 나중 전면 튜닝(데이터 테이블 분리라 코드 수정 없이 변경).

## 파일 구조
```
game/
  index.html              # 엔트리. <script type=module src=src/ui/main.js>
  package.json            # {"type":"module"} — 의존성 0
  src/
    data/jobs.js          # 직업 5종 테이블
    data/mobs.js          # 몹 테이블
    engine/battle.js      # ATB 틱루프·평타·타게팅·교착. 순수, DOM 0
    ui/render.js          # DOM 렌더: 파티/몹 패널 + 라운드 로그
    ui/main.js            # 부트: 데이터 → runBattle() → render
  sim/sim.js              # node 헤드리스: runBattle() 반복 → 승/패·킬틱
```

## 모듈 경계
- **`battle.js` = 핵심 단위.** `runBattle(party, mob, opts) → { winner, rounds, ticks }`. 순수함수, 부수효과 0. ui·sim 공용.
- `data/*` = 순수 테이블, 로직 없음.
- `ui/*` = 표시만. 전투 계산 안 함.
- `sim/sim.js` = node 전용, 브라우저 무관.

## 엔진 계약 (평타 단계)
- **틱:** 매 틱 `gauge += spd`; `gauge ≥ 1000`이면 1회 행동 후 `gauge −= 1000`. 틱내 순서: ①버프만료(미래) ②게이지증가 ③행동 (§5.3).
- **데미지:** `max(1, atk − def)`. **전 타입 동일.** `type`(phys/magic/heal) 태그는 데이터에 남기되 베이스선 효과 0 (미래 물리면역/마법저항 RPS용 예약).
- **힐:** `role:'heal'` 유닛 → 최저 HP 아군 `+heal`.
- **타게팅 (§5.6):** 딜러 → 몹. 몹 단일공격 → `taunt` 탱 생존시 탱, 아니면 최저 HP 아군. 몹 광역(`aoe`) → 전 아군 `atk*aoeRatio`.
- **교착 (§5.7):** `maxTicks` 초과 → 몹 승(플레이어 패).
- **결정론:** 평타뿐이라 RNG·마나·쿨 없음 → 같은 입력 = 같은 출력. 따라서 베이스 시뮬은 매치업당 **단일 승/패 + 킬틱**(승률 분포 아님). 분포는 변동성(스킬·마나) 들어오는 step5부터.
- **라운드:** ~28틱 묶음 = 순수 표시단위(§5.1). 전투 계산에 영향 0.

## 데이터 형태 (수치 placeholder)
```js
// jobs.js
JOBS = {
  novice:   { name:'노비스', hp:70,  atk:14, type:'phys',  spd:7, role:'dps' },
  warrior:  { name:'전사',   hp:115, atk:22, type:'phys',  spd:9, role:'dps' },
  mage:     { name:'마법사', hp:55,  atk:32, type:'magic', spd:8, role:'dps' },
  guardian: { name:'가디언', hp:260, atk:10, type:'phys',  spd:5, role:'tank', taunt:true },
  priest:   { name:'사제',   hp:95,  atk:6,  type:'heal',  spd:7, role:'heal', heal:30 },
}
// mobs.js
MOBS = {
  slime: { name:'슬라임', hp:200, atk:18, def:3, spd:8, aoe:false },
  ogre:  { name:'오우거', hp:400, atk:28, def:6, spd:6, aoe:true, aoeRatio:0.6 },
}
```
플레이어 유닛은 `def` 없음 → 0 취급.

## 범위
**넣음:** 직업 5종(레벨1 고정), 몹 1~2종, 평타 엔진(틱·데미지·힐·타게팅·광역·교착), 전투 출력(승자+라운드 스냅샷), UI 골격(고정 파티 1개 vs 몹, 라운드 로그), 헤드리스 sim.

**뺌(후속 단계):** 특수속성/RPS(step3), 성장경제·골드·전직·슬롯(step4), 스킬·마나·쿨(step5), 관계망 동사(step6), 스킬레벨(step7), 2차전직(step8), 속성 degree(step9), 유물(step10).

## 실행·배포
구현 단계에서 명령을 정리(runbook). 개념: GitHub Pages = 사람 플레이, `node sim/sim.js` = 로컬 밸런스 측정.
