// 전역 레벨 성장 커브. 몹스탯(L) = levelCurve(L) × 몹.mul. 수치 placeholder(시뮬 튜닝).
export function levelCurve(L) {
  return {
    hp:  Math.round(180 * Math.pow(1.15, L - 1)),
    atk: Math.round(16  * Math.pow(1.10, L - 1)),
    def: Math.round(3   * Math.pow(1.10, L - 1)),
    spd: 90, // 100-스케일(속도 100=1초/턴). 레벨 불변(속도=몹 개성=mul로). ×mul → 실제 몹 속도.
  }
}
