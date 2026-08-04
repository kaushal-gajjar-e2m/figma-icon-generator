import type { LibraryIcon } from "../shared/types";

const STORAGE_CUSTOM = "customIconLibrary";

function uint8ToUtf8(bytes: Uint8Array): string {
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

export async function loadCustomLibrary(): Promise<LibraryIcon[]> {
  const data = await figma.clientStorage.getAsync(STORAGE_CUSTOM);
  if (!Array.isArray(data)) return [];
  return data.filter(
    (i) =>
      i &&
      typeof i.id === "string" &&
      typeof i.name === "string" &&
      typeof i.svg === "string"
  ) as LibraryIcon[];
}

export async function saveCustomLibrary(
  icons: LibraryIcon[]
): Promise<LibraryIcon[]> {
  const normalized = icons.map((i) => ({
    ...i,
    source: "custom" as const,
  }));
  await figma.clientStorage.setAsync(STORAGE_CUSTOM, normalized);
  return normalized;
}

export async function clearCustomLibrary(): Promise<void> {
  await figma.clientStorage.setAsync(STORAGE_CUSTOM, []);
}

export async function mergeCustomLibrary(
  incoming: LibraryIcon[]
): Promise<LibraryIcon[]> {
  const existing = await loadCustomLibrary();
  const byId = new Map<string, LibraryIcon>();
  for (const icon of existing) byId.set(icon.id, icon);
  for (const icon of incoming) {
    byId.set(icon.id, { ...icon, source: "custom" });
  }
  return saveCustomLibrary([...byId.values()]);
}

function isBackgroundPlate(
  child: SceneNode,
  parent: SceneNode & ChildrenMixin
): boolean {
  const fillsFull =
    Math.abs(child.x) < 2 &&
    Math.abs(child.y) < 2 &&
    Math.abs(child.width - parent.width) < 2 &&
    Math.abs(child.height - parent.height) < 2;
  return (
    fillsFull &&
    (child.type === "RECTANGLE" ||
      child.type === "ELLIPSE" ||
      child.type === "FRAME")
  );
}

function looksLikeIconLeaf(node: SceneNode): boolean {
  const maxSide = Math.max(node.width, node.height);
  const minSide = Math.min(node.width, node.height);
  if (maxSide < 6 || maxSide > 256) return false;
  if (minSide / maxSide < 0.35) return false; // skip wide text bars / dividers
  return (
    node.type === "VECTOR" ||
    node.type === "BOOLEAN_OPERATION" ||
    node.type === "STAR" ||
    node.type === "POLYGON" ||
    node.type === "ELLIPSE" ||
    node.type === "COMPONENT" ||
    node.type === "INSTANCE" ||
    node.type === "GROUP" ||
    node.type === "FRAME"
  );
}

/**
 * Expand a selected container (e.g. "Services" frame) into individual icon nodes.
 * Direct children that look like icons are preferred; otherwise recurse one level.
 */
function collectIconTargets(node: SceneNode): SceneNode[] {
  if (!("children" in node) || (node as ChildrenMixin).children.length === 0) {
    return looksLikeIconLeaf(node) ? [node] : [];
  }

  const parent = node as SceneNode & ChildrenMixin;
  const kids = parent.children.filter((c) => !isBackgroundPlate(c, parent));

  // Grid of icons: many similar-sized children
  const iconKids = kids.filter(looksLikeIconLeaf);
  if (iconKids.length >= 2) {
    return iconKids;
  }

  // Nested: e.g. section → auto-layout rows → icons
  const nested: SceneNode[] = [];
  for (const kid of kids) {
    if ("children" in kid && (kid as ChildrenMixin).children.length > 0) {
      nested.push(...collectIconTargets(kid));
    } else if (looksLikeIconLeaf(kid)) {
      nested.push(kid);
    }
  }
  if (nested.length > 0) return nested;

  // Fallback: export the selection itself
  return [node];
}

async function exportNodeAsIcon(node: SceneNode): Promise<LibraryIcon> {
  const bytes = await node.exportAsync({ format: "SVG" });
  const svg = uint8ToUtf8(bytes).trim();
  if (!svg.includes("<svg")) {
    throw new Error("Export did not return SVG");
  }
  return {
    id: `figma_${node.id.replace(/:/g, "_")}`,
    name: node.name || "Icon",
    svg,
    source: "custom",
  };
}

export type SyncResult = {
  customLibrary: LibraryIcon[];
  addedCount: number;
  skippedCount: number;
};

/** Sync selection — select a whole Services/Industries frame to import all icons */
export async function syncSelectionToCustomLibrary(): Promise<SyncResult> {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    throw new Error(
      "Select an icon frame (e.g. Services) or individual icons, then sync."
    );
  }

  const targets: SceneNode[] = [];
  const seen = new Set<string>();
  for (const node of selection) {
    for (const target of collectIconTargets(node)) {
      if (seen.has(target.id)) continue;
      seen.add(target.id);
      targets.push(target);
    }
  }

  if (targets.length === 0) {
    throw new Error("No exportable icon layers found in the selection.");
  }

  // Cap to avoid freezing on huge files; user can sync in batches
  const MAX = 400;
  const batch = targets.slice(0, MAX);
  const synced: LibraryIcon[] = [];
  let skippedCount = 0;

  for (const node of batch) {
    try {
      synced.push(await exportNodeAsIcon(node));
    } catch {
      skippedCount += 1;
    }
  }

  if (synced.length === 0) {
    throw new Error("Could not export any icons from the selection.");
  }

  const customLibrary = await mergeCustomLibrary(synced);
  return {
    customLibrary,
    addedCount: synced.length,
    skippedCount: skippedCount + Math.max(0, targets.length - batch.length),
  };
}
