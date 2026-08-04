import type { LibraryIcon } from "../shared/types";

/** Client-shared icon pack JSON format */
export type IconPackFile = {
  name?: string;
  icons: Array<{
    id?: string;
    name: string;
    svg: string;
  }>;
};

export function parseIconPackJson(text: string): LibraryIcon[] {
  const data = JSON.parse(text) as IconPackFile;
  if (!data || !Array.isArray(data.icons)) {
    throw new Error('Invalid pack: expected { "icons": [ { "name", "svg" } ] }');
  }
  return data.icons
    .filter((i) => i && typeof i.name === "string" && typeof i.svg === "string")
    .map((i, idx) => ({
      id: i.id?.trim() || `pack_${slug(i.name)}_${idx}`,
      name: i.name.trim(),
      svg: normalizeSvg(i.svg),
      source: "custom" as const,
    }));
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "icon";
}

function normalizeSvg(svg: string): string {
  const trimmed = svg.trim();
  if (!trimmed.includes("<svg")) {
    throw new Error(`Icon SVG missing <svg> root`);
  }
  return trimmed;
}

export const ICON_PACK_EXAMPLE = `{
  "name": "Client Icon Pack",
  "icons": [
    {
      "id": "billing",
      "name": "Billing",
      "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\"><path d=\\"M4 7h16v10H4z\\" stroke=\\"currentColor\\" stroke-width=\\"1.75\\"/></svg>"
    }
  ]
}`;
