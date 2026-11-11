# 프론트엔드 폴더 구조와 담당 영역

페이지별로 폴더를 나눴습니다. 자기 담당 폴더만 고치면 다른 팀원과 충돌이 거의 나지 않습니다.

| 페이지 | 주소 | 담당 폴더 |
|---|---|---|
| 날씨 | `/` | `src/pages/weather/` |
| 산악 | `/mountain`, `/mountain/북한산` | `src/pages/mountain/` |
| 낚시 | `/fishing` | `src/pages/fishing/` |
| 관리자 | `/admin` | `src/pages/admin/` |

```
src/
├── App.jsx              앱 뼈대: 공통 상태, 상단 메뉴·푸터·팝업, 페이지 주소(Route) 연결
├── main.jsx             시작 파일 (라우터 연결, 예전 /?mountain= 주소 변환)
├── pages/
│   ├── weather/         WeatherPage, AddRegionModal(관심 지역 추가), regions.js(검색용 시·군 목록)
│   ├── mountain/        MountainPage, mountains.js(기본 산·코스 목록), useMountainCatalog,
│   │                    useHikingPlan(산행 선택값·직접 입력 코스), hikingPlanSummary(일정·위험도 계산),
│   │   ├── components/  산행 계획·파티·코스 입력·일정 비교 등 산악 전용 컴포넌트
│   │   └── lib/         hikingPlan, manualCourse, mountainWindow, solarTimes
│   ├── fishing/         FishingPage
│   └── admin/           AdminRoute(관리자 권한 확인), AdminPage(대시보드)
└── shared/              여러 페이지가 함께 쓰는 공통 영역 (고치기 전에 팀에 먼저 공유)
    ├── AppContext.js    페이지에서 공통 상태를 꺼내 쓰는 useApp()
    ├── layout/          TopNav(검색·메뉴), useSearch, Toast, NoticeModal, 배경, 전체 스타일
    ├── auth/            로그인 카드, 회원가입, 비밀번호 찾기, useAuth, useFavorites(관심 지역)
    ├── forecast/        ForecastLayout(날씨·산악 공통 2단 화면), useForecast(예보 불러오기),
    │                    WeatherMain, HourlyForecast, WeatherDetails, WeeklyForecast, WeatherOutlook
    └── lib/             apiClient(서버 요청), config(서버 주소), forecastCache, browserStorage
```

## 페이지에서 공통 상태 쓰기

```jsx
import { useApp } from '../../shared/AppContext';

export default function MyPanel() {
  const { weatherData, isMountainMode, showToast, loggedInUser } = useApp();
  // ...
}
```

`useApp()`이 주는 값은 `App.jsx` 아래쪽의 `const app = { ... }`에 모여 있습니다.

## 새 페이지를 추가할 때

1. `src/pages/새페이지/새페이지Page.jsx`를 만듭니다.
2. `src/App.jsx`의 `<Routes>`에 `<Route path="/새주소" element={<새페이지Page />} />` 한 줄을 추가합니다.
3. 상단 메뉴에 버튼이 필요하면 `src/shared/layout/TopNav.jsx`에 추가합니다. (공통 파일이므로 팀에 공유)

## 알아둘 점

- `shared/forecast/HourlyForecast.jsx`는 날씨·산악 페이지가 함께 쓰지만, 내용의 대부분이 산악 대시보드입니다.
  산악 기능을 고칠 때 이 파일을 자주 건드리게 되므로, 날씨 담당과 미리 이야기해 주세요.
  (다음 단계로 산악 대시보드 부분을 `pages/mountain/`으로 분리하면 더 편해집니다.)
- Vercel에서 `/mountain` 같은 주소로 새로고침해도 열리도록 `vercel.json`에 모든 주소를 `index.html`로 보내는 설정이 있습니다.

## 실행과 테스트

```bash
npm run dev
npm test
npm run build
npm run lint
```
