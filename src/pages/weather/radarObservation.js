const mercator = latitude => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360));

export function radarPixel(bounds, width, height, latitude, longitude) {
  const [[south, west], [north, east]] = bounds;
  const x = Math.floor((longitude - west) / (east - west) * width);
  const y = Math.floor((mercator(north) - mercator(latitude)) / (mercator(north) - mercator(south)) * height);
  return x >= 0 && x < width && y >= 0 && y < height ? [x, y] : null;
}

export function describeEcho(alpha, encoding, legend) {
  if (encoding.missing.includes(alpha)) return '이 지점은 관측 자료가 없어요.';
  if (alpha === encoding.clear) return '이 지점에는 0 dBZ 이상의 강수 신호가 없어요.';
  const index = encoding.echo.indexOf(alpha);
  if (index < 0 || !legend[index]) return '';
  const lower = legend[index].value;
  const next = legend[index + 1];
  const range = next ? `${lower}~${next.value} 미만` : `${lower} 이상`;
  return `이 지점에서 강수 신호가 관측됐어요 (${range} dBZ).`;
}

export function localObservation(display, latitude, longitude) {
  if (!display?.manifest.pixel_alpha || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return '';
  const { image, manifest } = display;
  const pixel = radarPixel(manifest.bounds, image.naturalWidth, image.naturalHeight, latitude, longitude);
  if (!pixel) return '레이더 관측 범위 밖이에요.';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    context.drawImage(image, ...pixel, 1, 1, 0, 0, 1, 1);
    return describeEcho(context.getImageData(0, 0, 1, 1).data[3], manifest.pixel_alpha, manifest.legend);
  } catch {
    return '';
  }
}
