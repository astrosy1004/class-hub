// 선 아이콘 (24×24, stroke = currentColor). icon("home") → <svg>…</svg>
// 오행 아이콘은 ELEMENT_ICONS[오행 순번] 이름으로 쓴다.

const PATHS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  bars: "M5 20V11M12 20V5M19 20v-6",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  bell: "M6 9a6 6 0 1 1 12 0c0 6 3 8 3 8H3s3-2 3-8M10 21h4",
  back: "M15 5l-7 7 7 7",
  next: "M9 5l7 7-7 7",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.5-4.5",
  plus: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v8M8 12h8",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
  coin: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  heart: "M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z",
  briefcase: "M3 8h18v12H3zM9 8V5h6v3M3 13h18",
  sprout: "M12 21v-8M12 13c0-4 3-6.5 7.5-6.5 0 4-3 6.5-7.5 6.5zM12 13c0-3-2.3-5.5-6.5-5.5 0 3 2.3 5.5 6.5 5.5",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z",
  palette: "M12 3a9 9 0 1 0 0 18c1 0 1.6-.8 1.6-1.6 0-1.1-.9-1.4-.9-2.4s.8-1.5 1.9-1.5H17a4 4 0 0 0 4-4C21 6.8 17 3 12 3zM7.5 12h.01M9.5 7.5h.01M14.5 7.5h.01",
  gem: "M7 4h10l4 6-9 10L3 10zM3 10h18M10 4l-2 6 4 10 4-10-2-6",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  book: "M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H20M8 7h8",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  table: "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14",
  apps: "M5 5h4v4H5zM15 5h4v4h-4zM5 15h4v4H5zM15 15h4v4h-4z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  leaf: "M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l7-7",
  pulse: "M3 12h4l2-5 4 10 2-5h6",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  // 오행
  wood: "M12 21v-5M12 3l6 8h-3l4 5H5l4-5H6z",
  fire: "M12 21c-3.9 0-7-2.6-7-6.4 0-3.9 3.6-5.9 4-10.1 2.8 1.6 5 4.3 5 7 .9-.8 1.5-2.2 1.6-3.3C17.9 9.9 19 12.4 19 14.6c0 3.8-3.1 6.4-7 6.4z",
  earth: "M2.5 19 9 8.5l4 6 3-4 5.5 8.5z",
  metal: "M7 4h10l4 6-9 10L3 10zM3 10h18",
  water: "M12 3.5s6 6.8 6 10.8a6 6 0 0 1-12 0c0-4 6-10.8 6-10.8z",
};

export const ELEMENT_ICONS = ["wood", "fire", "earth", "metal", "water"];

export function icon(name, extra = "") {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}><path d="${PATHS[name]}"/></svg>`;
}
