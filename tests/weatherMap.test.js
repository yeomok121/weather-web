import test from 'node:test';
import assert from 'node:assert/strict';
import { preferredWeatherLayer, windArrowRotation, windDirectionLabel } from '../src/pages/weather/weatherMap.js';

test('wind arrows show the direction the air travels, with source compass labels', () => {
  assert.equal(windArrowRotation(0), 180);
  assert.equal(windArrowRotation(90), 270);
  assert.equal(windDirectionLabel(270), '서풍');
  assert.equal(windArrowRotation(null), null);
  assert.equal(windDirectionLabel(null), '풍향 자료 없음');
});

test('initial layer waits for usable weather and prefers rain when wet and windy', () => {
  assert.equal(preferredWeatherLayer({ hasData: false }), null);
  assert.equal(preferredWeatherLayer({ hasData: true, condition: '맑음', wind_speed: 7 }), 'wind');
  assert.equal(preferredWeatherLayer({ hasData: true, condition: '비', wind_speed: 12 }), 'rain');
  assert.equal(preferredWeatherLayer({ hasData: true, condition: '맑음', wind_speed: null }), 'rain');
});
