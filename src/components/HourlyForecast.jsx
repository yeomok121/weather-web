import React, { useState, useEffect } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

const ITEMS_TO_SHOW = 6;
const EMPTY_HOURLY = [];

function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function ForecastIcon({ code, description }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [code]);

  if (!code || hasError) {
    return (
      <span
        style={{
          fontSize: '11px',
          color: '#999',
          textAlign: 'center',
        }}
      >
        아이콘 없음
      </span>
    );
  }

  return (
    <img
      src={`https://openweathermap.org/img/wn/${code}@2x.png`}
      width={40}
      height={40}
      alt={description || '날씨 아이콘'}
      onError={() => setHasError(true)}
      style={{ display: 'block' }}
    />
  );
}

function HourlyForecast({
  hourlyData = EMPTY_HOURLY,
  isLoading = false,
  error = '',
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [hourlyData]);

  const forecastData = Array.isArray(hourlyData)
    ? hourlyData
        .filter(
          (item) =>
            item &&
            typeof item === 'object'
        )
        .map((item, index) => {
          const temp = toNumber(item.temp);
          const pop = toNumber(item.pop);

          return {
            id: index,
            // 첫 번째 예보도 실제 예보 시간을 표시합니다.
            time: item.time || '시간 없음',
            icon: item.icon,
            description: item.description,
            temp:
              temp === null
                ? '정보 없음'
                : `${Math.round(temp)}°`,
            // 기존 코드와 동일하게 pop은 0~1 범위로 처리합니다.
            pop:
              pop === null
                ? null
                : Math.round(
                    Math.max(0, Math.min(1, pop)) * 100
                  ),
          };
        })
    : [];

  const maxIndex = Math.max(
    0,
    forecastData.length - ITEMS_TO_SHOW
  );

  const visibleIndex = Math.min(currentIndex, maxIndex);

  const handlePrev = () => {
    setCurrentIndex(
      Math.max(0, visibleIndex - ITEMS_TO_SHOW)
    );
  };

  const handleNext = () => {
    setCurrentIndex(
      Math.min(
        maxIndex,
        visibleIndex + ITEMS_TO_SHOW
      )
    );
  };

  const prevDisabled =
    isLoading || visibleIndex === 0;

  const nextDisabled =
    isLoading || visibleIndex >= maxIndex;

  const buttonStyle = {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#333',
    transition: 'background-color 0.2s',
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        color: '#333',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
          gap: '10px',
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: '14px',
          }}
        >
          시간대별 예보
        </h4>

        <div
          style={{
            display: 'flex',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={handlePrev}
            disabled={prevDisabled}
            aria-label="이전 예보"
            style={{
              ...buttonStyle,
              opacity: prevDisabled ? 0.3 : 1,
              cursor: prevDisabled
                ? 'default'
                : 'pointer',
            }}
          >
            <FiChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={nextDisabled}
            aria-label="다음 예보"
            style={{
              ...buttonStyle,
              opacity: nextDisabled ? 0.3 : 1,
              cursor: nextDisabled
                ? 'default'
                : 'pointer',
            }}
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p
          style={{
            margin: '10px 0',
            fontSize: '14px',
            color: '#666',
          }}
        >
          시간대별 예보를 불러오는 중입니다...
        </p>
      ) : error ? (
        <p
          role="alert"
          style={{
            margin: '10px 0',
            fontSize: '14px',
            color: '#dc2626',
          }}
        >
          {error}
        </p>
      ) : forecastData.length === 0 ? (
        <p
          style={{
            margin: '10px 0',
            fontSize: '14px',
            color: '#666',
          }}
        >
          시간대별 예보 데이터가 없습니다.
        </p>
      ) : (
        <div
          style={{
            overflow: 'hidden',
            width: '100%',
            padding: '5px 0',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              transition:
                'transform 0.4s ease-in-out',
              transform: `translateX(-${
                visibleIndex *
                (100 / ITEMS_TO_SHOW)
              }%)`,
            }}
          >
            {forecastData.map((item) => (
              <div
                key={item.id}
                style={{
                  flex: `0 0 ${
                    100 / ITEMS_TO_SHOW
                  }%`,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0 5px',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    border: '1px solid #eee',
                    borderRadius: '10px',
                    padding: '10px 0',
                    width: '100%',
                    minHeight: '135px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '8px',
                      textAlign: 'center',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {item.time}
                  </span>

                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ForecastIcon
                      code={item.icon}
                      description={item.description}
                    />
                  </div>

                  <span
                    style={{
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                  >
                    {item.temp}
                  </span>

                  {item.pop !== null && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#3182ce',
                        marginTop: '4px',
                      }}
                    >
                      💧{item.pop}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HourlyForecast;
