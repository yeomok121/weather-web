// 공통: 화면 오른쪽 아래 알림 메시지 상태
import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState({ visible: false, message: '' });
  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => { setToast({ visible: false, message: '' }); }, 3000);
  };
  return { toast, showToast };
}
