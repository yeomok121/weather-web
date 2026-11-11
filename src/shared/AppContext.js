// 공통: App.jsx가 만든 상태와 동작을 각 페이지에 전달하는 통로입니다.
// 페이지에서는 const app = useApp(); 으로 꺼내 씁니다.
import { createContext, useContext } from 'react';

export const AppContext = createContext(null);

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp()은 <AppContext.Provider> 안에서만 사용할 수 있습니다.');
  return value;
}
