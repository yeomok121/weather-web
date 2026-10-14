import React, { useState } from 'react';

function AddRegionModal({ onClose, onAddRegion, isAiLoading }) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (input.trim() === '') return;
    onAddRegion(input.trim());
  };

  const inputStyle = {
    width: '100%', padding: '12px', marginBottom: '15px',
    border: '1px solid #e2e8f0', borderRadius: '6px',
    backgroundColor: '#f1f5f9', color: '#333', boxSizing: 'border-box'
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: '#333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>새 관심 지역 추가</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
        </div>
        
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>추가하고 싶은 지역의 이름을 입력하세요.</p>
        
        <input 
          type="text" 
          placeholder="예: 서울, 부산, 강릉" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={inputStyle} 
        />
        
        <button 
          onClick={handleAdd}
          disabled={isAiLoading}
          style={{ width: '100%', padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: isAiLoading ? 'default' : 'pointer', fontWeight: 'bold', opacity: isAiLoading ? 0.6 : 1 }}
        >
          {isAiLoading ? '검색 중...' : '추가하기'}
        </button>
      </div>
    </div>
  );
}

export default AddRegionModal;