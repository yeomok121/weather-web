// 커뮤니티 사진: 올리기 전에 브라우저에서 긴 변 1280px JPEG로 줄입니다. (휴대폰 원본 5~10MB → 수백 KB)
// 캔버스로 다시 그리기 때문에 위치정보(EXIF)가 이 단계에서 이미 빠지고, 서버에서도 한 번 더 지웁니다.
export const PHOTO_MAX_EDGE = 1280;

export async function resizePhoto(file, { maxEdge = PHOTO_MAX_EDGE, quality = 0.82 } = {}) {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type || '') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || '')) {
    throw new Error('JPG·PNG·WEBP 사진만 올릴 수 있어요.');
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); // 세로 사진 방향 유지
  } catch {
    throw new Error('사진을 읽지 못했어요. 다른 사진으로 해 보세요. (아이폰 HEIC는 설정에서 \'높은 호환성\'으로 찍으면 돼요)');
  }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', quality);
}
