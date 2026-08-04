export const BUILTIN_ICONS = [
  {
    id: "cloud",
    name: "Cloud",
    source: "builtin" as const,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M7 18a5 5 0 0 1-.7-9.95A7 7 0 0 1 19.5 10.5 4.5 4.5 0 0 1 18 19H7z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/></svg>`,
  },
  {
    id: "security",
    name: "Security",
    source: "builtin" as const,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M9.5 12.5l1.8 1.8 3.7-3.8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: "server",
    name: "Server",
    source: "builtin" as const,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="6" rx="1.5" stroke="currentColor" stroke-width="1.75"/><rect x="4" y="14" width="16" height="6" rx="1.5" stroke="currentColor" stroke-width="1.75"/><circle cx="8" cy="7" r="1" fill="currentColor"/><circle cx="8" cy="17" r="1" fill="currentColor"/></svg>`,
  },
  {
    id: "network",
    name: "Network",
    source: "builtin" as const,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2.25" stroke="currentColor" stroke-width="1.75"/><circle cx="5" cy="18" r="2.25" stroke="currentColor" stroke-width="1.75"/><circle cx="19" cy="18" r="2.25" stroke="currentColor" stroke-width="1.75"/><path d="M12 7.25v4.5M12 11.75L6.5 16M12 11.75l5.5 4.25" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`,
  },
  {
    id: "backup",
    name: "Backup",
    source: "builtin" as const,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M7 8a5 5 0 0 1 9.9-1A4.5 4.5 0 0 1 18 16H8a4 4 0 0 1-1-7.87" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><path d="M12 11v6m0 0l-2.25-2.25M12 17l2.25-2.25" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: "database",
    name: "Database",
    source: "builtin" as const,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" stroke-width="1.75"/><path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" stroke="currentColor" stroke-width="1.75"/><path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" stroke="currentColor" stroke-width="1.75"/></svg>`,
  },
  {
    id: "api",
    name: "API",
    source: "builtin" as const,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M8 8L4 12l4 4M16 8l4 4-4 4M13 5l-2 14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: "settings",
    name: "Settings",
    source: "builtin" as const,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.75"/><path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.5l1.6 1.55M17.5 16l1.6 1.55M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.55M17.5 8l1.6-1.55" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`,
  },
  {
    id: "user",
    name: "User",
    source: "builtin" as const,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-width="1.75"/><path d="M5.5 19c.8-3.2 3.3-5 6.5-5s5.7 1.8 6.5 5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`,
  },
  {
    id: "chart",
    name: "Chart",
    source: "builtin" as const,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M4 19V5M4 19h16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><path d="M8 15v-4M12 15V8M16 15v-7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`,
  },
  {
    id: "bell",
    name: "Bell",
    source: "builtin" as const,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M6.5 16.5h11l-1.2-1.5V10a4.3 4.3 0 1 0-8.6 0v5l-1.2 1.5z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`,
  },
  {
    id: "folder",
    name: "Folder",
    source: "builtin" as const,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M3.5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h14A1.5 1.5 0 0 0 20.5 18V9.5A1.5 1.5 0 0 0 19 8H11L9.2 5.8A1 1 0 0 0 8.4 5.5H5A1.5 1.5 0 0 0 3.5 7v1.5z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/></svg>`,
  },
];
