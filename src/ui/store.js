// 중앙 상태 + 구독(순수, DOM-free → node 테스트 가능). 컴포넌트가 subscribe, dispatch/setUi가 통지.
// state = { run: RunState(engine/run.js), ui: { layout, modal, tooltip, ... } }
export function createStore(initial) {
  let state = initial
  const subs = new Set()
  const notify = () => { for (const f of subs) f(state) }
  return {
    getState: () => state,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn) },
    // run 액션 thunk(run => run'). run.js 순수 액션을 위임. 참조 변경(실제 변경) 시만 통지.
    dispatch(fn) {
      const nextRun = fn(state.run)
      if (nextRun !== state.run) { state = { ...state, run: nextRun }; notify() }
      return state
    },
    // UI 상태 부분 갱신(layout 토글·모달 열닫·툴팁 등). 항상 통지.
    setUi(patch) {
      state = { ...state, ui: { ...state.ui, ...patch } }
      notify()
      return state
    },
  }
}
