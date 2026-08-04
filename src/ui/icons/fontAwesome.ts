/** Shared Font Awesome–style icon pairs: fill (solid) + line (outline). */

export type FaIconDef = {
  id: string;
  name: string;
  fill: string;
  line: string;
};

function svg(inner: string, fillRule = false): string {
  const fillAttr = fillRule ? ' fill="currentColor"' : ' fill="none"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"${fillAttr}>${inner}</svg>`;
}

/** Curated FA-style set — expand via Custom Lib for full client packs */
export const FA_ICON_DEFS: FaIconDef[] = [
  {
    id: "fa-house",
    name: "House",
    fill: svg(
      `<path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"/>`,
      true
    ),
    line: svg(
      `<path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>`
    ),
  },
  {
    id: "fa-user",
    name: "User",
    fill: svg(
      `<path d="M12 12a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5zm0 1.75c-4.2 0-7.75 2.35-7.75 5.25V21h15.5v-2c0-2.9-3.55-5.25-7.75-5.25z"/>`,
      true
    ),
    line: svg(
      `<circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-width="1.75"/><path d="M5.5 19c.8-3.2 3.3-5 6.5-5s5.7 1.8 6.5 5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>`
    ),
  },
  {
    id: "fa-gear",
    name: "Gear",
    fill: svg(
      `<path d="M19.4 13a7.7 7.7 0 0 0 .1-1 7.7 7.7 0 0 0-.1-1l2-1.55-2-3.45-2.4.95a7.4 7.4 0 0 0-1.75-1L15 3h-6l-.35 2.95a7.4 7.4 0 0 0-1.75 1L4.5 6l-2 3.45L4.5 11a7.7 7.7 0 0 0-.1 1 7.7 7.7 0 0 0 .1 1L2.5 14.55l2 3.45 2.4-.95a7.4 7.4 0 0 0 1.75 1L9 21h6l.35-2.95a7.4 7.4 0 0 0 1.75-1l2.4.95 2-3.45L19.4 13zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/>`,
      true
    ),
    line: svg(
      `<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.75"/><path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.5l1.6 1.55M17.5 16l1.6 1.55M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.55M17.5 8l1.6-1.55" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>`
    ),
  },
  {
    id: "fa-cloud",
    name: "Cloud",
    fill: svg(
      `<path d="M6.5 18a5 5 0 0 1-.55-9.95A6.8 6.8 0 0 1 19 10.2 4.3 4.3 0 0 1 18 18H6.5z"/>`,
      true
    ),
    line: svg(
      `<path d="M7 18a5 5 0 0 1-.7-9.95A7 7 0 0 1 19.5 10.5 4.5 4.5 0 0 1 18 19H7z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>`
    ),
  },
  {
    id: "fa-shield",
    name: "Shield",
    fill: svg(
      `<path d="M12 2.5l8 3.2v5.4c0 5-3.4 9.5-8 11.4-4.6-1.9-8-6.4-8-11.4V5.7L12 2.5zm-1.2 12.3l4.9-4.9-1.4-1.4-3.5 3.5-1.6-1.6-1.4 1.4 3 3z"/>`,
      true
    ),
    line: svg(
      `<path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M9.5 12.5l1.8 1.8 3.7-3.8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`
    ),
  },
  {
    id: "fa-server",
    name: "Server",
    fill: svg(
      `<path d="M3.5 4.5h17a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 9V6a1.5 1.5 0 0 1 1.5-1.5zm0 9h17a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18v-3a1.5 1.5 0 0 1 1.5-1.5zM6.5 7.25a1 1 0 1 0 0-.1zm0 9a1 1 0 1 0 0-.1z"/>`,
      true
    ),
    line: svg(
      `<rect x="4" y="4" width="16" height="6" rx="1.5" stroke="currentColor" stroke-width="1.75"/><rect x="4" y="14" width="16" height="6" rx="1.5" stroke="currentColor" stroke-width="1.75"/><circle cx="8" cy="7" r="1" fill="currentColor"/><circle cx="8" cy="17" r="1" fill="currentColor"/>`
    ),
  },
  {
    id: "fa-network",
    name: "Network",
    fill: svg(
      `<path d="M12 2.5a2.75 2.75 0 0 1 1.25 5.2V10h3.5A2.75 2.75 0 1 1 16.75 15H12.5v1.3a2.75 2.75 0 1 1-1 0V15H7.25A2.75 2.75 0 1 1 7.25 10H11V7.7A2.75 2.75 0 0 1 12 2.5z"/>`,
      true
    ),
    line: svg(
      `<circle cx="12" cy="5" r="2.25" stroke="currentColor" stroke-width="1.75"/><circle cx="5" cy="18" r="2.25" stroke="currentColor" stroke-width="1.75"/><circle cx="19" cy="18" r="2.25" stroke="currentColor" stroke-width="1.75"/><path d="M12 7.25v4.5M12 11.75L6.5 16M12 11.75l5.5 4.25" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>`
    ),
  },
  {
    id: "fa-database",
    name: "Database",
    fill: svg(
      `<path d="M12 2c-4.4 0-8 1.6-8 3.5v13C4 20.4 7.6 22 12 22s8-1.6 8-3.5v-13C20 3.6 16.4 2 12 2zm0 2c3.3 0 6 .9 6 1.5S15.3 7 12 7 6 6.1 6 5.5 8.7 4 12 4zm0 14c-3.3 0-6-.9-6-1.5V15c1.3.8 3.5 1.3 6 1.3s4.7-.5 6-1.3v1.5c0 .6-2.7 1.5-6 1.5zm0-4.2c-3.3 0-6-.9-6-1.5V10.8c1.3.8 3.5 1.3 6 1.3s4.7-.5 6-1.3V14.3c0 .6-2.7 1.5-6 1.5z"/>`,
      true
    ),
    line: svg(
      `<ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" stroke-width="1.75"/><path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" stroke="currentColor" stroke-width="1.75"/><path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" stroke="currentColor" stroke-width="1.75"/>`
    ),
  },
  {
    id: "fa-bell",
    name: "Bell",
    fill: svg(
      `<path d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22zm7-5.5V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5.5L3.2 18.3V20h17.6v-1.7L19 16.5z"/>`,
      true
    ),
    line: svg(
      `<path d="M6.5 16.5h11l-1.2-1.5V10a4.3 4.3 0 1 0-8.6 0v5l-1.2 1.5z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>`
    ),
  },
  {
    id: "fa-folder",
    name: "Folder",
    fill: svg(
      `<path d="M10.2 5.5H5A2 2 0 0 0 3 7.5v11A2 2 0 0 0 5 20.5h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-7.2L10.2 5.5z"/>`,
      true
    ),
    line: svg(
      `<path d="M3.5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h14A1.5 1.5 0 0 0 20.5 18V9.5A1.5 1.5 0 0 0 19 8H11L9.2 5.8A1 1 0 0 0 8.4 5.5H5A1.5 1.5 0 0 0 3.5 7v1.5z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>`
    ),
  },
  {
    id: "fa-chart",
    name: "Chart",
    fill: svg(
      `<path d="M4 19V5h2v14H4zm5 0v-8h2v8H9zm5 0V8h2v11h-2zm5 0v-5h2v5h-2z"/>`,
      true
    ),
    line: svg(
      `<path d="M4 19V5M4 19h16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><path d="M8 15v-4M12 15V8M16 15v-7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>`
    ),
  },
  {
    id: "fa-star",
    name: "Star",
    fill: svg(
      `<path d="M12 2.8l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.2l6-.9L12 2.8z"/>`,
      true
    ),
    line: svg(
      `<path d="M12 4l2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 15.2 7.8 17l.8-4.7L5.2 9l4.7-.7L12 4z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>`
    ),
  },
  {
    id: "fa-heart",
    name: "Heart",
    fill: svg(
      `<path d="M12 21s-7.5-4.6-9.7-8.3C.5 9.7 2.2 6 5.6 6c2 0 3.4 1.2 4.4 2.5C11 7.2 12.4 6 14.4 6c3.4 0 5.1 3.7 3.3 6.7C19.5 16.4 12 21 12 21z"/>`,
      true
    ),
    line: svg(
      `<path d="M12 19s-6.5-4.1-8.4-7.2C2.2 9.2 3.6 6.5 6.4 6.5c1.7 0 2.9 1 3.7 2.1.8-1.1 2-2.1 3.7-2.1 2.8 0 4.2 2.7 2.8 5.3C18.5 14.9 12 19 12 19z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>`
    ),
  },
  {
    id: "fa-search",
    name: "Search",
    fill: svg(
      `<path d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm6.4 10.3l4.4 4.4-1.4 1.4-4.4-4.4 1.4-1.4z"/>`,
      true
    ),
    line: svg(
      `<circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.75"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>`
    ),
  },
  {
    id: "fa-lock",
    name: "Lock",
    fill: svg(
      `<path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zM9.5 7a2.5 2.5 0 0 1 5 0v2h-5V7z"/>`,
      true
    ),
    line: svg(
      `<rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.75"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>`
    ),
  },
  {
    id: "fa-envelope",
    name: "Envelope",
    fill: svg(
      `<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11zm1.6.4l7.4 5.2 7.4-5.2-.9-1.2L12 10.5 5.5 5.7l-.9 1.2z"/>`,
      true
    ),
    line: svg(
      `<rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" stroke-width="1.75"/><path d="M4.5 7l7.5 5.5L19.5 7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`
    ),
  },
];
