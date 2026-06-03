// 미니 컴포넌트 베이스(DOM 글루). el 소유, render(state)->html 문자열 → innerHTML 교체(자기 서브트리만).
// update(el,state) 제공 시 타깃 패치(영속 요소 갱신) — 미래 애니메이션/전투 재생 seam. 현재 미사용.
export function createComponent({ render, update }) {
  let mounted = false
  return {
    el: null,
    mount(el) { this.el = el; return this },
    sync(state) {
      if (update && mounted) update(this.el, state)
      else this.el.innerHTML = render(state)
      mounted = true
    },
  }
}
