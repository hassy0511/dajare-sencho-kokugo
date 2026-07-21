export const THEME = {
  ink: '#3d3323',
  cream: '#fff7d0',
  seaDark: '#176b72',
  skyLight: '#eaf6ef',
  coralDark: '#9b3f41',
} as const;

function linearChannel(hexChannel: string): number {
  const value = Number.parseInt(hexChannel, 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(foreground: string, background: string): number {
  const luminance = (color: string): number => {
    const normalized = color.replace('#', '');
    const red = linearChannel(normalized.slice(0, 2));
    const green = linearChannel(normalized.slice(2, 4));
    const blue = linearChannel(normalized.slice(4, 6));
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };

  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
