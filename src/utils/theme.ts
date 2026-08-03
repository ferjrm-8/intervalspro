export type AccentColor = 'lime' | 'rose' | 'cyan' | 'amber';

export interface ThemeConfig {
  hex: string;
  text: string;
  bg: string;
  border: string;
  hoverBg: string;
  shadow: string;
  accentText: string;
  accentBg: string;
  label: string;
  fill: string;
  borderHover: string;
}

export const THEMES: Record<AccentColor, ThemeConfig> = {
  lime: {
    hex: '#CCFF00',
    text: 'text-[#CCFF00]',
    bg: 'bg-[#CCFF00]',
    border: 'border-[#CCFF00]',
    borderHover: 'hover:border-[#CCFF00]',
    hoverBg: 'hover:bg-[#b8e600]',
    shadow: 'shadow-[#CCFF00]/10',
    accentText: 'text-[#CCFF00]',
    accentBg: 'bg-[#CCFF00]/10',
    label: 'Limón',
    fill: 'fill-[#CCFF00]',
  },
  rose: {
    hex: '#FF3366',
    text: 'text-[#FF3366]',
    bg: 'bg-[#FF3366]',
    border: 'border-[#FF3366]',
    borderHover: 'hover:border-[#FF3366]',
    hoverBg: 'hover:bg-[#e62e5c]',
    shadow: 'shadow-[#FF3366]/10',
    accentText: 'text-[#FF3366]',
    accentBg: 'bg-[#FF3366]/10',
    label: 'Rojo HIIT',
    fill: 'fill-[#FF3366]',
  },
  cyan: {
    hex: '#33CCFF',
    text: 'text-[#33CCFF]',
    bg: 'bg-[#33CCFF]',
    border: 'border-[#33CCFF]',
    borderHover: 'hover:border-[#33CCFF]',
    hoverBg: 'hover:bg-[#2ebbe6]',
    shadow: 'shadow-[#33CCFF]/10',
    accentText: 'text-[#33CCFF]',
    accentBg: 'bg-[#33CCFF]/10',
    label: 'Cian',
    fill: 'fill-[#33CCFF]',
  },
  amber: {
    hex: '#FF9900',
    text: 'text-[#FF9900]',
    bg: 'bg-[#FF9900]',
    border: 'border-[#FF9900]',
    borderHover: 'hover:border-[#FF9900]',
    hoverBg: 'hover:bg-[#e68a00]',
    shadow: 'shadow-[#FF9900]/10',
    accentText: 'text-[#FF9900]',
    accentBg: 'bg-[#FF9900]/10',
    label: 'Naranja',
    fill: 'fill-[#FF9900]',
  },
};
