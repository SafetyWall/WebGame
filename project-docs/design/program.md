# 프로그램 — 아키텍처 / 엔진 계약

> 코드가 "어떻게" 돌아가는지의 owner. 게임 규칙(무엇/왜)은 [game-design.md](game-design.md), UI는 [art.md](art.md), 명령은 [../runbook.md](../runbook.md).

## 스택
정적 ES 모듈, 외부 의존성 0. 엔진 **DOM-free** → 브라우저(UI)와 node(시뮬) 공용. 테스트 = Node 내장 `node:test`. 배포 = GitHub Pages(정적 멀티파일 그대로). 번들러·빌드 단계 없음.

## 파일 구조 / 모듈 경계
```
index.html              # 엔트리, <script type=module src=src/ui/main.js>
package.json            # {"type":"module"}, 의존성 0
src/data/jobs.js        # 직업 테이블 (순수 데이터)
src/data/mobs.js        # 몹 테이블 (순수 데이터)
src/engine/unit.js      # 직업/몹 → 전투용 인스턴스 팩토리
src/engine/battle.js    # 틱루프·데미지·타게팅·교착. 순수, DOM 0. ← 핵심 단위
src/ui/render.js        # 전투결과 → HTML 문자열 (순수, 테스트 가능)
src/ui/main.js          # 부트: 데이터→runBattle→render mount (DOM 의존)
sim/sim.js              # node 헤드리스 시뮬
tests/*.test.js         # node:test
```
- `data/*` = 순수 테이블, 로직 없음. `ui/*` = 표시만(전투 계산 안 함). `sim/sim.js` = node 전용.

## 엔진 계약 (battle.js)
- `runBattle(party, mob, opts={maxTicks}) → { winner:'party'|'mob', rounds, ticks }`. **순수함수, 부수효과 0.** ui·sim 공용.
  - `rounds[]` = `{ tick, party:[{name,hp,maxHp}], mob:{name,hp,maxHp}, log:[...] }` 스냅샷.
- `makeUnit(job) → unit`, `makeMob(mob) → 몹`. 런타임 가변 `hp`·`gauge` 부여. **플레이어 유닛 def=0.**
- `damage(atk, def) = max(1, atk-def)`. `lowestHpAlly`, `selectMobTarget` export(테스트용).

## 틱 구현 ([game-design.md](game-design.md) §5 규칙의 구현)
- 매 틱: 살아있는 유닛 `gauge += spd`; `≥1000`이면 1회 행동 후 `gauge -= 1000`(**carry — 0 리셋 아님**).
- **틱 내 순서: ①버프만료(미래) ②게이지 증가 ③행동.** 일관성이 결정론 보장.
- **매 틱 계산 채택**, "다음 행동자 min-heap 점프"는 기각(속도 변조 잦아 큐 재계산 빈번 → 이득 상쇄). 측정 전 최적화 금지.
- 속도 버프 구현규칙(미래): 이미 찬 게이지 소급 수정 금지, 매 틱 현재 속도로 재계산.
- 라운드 = 28틱 스냅샷(표시용, 계산 영향 0).

## 결정 / 불변식
- **동시틱 = 파티 우선 (의도된 결정, 2026-05-30 확정).** 같은 틱에 양쪽 1000 도달 + 파티가 치명타면 몹은 반격 못 함. ATB 속도순 아님 — 단순성 위해 고정.
- **결정론:** 평타뿐이라 RNG·마나·쿨 없음 → 같은 입력 = 같은 출력. 따라서 시뮬은 매치업당 **단일 승/패 + 킬틱**(승률 분포는 변동성[스킬/마나] 들어오는 §9 step5부터).
- 교착: `maxTicks`(기본 20000) 초과 → 몹 승.

## 데이터 구조 (수치 placeholder — 코드 수정 없이 튜닝)
- `JOBS{ key: { name, hp, atk, type, spd, role, [taunt], [heal] } }`
- `MOBS{ key: { name, hp, atk, def, spd, aoe, [aoeRatio] } }`
- `type`(phys/magic/heal) = 미래 RPS용 태그, 현재 효과 0.

## 테스트 전략
`node:test` 25개. 핀된 규칙: 데이터 형태 / 유닛 팩토리 / damage·타게팅 / 전투(승·결정론·힐·스냅샷) / 교착 / 광역 적용값 / 도발 실전 라우팅 / 게이지 carry / 동시틱 파티우선 / 몹사망 break / 힐 cap / 라운드경계 중복방지.

## 데이터·코드 분리 원칙
직업·몹·속성·스킬 = 테이블로 분리 → 밸런스 튜닝이 코드 수정 없이. 시뮬은 프로젝트 내 스크립트로 두어 수치 변경 시 자동 재측정.
