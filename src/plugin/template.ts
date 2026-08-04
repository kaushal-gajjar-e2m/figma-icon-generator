import type {
  EffectData,
  RGB,
  SolidPaintData,
  TemplateSnapshot,
} from "../shared/types";
import { exportTemplateThumbnail, readGlyphMeta } from "./generator";

const STORAGE_ACTIVE = "activeTemplate";
const STORAGE_SAVED = "savedTemplates";

function isSolidPaint(paint: Paint): paint is SolidPaint {
  return paint.type === "SOLID";
}

function serializeFills(paints: ReadonlyArray<Paint>): SolidPaintData[] {
  return paints.filter(isSolidPaint).map((p) => ({
    type: "SOLID",
    color: { r: p.color.r, g: p.color.g, b: p.color.b },
    opacity: p.opacity ?? 1,
    visible: p.visible !== false,
  }));
}

function serializeEffects(effects: ReadonlyArray<Effect>): EffectData[] {
  const out: EffectData[] = [];
  for (const e of effects) {
    if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
      out.push({
        type: e.type,
        color: {
          r: e.color.r,
          g: e.color.g,
          b: e.color.b,
          a: e.color.a,
        },
        offset: { x: e.offset.x, y: e.offset.y },
        radius: e.radius,
        spread: "spread" in e && typeof e.spread === "number" ? e.spread : 0,
        visible: e.visible !== false,
      });
    } else if (e.type === "LAYER_BLUR" || e.type === "BACKGROUND_BLUR") {
      out.push({
        type: e.type,
        radius: e.radius,
        visible: e.visible !== false,
      });
    }
  }
  return out;
}

function inferShapeHint(
  width: number,
  height: number,
  cornerRadius: number
): TemplateSnapshot["shapeHint"] {
  const isSquare = Math.abs(width - height) < 1;
  const maxR = Math.min(width, height) / 2;
  if (isSquare && cornerRadius >= maxR - 0.5) return "circle";
  if (isSquare && cornerRadius > 0) return "rounded-square";
  if (isSquare) return "square";
  if (cornerRadius > 0) return "rounded-rectangle";
  return "rectangle";
}

function hasGeometry(node: SceneNode): boolean {
  return (
    node.type === "VECTOR" ||
    node.type === "BOOLEAN_OPERATION" ||
    node.type === "STAR" ||
    node.type === "POLYGON" ||
    node.type === "LINE" ||
    node.type === "ELLIPSE" ||
    node.type === "RECTANGLE" ||
    node.type === "TEXT"
  );
}

/** Find a full-bleed background plate (rectangle/ellipse/frame) */
function findBackgroundPlate(
  container: SceneNode & ChildrenMixin
): SceneNode | null {
  for (const child of container.children) {
    const fillsFull =
      Math.abs(child.x) < 2 &&
      Math.abs(child.y) < 2 &&
      Math.abs(child.width - container.width) < 2 &&
      Math.abs(child.height - container.height) < 2;
    if (
      fillsFull &&
      (child.type === "RECTANGLE" ||
        child.type === "ELLIPSE" ||
        child.type === "FRAME" ||
        child.type === "COMPONENT" ||
        child.type === "INSTANCE")
    ) {
      return child;
    }
  }
  return null;
}

function indexPathToChild(
  root: SceneNode & ChildrenMixin,
  target: SceneNode
): number[] | null {
  const walk = (
    parent: SceneNode & ChildrenMixin,
    path: number[]
  ): number[] | null => {
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i];
      const next = [...path, i];
      if (child.id === target.id) return next;
      if ("children" in child) {
        const found = walk(child as SceneNode & ChildrenMixin, next);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(root, []);
}

/** Find the primary icon/glyph child inside a container */
function findIconChild(
  container: SceneNode & ChildrenMixin,
  excludeId?: string
): SceneNode | null {
  const children = container.children.filter((c) => c.id !== excludeId);
  if (children.length === 0) return null;

  const scored = children.map((child) => {
    let score = 0;
    if (hasGeometry(child)) score += 3;
    if (
      "children" in child &&
      (child as ChildrenMixin).children.some((c) => hasGeometry(c))
    ) {
      score += 2;
    }
    const fillsFull =
      Math.abs(child.width - container.width) < 2 &&
      Math.abs(child.height - container.height) < 2;
    if (fillsFull) score -= 4;
    if (child.name.toLowerCase().includes("icon")) score += 2;
    if (
      child.type === "VECTOR" ||
      child.type === "BOOLEAN_OPERATION" ||
      child.type === "GROUP"
    ) {
      score += 1;
    }
    return { child, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].child : children[children.length - 1];
}

function extractIconColor(node: SceneNode): { color: RGB | null; opacity: number } {
  const readPaints = (
    paints: ReadonlyArray<Paint> | PluginAPI["mixed"]
  ): { color: RGB; opacity: number } | null => {
    if (!Array.isArray(paints)) return null;
    const solid = paints.find(
      (p) => p.type === "SOLID" && p.visible !== false
    ) as SolidPaint | undefined;
    if (!solid) return null;
    return {
      color: { r: solid.color.r, g: solid.color.g, b: solid.color.b },
      opacity: solid.opacity ?? 1,
    };
  };

  if ("strokes" in node) {
    const stroke = readPaints(node.strokes);
    if (stroke) return stroke;
  }
  if ("fills" in node) {
    const fill = readPaints(node.fills);
    if (fill) return fill;
  }
  if ("children" in node) {
    for (const child of (node as ChildrenMixin).children) {
      const nested = extractIconColor(child);
      if (nested.color) return nested;
    }
  }
  return { color: null, opacity: 1 };
}

function getCornerRadii(node: SceneNode): {
  cornerRadius: number;
  topLeftRadius: number;
  topRightRadius: number;
  bottomLeftRadius: number;
  bottomRightRadius: number;
} {
  if ("topLeftRadius" in node) {
    const n = node as RectangleNode | FrameNode | ComponentNode | InstanceNode;
    return {
      cornerRadius:
        typeof n.cornerRadius === "number" ? n.cornerRadius : n.topLeftRadius,
      topLeftRadius: n.topLeftRadius,
      topRightRadius: n.topRightRadius,
      bottomLeftRadius: n.bottomLeftRadius,
      bottomRightRadius: n.bottomRightRadius,
    };
  }
  if (
    "cornerRadius" in node &&
    typeof (node as { cornerRadius?: number | symbol }).cornerRadius ===
      "number"
  ) {
    const r = (node as { cornerRadius: number }).cornerRadius;
    return {
      cornerRadius: r,
      topLeftRadius: r,
      topRightRadius: r,
      bottomLeftRadius: r,
      bottomRightRadius: r,
    };
  }
  // Ellipse ≈ circle
  if (node.type === "ELLIPSE") {
    const r = Math.min(node.width, node.height) / 2;
    return {
      cornerRadius: r,
      topLeftRadius: r,
      topRightRadius: r,
      bottomLeftRadius: r,
      bottomRightRadius: r,
    };
  }
  return {
    cornerRadius: 0,
    topLeftRadius: 0,
    topRightRadius: 0,
    bottomLeftRadius: 0,
    bottomRightRadius: 0,
  };
}

function canBeTemplate(node: SceneNode): boolean {
  return (
    node.type === "FRAME" ||
    node.type === "COMPONENT" ||
    node.type === "INSTANCE" ||
    node.type === "GROUP" ||
    node.type === "RECTANGLE" ||
    node.type === "ELLIPSE"
  );
}

export function selectionCanCapture(): {
  canCapture: boolean;
  selectionName: string | null;
} {
  const sel = figma.currentPage.selection;
  if (sel.length !== 1) {
    return { canCapture: false, selectionName: null };
  }
  const node = sel[0];
  return {
    canCapture: canBeTemplate(node),
    selectionName: node.name,
  };
}

export async function captureTemplateFromSelection(): Promise<TemplateSnapshot> {
  const sel = figma.currentPage.selection;
  if (sel.length !== 1) {
    throw new Error("Select a single icon or container to use as a template.");
  }
  const node = sel[0];
  if (!canBeTemplate(node)) {
    throw new Error(
      "Selected layer type is not supported. Choose a Frame, Component, Instance, Group, Rectangle, or Ellipse."
    );
  }

  // Prefer style from the node itself; if empty (common for Groups), use a full-bleed plate child
  let styleSource: SceneNode = node;
  let iconSearchRoot: (SceneNode & ChildrenMixin) | null =
    "children" in node ? (node as SceneNode & ChildrenMixin) : null;

  let fills =
    "fills" in styleSource && Array.isArray(styleSource.fills)
      ? serializeFills(styleSource.fills as Paint[])
      : [];
  let effects =
    "effects" in styleSource && Array.isArray(styleSource.effects)
      ? serializeEffects(styleSource.effects as Effect[])
      : [];
  let corners = getCornerRadii(styleSource);
  let strokes =
    "strokes" in styleSource && Array.isArray(styleSource.strokes)
      ? serializeFills(styleSource.strokes as Paint[])
      : [];
  let strokeWeight =
    "strokeWeight" in styleSource && typeof styleSource.strokeWeight === "number"
      ? styleSource.strokeWeight
      : 0;

  let backgroundPlate: SceneNode | null = null;
  if (
    iconSearchRoot &&
    (fills.length === 0 || fills.every((f) => !f.visible))
  ) {
    backgroundPlate = findBackgroundPlate(iconSearchRoot);
    if (backgroundPlate) {
      styleSource = backgroundPlate;
      fills =
        "fills" in styleSource && Array.isArray(styleSource.fills)
          ? serializeFills(styleSource.fills as Paint[])
          : fills;
      effects =
        "effects" in styleSource && Array.isArray(styleSource.effects)
          ? serializeEffects(styleSource.effects as Effect[])
          : effects;
      corners = getCornerRadii(styleSource);
      strokes =
        "strokes" in styleSource && Array.isArray(styleSource.strokes)
          ? serializeFills(styleSource.strokes as Paint[])
          : strokes;
      strokeWeight =
        "strokeWeight" in styleSource &&
        typeof styleSource.strokeWeight === "number"
          ? styleSource.strokeWeight
          : strokeWeight;
    }
  }

  // Effects often live on the outer frame even when fill is on a child
  if (
    effects.length === 0 &&
    "effects" in node &&
    Array.isArray(node.effects)
  ) {
    effects = serializeEffects(node.effects as Effect[]);
  }

  let padding = { top: 0, right: 0, bottom: 0, left: 0 };
  let iconSize = { width: node.width * 0.5, height: node.height * 0.5 };
  let iconColor: RGB | null = null;
  let iconOpacity = 1;
  let iconChildPath: number[] | null = null;
  let glyphMeta: TemplateSnapshot["glyphMeta"] = null;

  if (iconSearchRoot && iconSearchRoot.children.length > 0) {
    const iconNode = findIconChild(iconSearchRoot, backgroundPlate?.id);
    if (iconNode) {
      iconChildPath = indexPathToChild(iconSearchRoot, iconNode);
      glyphMeta = readGlyphMeta(iconNode);
      padding = {
        top: Math.max(0, iconNode.y),
        left: Math.max(0, iconNode.x),
        right: Math.max(0, node.width - (iconNode.x + iconNode.width)),
        bottom: Math.max(0, node.height - (iconNode.y + iconNode.height)),
      };
      iconSize = { width: iconNode.width, height: iconNode.height };
      const colorInfo = extractIconColor(iconNode);
      iconColor = colorInfo.color;
      iconOpacity = colorInfo.opacity;
    }
  } else {
    const pad = Math.round(Math.min(node.width, node.height) * 0.25);
    padding = { top: pad, right: pad, bottom: pad, left: pad };
    iconSize = {
      width: node.width - pad * 2,
      height: node.height - pad * 2,
    };
    glyphMeta = {
      name: "icon",
      x: pad,
      y: pad,
      width: iconSize.width,
      height: iconSize.height,
      rotation: 0,
      opacity: 1,
      blendMode: "PASS_THROUGH",
      constraints: { horizontal: "CENTER", vertical: "CENTER" },
      layoutAlign: "CENTER",
      layoutGrow: 0,
      layoutPositioning: "ABSOLUTE",
      layoutSizingHorizontal: "FIXED",
      layoutSizingVertical: "FIXED",
    };
  }

  // Sensible defaults when padding collapses (bad icon detection)
  const minPad = Math.round(Math.min(node.width, node.height) * 0.18);
  if (
    padding.top + padding.bottom >= node.height - 1 ||
    padding.left + padding.right >= node.width - 1 ||
    iconSize.width < 2 ||
    iconSize.height < 2
  ) {
    padding = { top: minPad, right: minPad, bottom: minPad, left: minPad };
    iconSize = {
      width: node.width - minPad * 2,
      height: node.height - minPad * 2,
    };
  }

  if (fills.length === 0) {
    fills = [
      {
        type: "SOLID",
        color: { r: 0.92, g: 0.92, b: 0.94 },
        opacity: 1,
        visible: true,
      },
    ];
  }

  let thumbnail: string | null = null;
  try {
    thumbnail = await exportTemplateThumbnail(node);
  } catch {
    thumbnail = null;
  }

  const snapshot: TemplateSnapshot = {
    id: `tpl_${Date.now()}`,
    name: node.name,
    savedAt: Date.now(),
    sourceNodeId: node.id,
    iconChildPath,
    thumbnail,
    width: node.width,
    height: node.height,
    ...corners,
    fills,
    strokes,
    strokeWeight,
    effects,
    padding,
    iconSize,
    glyphMeta,
    iconColor,
    iconOpacity,
    shapeHint: inferShapeHint(node.width, node.height, corners.cornerRadius),
    sourceType: node.type,
  };

  return snapshot;
}

function normalizeTemplate(data: unknown): TemplateSnapshot | null {
  if (!data || typeof data !== "object") return null;
  const t = data as Partial<TemplateSnapshot>;
  if (!t.width || !t.height) return null;
  return {
    ...(t as TemplateSnapshot),
    sourceNodeId: t.sourceNodeId ?? null,
    iconChildPath: t.iconChildPath ?? null,
    thumbnail: t.thumbnail ?? null,
    glyphMeta: t.glyphMeta ?? null,
  };
}

export async function loadActiveTemplate(): Promise<TemplateSnapshot | null> {
  const data = await figma.clientStorage.getAsync(STORAGE_ACTIVE);
  return normalizeTemplate(data);
}

export async function saveActiveTemplate(
  template: TemplateSnapshot | null
): Promise<void> {
  await figma.clientStorage.setAsync(STORAGE_ACTIVE, template);
}

export async function loadSavedTemplates(): Promise<TemplateSnapshot[]> {
  const data = await figma.clientStorage.getAsync(STORAGE_SAVED);
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => normalizeTemplate(item))
    .filter((t): t is TemplateSnapshot => t !== null);
}

export async function persistSavedTemplates(
  templates: TemplateSnapshot[]
): Promise<void> {
  await figma.clientStorage.setAsync(STORAGE_SAVED, templates);
}

export async function saveNamedTemplate(
  template: TemplateSnapshot,
  name: string
): Promise<TemplateSnapshot[]> {
  const saved = await loadSavedTemplates();
  const named: TemplateSnapshot = {
    ...template,
    id: `saved_${Date.now()}`,
    name: name.trim() || template.name,
    savedAt: Date.now(),
  };
  const next = [named, ...saved].slice(0, 20);
  await persistSavedTemplates(next);
  await saveActiveTemplate(named);
  return next;
}

export async function deleteNamedTemplate(
  id: string
): Promise<{ saved: TemplateSnapshot[]; active: TemplateSnapshot | null }> {
  const saved = await loadSavedTemplates();
  const next = saved.filter((t) => t.id !== id);
  await persistSavedTemplates(next);
  const active = await loadActiveTemplate();
  if (active?.id === id) {
    await saveActiveTemplate(null);
    return { saved: next, active: null };
  }
  return { saved: next, active };
}
