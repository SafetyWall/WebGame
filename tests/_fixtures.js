// 엔진 동작 테스트용 고정 몹 스펙(밸런스 데이터와 디커플). makeMob이 먹는 평면 형태.
// 스탯은 과거 MOBS 값과 동일 — 어서션 보존용. 프로덕션 몹 데이터는 src/data/monsters.js.
export const SLIME  = { name: '슬라임',   hp: 200, atk: 18, def: 3, spd: 8, aoe: false }
export const OGRE   = { name: '오우거',   hp: 400, atk: 28, def: 6, spd: 6, aoe: true, aoeRatio: 0.6 }
export const TURTLE = { name: '가시거북', hp: 280, atk: 20, def: 8, spd: 6, aoe: false }
