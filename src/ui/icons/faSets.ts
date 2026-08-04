import type { LibraryIcon } from "../../shared/types";
import { FA_ICON_DEFS } from "./fontAwesome";

export function getFaFillIcons(): LibraryIcon[] {
  return FA_ICON_DEFS.map((d) => ({
    id: `${d.id}-fill`,
    name: d.name,
    svg: d.fill,
    source: "fa-fill" as const,
  }));
}

export function getFaLineIcons(): LibraryIcon[] {
  return FA_ICON_DEFS.map((d) => ({
    id: `${d.id}-line`,
    name: d.name,
    svg: d.line,
    source: "fa-line" as const,
  }));
}
