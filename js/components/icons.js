// ============================================================
//  Inline SVG icon set (stroke style). All markup is static.
// ============================================================
// width/height act as a 20px default; CSS in sized contexts (.btn, .nav, …) overrides.
const S = (paths, opts = "") =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${opts}>${paths}</svg>`;

export const ICONS = {
  today: S('<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>'),
  flame: S('<path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.4-2 1-2.8C8.7 9.8 9 8.2 12 3Z"/>'),
  log: S('<path d="M12 5v14"/><path d="M5 12h14"/>'),
  dumbbell: S('<path d="M6.5 6.5 17.5 17.5"/><path d="m3 7 4-4 3 3-4 4z"/><path d="m14 18 4-4 3 3-4 4z" transform="translate(-4 -4)"/><rect x="2.2" y="5.2" width="4" height="6" rx="1" transform="rotate(-45 4.2 8.2)"/><rect x="17.8" y="12.8" width="4" height="6" rx="1" transform="rotate(-45 19.8 15.8)"/>'),
  library: S('<rect x="3" y="4" width="7" height="7" rx="1.5"/><rect x="14" y="4" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="6" rx="1.5"/><rect x="14" y="14" width="7" height="6" rx="1.5"/>'),
  body: S('<circle cx="12" cy="6" r="3"/><path d="M12 9v8"/><path d="M8 12h8"/><path d="M9 21l3-4 3 4"/>'),
  progress: S('<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 14 3-3 3 2 5-6"/>'),
  settings: S('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.2A1.6 1.6 0 0 0 6.6 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13.6H3a2 2 0 1 1 0-4h.2A1.6 1.6 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2A1.6 1.6 0 0 0 18 4.6l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z"/>'),
  search: S('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  plus: S('<path d="M12 5v14"/><path d="M5 12h14"/>'),
  minus: S('<path d="M5 12h14"/>'),
  check: S('<path d="M20 6 9 17l-5-5"/>'),
  checkCircle: S('<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5L16 9"/>'),
  close: S('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  trash: S('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>'),
  chevron: S('<path d="m9 18 6-6-6-6"/>'),
  chevronDown: S('<path d="m6 9 6 6 6-6"/>'),
  edit: S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  timer: S('<circle cx="12" cy="13" r="8"/><path d="M12 13V9"/><path d="M9 2h6"/>'),
  bolt: S('<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="currentColor" stroke="none"/>'),
  trophy: S('<path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a3 3 0 0 0 3 3"/><path d="M17 6h3v2a3 3 0 0 1-3 3"/><path d="M9 16h6"/><path d="M12 13v3"/><path d="M8 20h8"/><path d="M10 16v4"/><path d="M14 16v4"/>'),
  calendar: S('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/>'),
  info: S('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>'),
  play: S('<path d="M7 4v16l13-8z" fill="currentColor" stroke="none"/>'),
  flag: S('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'),
  download: S('<path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>'),
  upload: S('<path d="M12 20V9"/><path d="m7 13 5-5 5 5"/><path d="M5 4h14"/>'),
  arrowUp: S('<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>'),
  arrowDown: S('<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>'),
  ruler: S('<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3"/><path d="M11 8v4"/><path d="M15 8v3"/><path d="M19 8v4" transform="translate(-1 0)"/>'),
  weight: S('<circle cx="12" cy="8" r="3"/><path d="M7 21 9 11h6l2 10z"/>'),
  list: S('<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>'),
  fire: S('<path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.4-2 1-2.8C8.7 9.8 9 8.2 12 3Z" fill="currentColor" stroke="none"/>'),
  clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  sun: S('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>'),
  moon: S('<path d="M21 12.8A8 8 0 1 1 11.2 3 6 6 0 0 0 21 12.8Z"/>'),
};

export const icon = (name) => ICONS[name] || ICONS.info;
