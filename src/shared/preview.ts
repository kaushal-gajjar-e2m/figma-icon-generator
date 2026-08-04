import type { LibraryIcon, TemplateSnapshot } from "./types";

export function rgbToCss(
  c: { r: number; g: number; b: number },
  a = 1
): string {
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(
    c.b * 255
  )}, ${a})`;
}

export function getTemplateFill(template: TemplateSnapshot): string {
  const paint = template.fills.find((f) => f.visible);
  if (!paint) return "rgb(240, 240, 240)";
  return rgbToCss(paint.color, paint.opacity);
}

export function getTemplateStroke(template: TemplateSnapshot): {
  color: string;
  width: number;
} | null {
  const paint = template.strokes.find((s) => s.visible);
  if (!paint || template.strokeWeight <= 0) return null;
  return {
    color: rgbToCss(paint.color, paint.opacity),
    width: template.strokeWeight,
  };
}

export function getTemplateShadow(template: TemplateSnapshot): string {
  const shadows = template.effects.filter(
    (e) =>
      (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") &&
      e.visible !== false
  );
  if (shadows.length === 0) return "none";
  return shadows
    .map((e) => {
      if (e.type !== "DROP_SHADOW" && e.type !== "INNER_SHADOW") return "";
      const inset = e.type === "INNER_SHADOW" ? "inset " : "";
      return `${inset}${e.offset.x}px ${e.offset.y}px ${e.radius}px ${e.spread}px ${rgbToCss(
        e.color,
        e.color.a
      )}`;
    })
    .filter(Boolean)
    .join(", ");
}

export function getIconColor(template: TemplateSnapshot): string {
  if (template.iconColor) {
    return rgbToCss(template.iconColor, template.iconOpacity);
  }
  return "rgb(30, 30, 30)";
}

function extractSvgInner(svg: string): { inner: string; vbW: number; vbH: number } {
  const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/i);
  let vbW = 24;
  let vbH = 24;
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4) {
      vbW = parts[2] || 24;
      vbH = parts[3] || 24;
    }
  }

  const inner = svg
    .replace(/<\?xml[\s\S]*?\?>/i, "")
    .replace(/<!DOCTYPE[\s\S]*?>/i, "")
    .replace(/<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();

  return { inner, vbW, vbH };
}

function tintSvgInner(inner: string, color: string): string {
  let out = inner
    .replace(/\bfill=["']currentColor["']/gi, `fill="${color}"`)
    .replace(/\bstroke=["']currentColor["']/gi, `stroke="${color}"`)
    .replace(/\bfill=["'](?!none)[^"']*["']/gi, `fill="${color}"`)
    .replace(/\bstroke=["'](?!none)[^"']*["']/gi, `stroke="${color}"`);

  if (!/\b(fill|stroke)=/i.test(out)) {
    out = `<g fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${out}</g>`;
  }
  return out;
}

/** Standalone glyph SVG (no container) for CSS-based preview cards */
export function buildGlyphSvg(
  template: TemplateSnapshot,
  icon: LibraryIcon
): string {
  const color = getIconColor(template);
  const { inner, vbW, vbH } = extractSvgInner(icon.svg);
  const tinted = tintSvgInner(inner, color);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" width="100%" height="100%" fill="none">${tinted}</svg>`;
}

/** Full composite SVG — used by plugin-side fallback */
export function buildPreviewSvg(
  template: TemplateSnapshot,
  icon: LibraryIcon
): string {
  const w = template.width;
  const h = template.height;
  const fill = getTemplateFill(template);
  const stroke = getTemplateStroke(template);
  const r = Math.min(
    template.topLeftRadius,
    template.topRightRadius,
    template.bottomLeftRadius,
    template.bottomRightRadius
  );
  const iconW = Math.max(1, template.iconSize.width);
  const iconH = Math.max(1, template.iconSize.height);
  const iconX = Math.max(0, template.padding.left);
  const iconY = Math.max(0, template.padding.top);
  const color = getIconColor(template);
  const { inner, vbW, vbH } = extractSvgInner(icon.svg);
  const tinted = tintSvgInner(inner, color);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}" ${
    stroke
      ? `stroke="${stroke.color}" stroke-width="${stroke.width}"`
      : 'stroke="none"'
  }/><svg x="${iconX}" y="${iconY}" width="${iconW}" height="${iconH}" viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet">${tinted}</svg></svg>`;
}

export function buildPreviews(
  template: TemplateSnapshot,
  icons: LibraryIcon[]
) {
  return icons.map((icon) => ({
    id: `prev_${icon.id}`,
    name: icon.name,
    iconId: icon.id,
    previewSvg: buildPreviewSvg(template, icon),
  }));
}

