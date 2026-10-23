// 로컬 개발 땐 .env의 VITE_API_URL, 없으면 배포 서버 주소를 사용합니다.
export const API = import.meta.env.VITE_API_URL || 'https://weather-backend-api-goor.onrender.com';
