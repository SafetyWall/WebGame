# CHANGELOG

## 2026-06-01
- **앞열 타겟팅 (위협도 시스템 Phase 1).** 몹 타겟팅 `lowestHpAlly`(최저체력 포커싱 → 마법사 일방 즉사) → **앞열(party 배열 순서) 첫 생존자** 타격. 도발 override 유지(도발자 중 앞열), `lowestHpAlly`는 힐 타겟 전용으로 분리. `reorderParty(s,i,dir)` + prep UI "출전 순서(앞→뒤)" ▲▼ 재배열 + 🛡️앞열 표식 → 탱 앞·마법사 뒤로 보호(자동전투의 어그로 통제 = 편성). RNG 미도입 = 결정론 유지(디자인 기둥 §2). sim: 균형파티(전사 앞 소킹) S5 승률 L1 15→25·L3 25→30 상승. 테스트 157→**164**. 4-task TDD. (설계: `docs/superpowers/specs/2026-06-01-targeting-threat-system-design.md`. Phase 2=위협도 스코어 일반화+몹 타겟 트레잇은 후속.)
- **몬스터 보스/일반 분리 + 전직 리워크 + 트레잇 확장 + 스킬 우선순위 UI(step5b) + 방어가드.** 5-task TDD, 테스트 132→**157**.
  - **전직 리워크.** 전직 = 레벨업. 노비스는 전직 레벨(`PROMOTE_LEVEL=1`)에서만 전직하고 **강화 불가**(성장=전직). 전직 시 레벨 자동 +1(노비스 L1 → 1차직업 L2). `changeJob`이 `level !== PROMOTE_LEVEL`이면 거부, `upgrade`가 노비스 거부. game.js 노비스 강화버튼 숨김. persist v1→**v2**(의미변경으로 구 세이브 폐기).
  - **몬스터 보스/일반 분리.** `MONSTERS`(일반=슬라임/가시거북, 고정특성 없음) / `BOSSES`(보스, 고정능력 `aoe`|`fixed` + `bonus` 추가 트레잇 슬롯). 오우거→보스(광역은 일반몹엔 사기). `generateEncounter(stage, rng, monId?)` — 일반은 랜덤 풀, 보스는 monId 명시(자동 스테이지 배치는 미정). **고정 특성(광역) 표기**: 스냅샷 `mob.aoe` 노출 + render/game이 트레잇과 한 대괄호에 `[광역, …]`, 보스 👑 표식. 드래곤 보스 추가(고정 재생 + 광역).
  - **트레잇 확장.** `ranged_immune`(영웅, melee_immune 거울=원거리 0뎀) + `regeneration`(전설, turnStart heal — 전설 tier 채움) + 방어트레잇 `defends`(range/full) 메타. **상호배제 `conflicts()`**(§7.2): 한 범위 완전봉쇄 + 다른 범위 방어 동시 부착 금지(전딜봉쇄→클리어불가 차단), 조우 생성 draw 루프가 후보 필터. 반사 killing-blow(반사로 공격자 0→사망) 테스트 핀.
  - **step5b — 플레이어 스킬 우선순위 재배열 UI.** roster `skillOrder` + `normalizeSkillOrder`(무효 id 무시·누락 직업스킬 append 보정) + `makeUnit(job, level, skillOrder?)` + `run.reorderSkill(▲▼, 무료)` + game.js 우선순위 버튼(스킬 2개+). fight가 skillOrder 전달.
  - **방어가드.** 빈/전멸 파티 입력 = `runBattle` 진입 시 즉시 몹 승(틱0, 루프 진입 전 단락).
  - 밸런스 튜닝은 요청대로 **미수행**. step6 동사·마법사 재설계·step7~10·**보스 스테이지 배치**는 디자인 결정(brainstorm) 필요로 보류.
- **step5 — 스킬 시스템(마나/쿨 발동 + effect 지속).** 직업당 스킬 1개: 마법사 파이어볼(2.2배딜)·전사 갑옷부수기(증뎀 디버프+딜)·사제 치유의기도(HoT)·가디언 도발(지속어글+방버프)+방패치기(보스 약뎀감). **노비스=평타만**(전직해야 스킬). **마나/쿨 게이팅**: 평타=마나 generator, 발동스킬=마나 소비, `selectSkill(u,tick)`=우선순위 톱다운 `canUse`(마나≥cost & tick≥readyTick), 없으면 평타 fallback. **effect 시스템** 신규 `engine/effects.js`(몹 트레잇과 평행 순수모듈): `dmgTaken`/`dmgDealt`/`taunt`/`hot` 4종, refresh 스택(`(type,source)` 덮어쓰기·다른 source 곱), expireTick 만료, HoT interval. 데미지 합성 = `damage(atk×power) × dmgDealtMult × dmgTakenMult × applyRules(트레잇)`. 가디언 상시도발→스킬 effect 전환(타게팅 `hasTaunt`). 버프=받는뎀 배율%(def 미도입). 틱루프 ①effect(tickHoT→expireEffects) 단계 신설. 결정론·순수 유지(노비스 평타파티 char-identical). 스킬 테스트는 더미몹(spd0·고HP)으로 1행동 격리해 데미지·마나·쿨·effect 부여를 직접 검증(승패 프록시 아님). sim L1/L3 비교 추가(L3 S5 9~22/30 분포·조합별 갈림). 테스트 105→**132**. 7-task TDD. (밸런스 정밀튜닝·step5b 우선순위 UI는 잔여.)

## 2026-05-31
- **step4 완결 — 재화 4축 + 영속 + 결과UI.** 성장 경제 4번째·5번째 동사: **전직**(`changeJob`, 노비스→전사/마법사/가디언/사제, 비용5, 비가역·레벨유지) + **슬롯확장**(`expandSlot`, 체증 `slotCost=5+4*(slots-3)`, 하드상한 없음). **localStorage 런 영속**(`ui/persist.js` save/load/clear 버전키 + `rng.snapshot()` mulberry32 accumulator 읽기 → 매 액션 저장·부팅 복원, 손상/구버전=새 런). **결과화면 이중헤더 제거**(`renderRounds` 추출, 틱수 배너 흡수). **풀파티 출전버튼 disabled 피드백**. 엔진 순수 불변(영속=UI 레이어). 브라우저 E2E 검증(전직·영속 리로드·슬롯확장·단일헤더·콘솔 0). 테스트 92→**105**. 9-task TDD + task별 리뷰.
- **플레이어블 코어 경제 루프 (step4 첫 슬라이스).** 직접 플레이 가능 — 인터랙티브 단일 페이지: 준비(영입4·강화4·출전선발) → 자동 전투 → 승=골드(4+stage)+다음 스테이지 / 패=패배화면→다시시작 / 최종 스테이지 승=클리어. 직업 레벨별 명시 스탯 테이블(levels{1..5}, level1=베이스) + `makeUnit(job, level)`. 순수 런 상태기계 `engine/run.js`(newRun/recruit/upgrade/toggleParty/fight/next/restart, terminal·prep-only 가드). `ui/game.js` renderGame(prep/result) + `main.js` 이벤트 위임. 인메모리(새로고침=새 런). 전투 자동·결정론 유지. 테스트 71→**92**.
- **조우 생성 시스템.** 시드 PRNG(`engine/rng.js`, mulberry32) → `generateEncounter(stage, rng)`: 풀에서 랜덤 몹 × `levelCurve(level)×계수` + 스테이지 슬롯별 distinct 랜덤 특성. flat `MOBS` → 레벨형 `MONSTERS`(계수)+`curve`+`stages` 교체, 트레잇에 rarity. 면역(mult0)=진짜 0뎀 floor 수정. 전투는 결정론 유지(조우만 시드 랜덤) → sim = 스테이지×시드 trial 분포. 엔진 테스트는 `tests/_fixtures.js`로 밸런스 데이터 디커플. 테스트 54→**71**. (밸런스 수치 placeholder — 시뮬상 3유닛 파티가 S4+ 전멸, 튜닝 대상.)
- **step3b — 몹 트레잇 = 범용 규칙엔진.** 트레잇 = 선언적 규칙 `{trigger, cond, op, value, priority, exclusive}`. 인터프리터 `applyRules`가 priority 오름차순 파이프라인 적용(mult/add 변환, heal/reflect side-effect, exclusive 중단). 어휘 전체(3 trigger·4 op·2 cond) 구현 + §7.2 5종 정의, **라이브 부착 = 근접회피(가시거북, 근접 −30%)만**. RPS 레버 작동 확인(sim: 가시거북 vs 원거리 500틱 vs 근접 1334틱; 오우거 광역엔 원거리 패 — 반대 카운터). 결정론·트레잇 없는 몹 거동 불변.
- 테스트 31→**54 통과**. 6-task TDD + task별 2단 리뷰 + reflect 0-클램프 수정 + 최종 전체 리뷰.
- **step3a — 스킬 골격.** 평타를 스킬로 통일(`SKILLS` 선언적 테이블), 근접/원거리 이진 태그 도입(데이터만 — step3b 근접회피가 소비), phys/magic `type` 제거. 엔진 행동 분기 `role` → `skill.kind`(`selectSkill(u)=u.skills[0]`). 기존 전투 거동·결정론 불변(base 대비 sim 출력 char-identical로 검증).
- 테스트 25→**31 통과**. 4-task TDD + task별 2단 리뷰(spec 준수 / 코드 품질) + 최종 전체 리뷰.

## 2026-05-30
- **베이스 ATB 평타 전투 엔진** + 직업5/몹2 데이터 테이블 + 헤드리스 시뮬 + 브라우저 UI 골격 (로드맵 step 1+2).
- 테스트 `node:test` **25 통과**. 어드버서리얼 리뷰(28에이전트) 반영: 라운드 스냅샷 중복 픽스, 광역 로그 적용값 일치, 동시틱=파티우선 의도 확정.
- 데미지 모델: 마법사 방어무시 **제거** → 전 타입 `공격−방어(최소1)` 동일.
- GitHub repo(`SafetyWall/WebGame`) 생성 + 초기 push.
- 문서 분리: 기획/프로그램/아트 → `project-docs/design/`, CLAUDE.md 슬림화. superpowers 임시 산출물 git 제외.
