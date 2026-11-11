// 공통: 화면 오른쪽 아래에 3초 동안 뜨는 알림 메시지
import { FiCheckCircle } from 'react-icons/fi';

export default function Toast({ toast }) {
  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, backgroundColor: '#166534', color: 'white', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '14px', transform: toast.visible ? 'translateY(0)' : 'translateY(100px)', opacity: toast.visible ? 1 : 0, transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}>
      <FiCheckCircle size={18} /> {toast.message}
    </div>
  );
}
