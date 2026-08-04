import type {
  GeneratedPreview,
  GlyphMeta,
  LibraryIcon,
  TemplateSnapshot,
} from "../shared/types";
import { buildPreviewSvg } from "../shared/preview";

function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  const b64 = figma.base64Encode(bytes);
  return `data:${mime};base64,${b64}`;
}

async function exportPng(node: SceneNode, width = 160): Promise<string> {
  const bytes = await node.exportAsync({
    format: "PNG",
    constraint: { type: "WIDTH", value: width },
  });
  return bytesToDataUrl(bytes, "image/png");
}

function getChildAtPath(root: SceneNode, path: number[]): SceneNode | null {
  let current: SceneNode = root;
  for (const index of path) {
    if (!("children" in current)) return null;
    const kids = (current as ChildrenMixin).children;
    if (index < 0 || index >= kids.length) return null;
    current = kids[index];
  }
  return current;
}

function getParentAndIndex(
  root: SceneNode,
  path: number[]
): { parent: SceneNode & ChildrenMixin; index: number } | null {
  if (path.length === 0) return null;
  if (path.length === 1) {
    if (!("children" in root)) return null;
    return { parent: root as SceneNode & ChildrenMixin, index: path[0] };
  }
  const parent = getChildAtPath(root, path.slice(0, -1));
  if (!parent || !("children" in parent)) return null;
  return {
    parent: parent as SceneNode & ChildrenMixin,
    index: path[path.length - 1],
  };
}

function forceGlyphColor(
  node: SceneNode,
  color: { r: number; g: number; b: number },
  opacity: number
): void {
  if ("fills" in node) {
    const fills = Array.isArray(node.fills) ? (node.fills as Paint[]) : [];
    const next = fills.map((p) => {
      if (p.type === "SOLID") {
        return {
          ...p,
          color: { r: color.r, g: color.g, b: color.b },
          opacity: p.opacity ?? opacity,
          visible: p.visible !== false,
        } as SolidPaint;
      }
      return p;
    });
    // If no solid fill but node has geometry with none, leave fills alone
    if (next.length > 0) node.fills = next;
  }
  if ("strokes" in node) {
    const strokes = Array.isArray(node.strokes) ? (node.strokes as Paint[]) : [];
    if (strokes.length > 0) {
      node.strokes = strokes.map((p) => {
        if (p.type === "SOLID") {
          return {
            ...p,
            color: { r: color.r, g: color.g, b: color.b },
            opacity: p.opacity ?? opacity,
            visible: p.visible !== false,
          } as SolidPaint;
        }
        return p;
      });
    }
  }
  if ("children" in node) {
    for (const child of (node as ChildrenMixin).children) {
      forceGlyphColor(child, color, opacity);
    }
  }
}

export function createEditableClone(source: SceneNode): SceneNode {
  let clone: SceneNode;

  if (source.type === "COMPONENT") {
    const instance = source.createInstance();
    clone = instance.detachInstance();
  } else if (source.type === "INSTANCE") {
    clone = source.clone();
    if (clone.type === "INSTANCE") {
      clone = clone.detachInstance();
    }
  } else {
    clone = source.clone();
  }

  return clone;
}

export function readGlyphMeta(node: SceneNode): GlyphMeta {
  return {
    name: node.name,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: "rotation" in node ? (node as LayoutMixin).rotation : 0,
    opacity: "opacity" in node ? node.opacity : 1,
    blendMode: "blendMode" in node ? String(node.blendMode) : "PASS_THROUGH",
    constraints:
      "constraints" in node
        ? {
            horizontal: String(
              (node as ConstraintMixin).constraints.horizontal
            ),
            vertical: String((node as ConstraintMixin).constraints.vertical),
          }
        : null,
    layoutAlign:
      "layoutAlign" in node
        ? ((node as AutoLayoutChildrenMixin).layoutAlign as GlyphMeta["layoutAlign"])
        : null,
    layoutGrow:
      "layoutGrow" in node
        ? (node as AutoLayoutChildrenMixin).layoutGrow
        : null,
    layoutPositioning:
      "layoutPositioning" in node
        ? ((node as AutoLayoutChildrenMixin)
            .layoutPositioning as GlyphMeta["layoutPositioning"])
        : null,
    layoutSizingHorizontal:
      "layoutSizingHorizontal" in node
        ? ((node as LayoutMixin)
            .layoutSizingHorizontal as GlyphMeta["layoutSizingHorizontal"])
        : null,
    layoutSizingVertical:
      "layoutSizingVertical" in node
        ? ((node as LayoutMixin)
            .layoutSizingVertical as GlyphMeta["layoutSizingVertical"])
        : null,
  };
}

function applyGlyphMeta(target: SceneNode, meta: GlyphMeta): void {
  target.name = meta.name || target.name;
  if ("opacity" in target) target.opacity = meta.opacity;
  if ("blendMode" in target) {
    try {
      (target as BlendMixin).blendMode = meta.blendMode as BlendMode;
    } catch {
      /* ignore unsupported blend */
    }
  }
  if ("rotation" in target) {
    try {
      (target as LayoutMixin).rotation = meta.rotation;
    } catch {
      /* ignore */
    }
  }
  if ("constraints" in target && meta.constraints) {
    try {
      (target as ConstraintMixin).constraints = {
        horizontal: meta.constraints.horizontal as ConstraintType,
        vertical: meta.constraints.vertical as ConstraintType,
      };
    } catch {
      /* ignore */
    }
  }
  if ("layoutPositioning" in target && meta.layoutPositioning) {
    try {
      (target as AutoLayoutChildrenMixin).layoutPositioning =
        meta.layoutPositioning;
    } catch {
      /* ignore */
    }
  }
  if ("layoutAlign" in target && meta.layoutAlign) {
    try {
      (target as AutoLayoutChildrenMixin).layoutAlign = meta.layoutAlign;
    } catch {
      /* ignore */
    }
  }
  if ("layoutGrow" in target && meta.layoutGrow != null) {
    try {
      (target as AutoLayoutChildrenMixin).layoutGrow = meta.layoutGrow;
    } catch {
      /* ignore */
    }
  }
}

function placeSvgInExactSlot(
  svgRoot: FrameNode,
  slot: { width: number; height: number },
  iconColor: TemplateSnapshot["iconColor"],
  iconOpacity: number
): FrameNode {
  // Transparent slot frame keeps EXACT width/height/spacing of the original glyph
  const slotFrame = figma.createFrame();
  slotFrame.name = svgRoot.name;
  slotFrame.resizeWithoutConstraints(
    Math.max(1, slot.width),
    Math.max(1, slot.height)
  );
  slotFrame.fills = [];
  slotFrame.strokes = [];
  slotFrame.clipsContent = false;
  slotFrame.layoutMode = "NONE";

  const scale = Math.min(
    slot.width / Math.max(svgRoot.width, 0.001),
    slot.height / Math.max(svgRoot.height, 0.001)
  );
  if (Number.isFinite(scale) && scale > 0) {
    svgRoot.rescale(scale);
  }

  // Center glyph inside the exact slot (preserves padding relative to container)
  svgRoot.x = (slot.width - svgRoot.width) / 2;
  svgRoot.y = (slot.height - svgRoot.height) / 2;
  slotFrame.appendChild(svgRoot);

  if (iconColor) {
    forceGlyphColor(svgRoot, iconColor, iconOpacity);
  } else {
    // Default dark so outline icons remain visible
    forceGlyphColor(svgRoot, { r: 0.12, g: 0.12, b: 0.12 }, iconOpacity);
  }

  return slotFrame;
}

function resolveSlot(
  template: TemplateSnapshot,
  old: SceneNode | null
): { meta: GlyphMeta; width: number; height: number; x: number; y: number } {
  if (old) {
    const meta = readGlyphMeta(old);
    return {
      meta,
      width: old.width,
      height: old.height,
      x: old.x,
      y: old.y,
    };
  }
  const meta = template.glyphMeta ?? {
    name: "icon",
    x: template.padding.left,
    y: template.padding.top,
    width: template.iconSize.width,
    height: template.iconSize.height,
    rotation: 0,
    opacity: 1,
    blendMode: "PASS_THROUGH",
    constraints: { horizontal: "CENTER", vertical: "CENTER" },
    layoutAlign: "CENTER",
    layoutGrow: 0,
    layoutPositioning: "AUTO",
    layoutSizingHorizontal: "FIXED",
    layoutSizingVertical: "FIXED",
  };
  return {
    meta,
    width: meta.width,
    height: meta.height,
    x: meta.x,
    y: meta.y,
  };
}

/** Replace the glyph inside a cloned template while keeping exact layout/style */
export function replaceGlyphInClone(
  clone: SceneNode,
  template: TemplateSnapshot,
  icon: LibraryIcon
): void {
  let svgRoot: FrameNode;
  try {
    svgRoot = figma.createNodeFromSvg(icon.svg);
  } catch {
    throw new Error(`Failed to parse SVG for "${icon.name}".`);
  }
  svgRoot.name = icon.name;

  const path = template.iconChildPath;
  let old: SceneNode | null = null;
  let parent: (SceneNode & ChildrenMixin) | null = null;
  let index = 0;

  if (path && path.length > 0) {
    const loc = getParentAndIndex(clone, path);
    if (loc) {
      parent = loc.parent;
      index = loc.index;
      old = loc.parent.children[loc.index] ?? null;
    }
  }

  const slot = resolveSlot(template, old);
  const slotFrame = placeSvgInExactSlot(
    svgRoot,
    { width: slot.width, height: slot.height },
    template.iconColor,
    template.iconOpacity
  );
  slotFrame.name = slot.meta.name || icon.name;

  if (parent && old) {
    // Insert first at same index, then remove old — keeps sibling order stable
    parent.insertChild(index, slotFrame);
    // After insert, old shifts by +1 if inserted before it
    const oldNow = parent.children[index + 1];
    if (oldNow && oldNow.id === old.id) {
      oldNow.remove();
    } else if (!old.removed) {
      old.remove();
    }

    // Apply transform AFTER parenting so auto-layout / absolute rules work
    applyGlyphMeta(slotFrame, slot.meta);

    const parentIsAutoLayout =
      "layoutMode" in parent &&
      (parent as FrameNode).layoutMode &&
      (parent as FrameNode).layoutMode !== "NONE";

    if (
      !parentIsAutoLayout ||
      slot.meta.layoutPositioning === "ABSOLUTE" ||
      slot.meta.layoutAlign == null
    ) {
      slotFrame.x = slot.x;
      slotFrame.y = slot.y;
    }

    // Prefer FIXED sizing to lock the captured icon slot dimensions
    try {
      if ("layoutSizingHorizontal" in slotFrame) {
        slotFrame.layoutSizingHorizontal = "FIXED";
        slotFrame.layoutSizingVertical = "FIXED";
      }
    } catch {
      /* parent may not allow FILL/HUG context yet — FIXED usually works once parented */
    }

    return;
  }

  // Fallback: append into clone root using captured padding/slot
  if ("appendChild" in clone) {
    const root = clone as SceneNode & ChildrenMixin;
    root.appendChild(slotFrame);
    applyGlyphMeta(slotFrame, slot.meta);
    slotFrame.x = slot.x;
    slotFrame.y = slot.y;
    return;
  }

  slotFrame.remove();
  throw new Error("Template node cannot hold an icon glyph.");
}

export async function resolveSourceNode(
  template: TemplateSnapshot
): Promise<SceneNode | null> {
  if (!template.sourceNodeId) return null;
  try {
    const node = await figma.getNodeByIdAsync(template.sourceNodeId);
    if (!node || node.type === "DOCUMENT" || node.type === "PAGE") return null;
    return node as SceneNode;
  } catch {
    return null;
  }
}

function findClearPosition(): { x: number; y: number } {
  const children = figma.currentPage.children;
  let maxX = 0;
  let anchorY = 100;
  for (const node of children) {
    const right = node.x + node.width;
    if (right > maxX) {
      maxX = right;
      anchorY = node.y;
    }
  }
  return { x: maxX + 80, y: Math.max(0, anchorY) };
}

function recreateFromSnapshot(
  template: TemplateSnapshot,
  icon: LibraryIcon
): FrameNode {
  const frame = figma.createFrame();
  frame.name = icon.name;
  frame.resize(template.width, template.height);
  frame.fills = template.fills.map((f) => ({
    type: "SOLID" as const,
    color: f.color,
    opacity: f.opacity,
    visible: f.visible,
  }));
  frame.strokes = template.strokes.map((s) => ({
    type: "SOLID" as const,
    color: s.color,
    opacity: s.opacity,
    visible: s.visible,
  }));
  frame.strokeWeight = template.strokeWeight;
  frame.effects = template.effects.map((e) => {
    if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
      return {
        type: e.type,
        color: e.color,
        offset: e.offset,
        radius: e.radius,
        spread: e.spread,
        visible: e.visible,
        blendMode: "NORMAL" as const,
      };
    }
    return {
      type: e.type,
      radius: e.radius,
      visible: e.visible,
      blurType: "NORMAL" as const,
    };
  });
  frame.topLeftRadius = template.topLeftRadius;
  frame.topRightRadius = template.topRightRadius;
  frame.bottomLeftRadius = template.bottomLeftRadius;
  frame.bottomRightRadius = template.bottomRightRadius;
  frame.clipsContent = true;

  const svgRoot = figma.createNodeFromSvg(icon.svg);
  svgRoot.name = icon.name;
  const slot = resolveSlot(template, null);
  const slotFrame = placeSvgInExactSlot(
    svgRoot,
    { width: slot.width, height: slot.height },
    template.iconColor,
    template.iconOpacity
  );
  slotFrame.name = slot.meta.name || icon.name;
  frame.appendChild(slotFrame);
  applyGlyphMeta(slotFrame, slot.meta);
  slotFrame.x = slot.x;
  slotFrame.y = slot.y;
  return frame;
}

export async function buildExactPreviews(
  template: TemplateSnapshot,
  icons: LibraryIcon[]
): Promise<GeneratedPreview[]> {
  const source = await resolveSourceNode(template);
  const previews: GeneratedPreview[] = [];

  for (const icon of icons) {
    let node: SceneNode | null = null;
    try {
      node = await materializeStyledIcon(template, icon, source);
      const previewImage = await exportPng(node, 200);
      previews.push({
        id: `prev_${icon.id}`,
        name: icon.name,
        iconId: icon.id,
        previewImage,
        previewSvg: buildPreviewSvg(template, icon),
      });
    } finally {
      if (node && !node.removed) node.remove();
    }
  }

  return previews;
}

async function materializeStyledIcon(
  template: TemplateSnapshot,
  icon: LibraryIcon,
  source: SceneNode | null
): Promise<SceneNode> {
  let node: SceneNode;
  if (source) {
    node = createEditableClone(source);
    node.x = -100000;
    node.y = -100000;
    if (!node.parent) figma.currentPage.appendChild(node);
    replaceGlyphInClone(node, template, icon);
  } else {
    node = recreateFromSnapshot(template, icon);
    node.x = -100000;
    node.y = -100000;
    figma.currentPage.appendChild(node);
  }
  node.name = icon.name;
  return node;
}

function safeFilename(name: string): string {
  return (
    name
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "icon"
  );
}

export async function exportIconDownloads(
  template: TemplateSnapshot,
  icons: LibraryIcon[],
  scale: 1 | 1.5,
  formats: Array<"png" | "svg">
): Promise<
  Array<{ filename: string; mime: string; dataUrl: string }>
> {
  if (icons.length === 0) {
    throw new Error("No icons selected to download.");
  }
  if (formats.length === 0) {
    throw new Error("Choose at least one format: PNG or SVG.");
  }

  const source = await resolveSourceNode(template);
  const files: Array<{ filename: string; mime: string; dataUrl: string }> = [];
  const scaleTag = scale === 1 ? "1x" : "1.5x";
  const exportWidth = Math.max(1, Math.round(template.width * scale));

  for (const icon of icons) {
    let node: SceneNode | null = null;
    try {
      node = await materializeStyledIcon(template, icon, source);

      if (scale !== 1 && "rescale" in node) {
        (node as LayoutMixin).rescale(scale);
      }

      const base = safeFilename(icon.name);

      if (formats.includes("png")) {
        const bytes = await node.exportAsync({
          format: "PNG",
          constraint: { type: "WIDTH", value: exportWidth },
        });
        files.push({
          filename: `${base}@${scaleTag}.png`,
          mime: "image/png",
          dataUrl: bytesToDataUrl(bytes, "image/png"),
        });
      }

      if (formats.includes("svg")) {
        const bytes = await node.exportAsync({ format: "SVG" });
        // Scale SVG root width/height when 1.5x so downloaded file matches requested size
        let svgText = uint8ArrayToString(bytes);
        if (scale !== 1) {
          svgText = bumpSvgRootSize(svgText, scale);
        }
        const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
        files.push({
          filename: `${base}@${scaleTag}.svg`,
          mime: "image/svg+xml",
          dataUrl: encoded,
        });
      }
    } finally {
      if (node && !node.removed) node.remove();
    }
  }

  return files;
}

function uint8ArrayToString(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  try {
    return decodeURIComponent(escape(out));
  } catch {
    return out;
  }
}

function bumpSvgRootSize(svg: string, scale: number): string {
  return svg.replace(/<svg\b([^>]*)>/i, (_full, attrs: string) => {
    let next = attrs;
    const widthMatch = attrs.match(/\bwidth=["']([\d.]+)(px)?["']/i);
    const heightMatch = attrs.match(/\bheight=["']([\d.]+)(px)?["']/i);
    if (widthMatch) {
      const w = parseFloat(widthMatch[1]) * scale;
      next = next.replace(
        /\bwidth=["'][\d.]+(px)?["']/i,
        `width="${w}${widthMatch[2] || ""}"`
      );
    }
    if (heightMatch) {
      const h = parseFloat(heightMatch[1]) * scale;
      next = next.replace(
        /\bheight=["'][\d.]+(px)?["']/i,
        `height="${h}${heightMatch[2] || ""}"`
      );
    }
    return `<svg${next}>`;
  });
}

export async function insertIcons(
  template: TemplateSnapshot,
  icons: LibraryIcon[],
  asComponents: boolean,
  gap: number
): Promise<number> {
  if (icons.length === 0) {
    throw new Error("No icons selected to insert.");
  }

  const source = await resolveSourceNode(template);
  if (!source) {
    figma.notify(
      "Original template layer not found — recreating from captured style.",
      { timeout: 3000 }
    );
  }

  const origin = findClearPosition();
  const created: SceneNode[] = [];
  const cols = Math.min(icons.length, 6);

  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    let node: SceneNode;

    if (source) {
      node = createEditableClone(source);
      replaceGlyphInClone(node, template, icon);
      node.name = icon.name;
      if (!node.parent) {
        figma.currentPage.appendChild(node);
      }
    } else {
      node = recreateFromSnapshot(template, icon);
      figma.currentPage.appendChild(node);
    }

    // Lock outer size to captured template
    if ("resizeWithoutConstraints" in node) {
      try {
        (node as LayoutMixin).resizeWithoutConstraints(
          template.width,
          template.height
        );
      } catch {
        /* ignore */
      }
    }

    const row = Math.floor(i / cols);
    const col = i % cols;
    node.x = origin.x + col * (template.width + gap);
    node.y = origin.y + row * (template.height + gap);

    if (asComponents) {
      const component = figma.createComponentFromNode(node);
      component.name = icon.name;
      created.push(component);
    } else {
      created.push(node);
    }
  }

  figma.currentPage.selection = created;
  figma.viewport.scrollAndZoomIntoView(created);
  return created.length;
}

export async function exportTemplateThumbnail(
  node: SceneNode
): Promise<string> {
  return exportPng(node, 120);
}
