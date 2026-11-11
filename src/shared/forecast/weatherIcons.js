export const getEmojiIcon = (code) => {
  if (!code) return '☁️';
  if (code.includes('01d')) return '☀️';
  if (code.includes('01n')) return '🌙';
  if (code.includes('02d') || code.includes('03d')) return '⛅';
  if (code.includes('02n') || code.includes('03n')) return '☁️';
  if (code.includes('04')) return '☁️';
  if (code.includes('09') || code.includes('10')) return '🌧️';
  if (code.includes('11')) return '⛈️';
  if (code.includes('13')) return '❄️';
  if (code.includes('50')) return '🌫️';
  return '☁️';
};
