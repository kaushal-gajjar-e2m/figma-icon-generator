/** Shared types between plugin sandbox and UI iframe */

export type RGB = { r: number; g: number; b: number };
export type RGBA = RGB & { a: number };

export type SolidPaintData = {
  type: "SOLID";
  color: RGB;
  opacity: number;
  visible: boolean;
};

export type EffectData =
  | {
      type: "DROP_SHADOW" | "INNER_SHADOW";
      color: RGBA;
      offset: { x: number; y: number };
      radius: number;
      spread: number;
      visible: boolean;
    }
  | {
      type: "LAYER_BLUR" | "BACKGROUND_BLUR";
      radius: number;
      visible: boolean;
    };

export type GlyphMeta = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  blendMode: string;
  constraints: { horizontal: string; vertical: string } | null;
  layoutAlign: "MIN" | "CENTER" | "MAX" | "STRETCH" | "INHERIT" | null;
  layoutGrow: number | null;
  layoutPositioning: "AUTO" | "ABSOLUTE" | null;
  layoutSizingHorizontal: "FIXED" | "HUG" | "FILL" | null;
  layoutSizingVertical: "FIXED" | "HUG" | "FILL" | null;
};

export type TemplateSnapshot = {
  id: string;
  name: string;
  savedAt: number;
  /** Live Figma node used as the exact style/layout source */
  sourceNodeId: string | null;
  /** Index path from template root to the glyph child to replace */
  iconChildPath: number[] | null;
  /** Thumbnail of the captured template (data URL) */
  thumbnail: string | null;
  /** Outer container size */
  width: number;
  height: number;
  cornerRadius: number;
  topLeftRadius: number;
  topRightRadius: number;
  bottomLeftRadius: number;
  bottomRightRadius: number;
  fills: SolidPaintData[];
  strokes: SolidPaintData[];
  strokeWeight: number;
  effects: EffectData[];
  /** Padding inferred from icon placement inside container */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Target size for the inner icon glyph */
  iconSize: { width: number; height: number };
  /** Exact glyph-slot layout copied from the captured icon child */
  glyphMeta: GlyphMeta | null;
  /** How the glyph color should be applied */
  iconColor: RGB | null;
  iconOpacity: number;
  shapeHint:
    | "circle"
    | "rounded-square"
    | "square"
    | "rectangle"
    | "rounded-rectangle"
    | "other";
  /** Whether template came from a Component / Instance */
  sourceType: string;
};

export type IconSourceKind = "custom" | "fa-fill" | "fa-line";
export type IconTheme = "dark" | "light";

export type LibraryIcon = {
  id: string;
  name: string;
  svg: string;
  /** data URL for UI preview */
  preview?: string;
  source: "custom" | "fa-fill" | "fa-line" | "upload" | "builtin";
};

export type DownloadScale = 1 | 1.5;
export type DownloadFormat = "png" | "svg";

export type DownloadFile = {
  filename: string;
  mime: string;
  /** data URL ready for browser download */
  dataUrl: string;
};

export type GeneratedPreview = {
  id: string;
  name: string;
  iconId: string;
  /** Exact rendered preview from Figma (PNG data URL) */
  previewImage: string;
  /** Optional SVG fallback */
  previewSvg?: string;
};

/** UI → Plugin */
export type UiToPluginMessage =
  | { type: "ui-ready" }
  | { type: "capture-template" }
  | { type: "clear-template" }
  | { type: "save-named-template"; name: string }
  | { type: "load-named-template"; id: string }
  | { type: "delete-named-template"; id: string }
  | { type: "generate-previews"; iconIds: string[]; icons: LibraryIcon[] }
  | {
      type: "insert-icons";
      icons: LibraryIcon[];
      asComponents: boolean;
      gap: number;
    }
  | { type: "sync-selection-to-library" }
  | { type: "save-custom-library"; icons: LibraryIcon[] }
  | { type: "clear-custom-library" }
  | {
      type: "download-icons";
      icons: LibraryIcon[];
      scale: DownloadScale;
      formats: DownloadFormat[];
    };

/** Plugin → UI */
export type PluginToUiMessage =
  | {
      type: "init";
      template: TemplateSnapshot | null;
      savedTemplates: TemplateSnapshot[];
      selectionName: string | null;
      customLibrary: LibraryIcon[];
    }
  | {
      type: "selection-changed";
      selectionName: string | null;
      canCapture: boolean;
      selectionCount: number;
    }
  | {
      type: "template-captured";
      template: TemplateSnapshot;
      savedTemplates: TemplateSnapshot[];
    }
  | {
      type: "template-cleared";
      savedTemplates: TemplateSnapshot[];
    }
  | {
      type: "saved-templates-updated";
      savedTemplates: TemplateSnapshot[];
      template: TemplateSnapshot | null;
    }
  | {
      type: "previews-ready";
      previews: GeneratedPreview[];
    }
  | {
      type: "insert-done";
      count: number;
    }
  | {
      type: "custom-library-updated";
      customLibrary: LibraryIcon[];
    }
  | {
      type: "downloads-ready";
      files: DownloadFile[];
      scale: DownloadScale;
    }
  | {
      type: "error";
      message: string;
    }
  | {
      type: "notify";
      message: string;
    };
