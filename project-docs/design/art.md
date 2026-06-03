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

## 향후 비주얼 방향 (미구현)
- **전투 재생뷰(`BattleStage`)** — 액션/라운드 스텝 + 라이브 전황(HP바·마나·쿨·effect 갱신), 버튼 넘김 or 전체 로그. `playbackCursor` 구독 + `update` 타깃패치. **엔진 스냅샷 강화(별도 spec)** 선행 필요(현 `rounds`=100틱·thin).
- HP 바 = 준비 화면은 항상 풀(전투 중 변동은 재생뷰에서). 마나/쿨/effect 아이콘.
- 직업·속성 심볼/색 카운터 힌트. 스킬 pill **아이콘화**(2×2 레이아웃 불변, pill만 교체).
