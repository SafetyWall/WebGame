# 아트 / UI

> UI·표현의 owner. 전투 표시 규칙(라운드 단위 등)은 [game-design.md](game-design.md) §5.1, 렌더 구현은 [program.md](program.md) `render.js`.

## 표현 철학
- **텍스트 RPG 범위로 충분.** 화려한 그래픽 불필요.
- 전투는 플레이어 개입 없이 진행 → **라운드 스냅샷 로그**로 결과를 끊어 보여줌.

## 아키텍처 (UI 레이어)
- **component + store (dep-0 바닐라).** 엔진 DOM-free 유지, UI만 표시. (구현 = program.md `ui/*`.)
- `ui/store.js` = 중앙 상태 `{run, ui}` + dispatch(run 액션 위임) + subscribe. `component.js` = 서브트리 render(state)→html, `update(el,state)` seam(미래 타깃패치). `view.js` = 컴포넌트 합성(prep/result 분기).
- **흐름 불변식:** 엔진→상태→구독자. 미래 전투 재생뷰(`BattleStage`)·애니메이션은 *컴포넌트 render 타깃 추가*지 재구조화 아님.

## 현재 화면 (2026-06-03 개편)
- `index.html` — 단일 페이지, 다크 모노스페이스, **폭 고정 `#app` max-width 440px**(넓은 화면서 stretch/열증가 안 함). 모바일 우선.
- 색: 제목 `#fc6` / HP `.hp`·`.hpbar` `#6c6` / 몹 `.mob` `#e88`(보스 `.mob.boss` `#f84` 볼드) / 트레잇·특성 `#fc6` / 로그 `.log` `#9af` / 카드 `#161a16`(출전 `.in` 초록테). 배경 `#111`.
- **준비 국면 컴포넌트:** `StageHeader`(스테이지/골드/슬롯 + **레이아웃 토글**) · `EnemyPreview`(보스 👑 + 광역·트레잇 = **탭 툴팁** pill) · `Roster`=`CharacterCard[]`(**1열/2열** `ui.layout`, 카드=좌 능력[직업·Lv·앞열🛡️·HP바·수치]+우 **스킬 2×2 pill**[학습 초록/미학습 회색], 출전 토글, 카드 본문 탭=상세모달) · `PartyOrder`(출전순서 앞→뒤, **드래그** 재배열, 맨앞=타겟) · `ActionBar`(영입·슬롯확장·전투, 풀파티 disabled).
- **상세 모달** `CharacterModal`(카드 탭): 풀스탯 + 강화(비노비스 ~L10)/전직(노비스 L1, 6직업)/스킬 학습·레벨업 + **레벨업 before→after 미리보기** + **스킬 우선순위 드래그** 리스트.
- **툴팁** `Tooltip`(`describe.js` 생성 텍스트): 스킬 = 위력×·마나·쿨·effect 요약(스킬레벨 반영), 트레잇 = 회피/면역/회복/반사/타겟팅 설명. **click/tap 토글**(PC=모바일 통일, hover 비의존), 바깥탭/스크롤 닫기.
- **드래그** = pointer 이벤트(`drag.js`, 터치+마우스 공용. HTML5 DnD는 터치 미지원이라 회피). 드롭=목표 인덱스(`dragMove.js`).
- **결과 국면** `ResultView`: 승/패/클리어 배너 + `render.js` `renderRounds` 재사용 + 다음/재시작. 버튼 = `data-action`, `main.js` 위임. 스킬은 전투 로그에 텍스트로 자동 노출.

## 전투 재생뷰 (2026-06-03 구현)
- `BattleStage`(ui.frames/cursor 구독) — **액션단위** 스텝(◀▶⏮⏭) + 자동재생(⏯ 700ms) + 라이브 전황(파티/몹 HP바·마나바·effect 태그). `ResultView` = 배너 + 재생뷰 + **전체 로그 접이식**(`<details>`, renderRounds).
- frame = `runBattle({record:true})` → 틱·행위자·로그 + 전 유닛 상태. `run.battleFrames(s)`로 결정론 재생성(ui 휘발, 영속 안 함 → 새로고침 시 복구).
- effect 태그 색: dot/stun 적색, hot 녹색, 그 외 청색.

## 향후 비주얼 방향 (미구현)
- 캐릭터 애니메이션/스프라이트/파티클 = `BattleStage`만 render 타깃 교체(`update` 타깃패치 or `CanvasStage` 가산). 프레임워크 불변.
- HP 바 = 준비 화면은 항상 풀. 직업·속성 심볼/색 카운터 힌트. 스킬 pill **아이콘화**(2×2 불변, pill만 교체).
