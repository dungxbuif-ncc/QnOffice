const COLORS = {
  AQUA: '#1ABC9C',
  DARK_AQUA: '#11806A',
  GREEN: '#57F287',
  DARK_GREEN: '#1F8B4C',
  BLUE: '#3498DB',
  DARK_BLUE: '#206694',
  PURPLE: '#9B59B6',
  DARK_PURPLE: '#71368A',
  LUMINOUS_VIVID_PINK: '#E91E63',
  DARK_VIVID_PINK: '#AD1457',
  GOLD: '#F1C40F',
  DARK_GOLD: '#C27C0E',
  ORANGE: '#E67E22',
  DARK_ORANGE: '#A84300',
  RED: '#ED4245',
  DARK_RED: '#992D22',
  LIGHT_GREY: '#BCC0C0',
  YELLOW: '#FFFF00',
};
export function getRandomColor(): string {
  const colors = Object.values(COLORS);
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex] || '#F1C40F';
}

export function isUserId(str: string): boolean {
  return /^\d+$/.test(str);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatOfficeCode(str: string): string {
  return str.replace('*', '').toUpperCase();
}
