export function getTagTextColor(backgroundColor: string): string {
  const hex = backgroundColor.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '#000000';

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red) + (0.587 * green) + (0.114 * blue);
  return luminance > 160 ? '#000000' : '#ffffff';
}
