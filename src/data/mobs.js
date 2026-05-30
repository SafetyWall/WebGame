// 수치 placeholder. aoe=true면 광역(전체 atk*aoeRatio), 아니면 단일.
export const MOBS = {
  slime: { name: '슬라임', hp: 200, atk: 18, def: 3, spd: 8, aoe: false },
  ogre:  { name: '오우거', hp: 400, atk: 28, def: 6, spd: 6, aoe: true, aoeRatio: 0.6 },
}
