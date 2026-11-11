// 공통: 현재 날씨(맑음·구름·비·눈, 낮·밤)에 따라 바뀌는 배경
const WeatherBackground = ({ theme }) => {
  const isRain = theme === 'rain';
  const isSnow = theme === 'snow';

  return (
    <div className={`weather-bg ${theme}`} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, transition: 'background 1.5s ease' }}>
      {isRain && (
        <div className="rain-container">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="rain-drop" style={{ left: `${((i * 47 + 13) % 100)}%`, animationDuration: `${0.5 + ((i * 7 % 10) / 20)}s`, animationDelay: `${((i * 7 % 10) / 10)}s` }}></div>
          ))}
        </div>
      )}
      {isSnow && (
        <div className="snow-container">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="snow-flake" style={{ left: `${((i * 47 + 13) % 100)}%`, animationDuration: `${4 + ((i * 7 % 10) / 2)}s`, animationDelay: `${((i * 7 % 10) * 0.3)}s` }}></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeatherBackground;
