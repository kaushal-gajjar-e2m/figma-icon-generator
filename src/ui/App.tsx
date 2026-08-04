import { useCallback, useEffect, useMemo, useState } from "react";
import { ICON_PACK_EXAMPLE, parseIconPackJson } from "../shared/iconPack";
import type {
  DownloadFormat,
  DownloadScale,
  GeneratedPreview,
  IconSourceKind,
  IconTheme,
  LibraryIcon,
  TemplateSnapshot,
} from "../shared/types";
import { getFaFillIcons, getFaLineIcons } from "./icons/faSets";
import { onPluginMessage, postToPlugin } from "./messaging";

type Tab = "template" | "library" | "preview";

const FA_FILL = getFaFillIcons();
const FA_LINE = getFaLineIcons();

function shapeLabel(hint: TemplateSnapshot["shapeHint"]): string {
  return hint.replace(/-/g, " ");
}

function readSvgFiles(files: FileList | null): Promise<LibraryIcon[]> {
  if (!files || files.length === 0) return Promise.resolve([]);
  const readers = Array.from(files)
    .filter((f) => f.name.toLowerCase().endsWith(".svg"))
    .map(
      (file) =>
        new Promise<LibraryIcon>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const svg = String(reader.result ?? "");
            resolve({
              id: `upload_${file.name}_${file.lastModified}`,
              name: file.name.replace(/\.svg$/i, ""),
              svg,
              source: "custom",
            });
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        })
    );
  return Promise.all(readers);
}

function downloadFiles(
  files: Array<{ filename: string; dataUrl: string }>
): void {
  files.forEach((file, index) => {
    window.setTimeout(() => {
      const a = document.createElement("a");
      a.href = file.dataUrl;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }, index * 120);
  });
}

function iconsForSource(
  source: IconSourceKind,
  customLibrary: LibraryIcon[]
): LibraryIcon[] {
  if (source === "fa-fill") return FA_FILL;
  if (source === "fa-line") return FA_LINE;
  return customLibrary;
}

export function App() {
  const [tab, setTab] = useState<Tab>("template");
  const [template, setTemplate] = useState<TemplateSnapshot | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<TemplateSnapshot[]>([]);
  const [selectionName, setSelectionName] = useState<string | null>(null);
  const [canCapture, setCanCapture] = useState(false);
  const [selectionCount, setSelectionCount] = useState(0);
  const [customLibrary, setCustomLibrary] = useState<LibraryIcon[]>([]);
  const [iconSource, setIconSource] = useState<IconSourceKind>("custom");
  const [iconTheme, setIconTheme] = useState<IconTheme>("dark");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previews, setPreviews] = useState<GeneratedPreview[]>([]);
  const [asComponents, setAsComponents] = useState(true);
  const [saveName, setSaveName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showPackHelp, setShowPackHelp] = useState(false);
  const [downloadScale, setDownloadScale] = useState<DownloadScale>(1);
  const [downloadPng, setDownloadPng] = useState(true);
  const [downloadSvg, setDownloadSvg] = useState(true);

  const icons = useMemo(
    () => iconsForSource(iconSource, customLibrary),
    [iconSource, customLibrary]
  );

  const selectedIcons = useMemo(
    () => icons.filter((i) => selectedIds.includes(i.id)),
    [icons, selectedIds]
  );

  const switchSource = useCallback(
    (next: IconSourceKind, library = customLibrary) => {
      setIconSource(next);
      const list = iconsForSource(next, library);
      setSelectedIds(list.slice(0, Math.min(5, list.length)).map((i) => i.id));
      setPreviews([]);
    },
    [customLibrary]
  );

  const requestExactPreviews = useCallback((iconsToPreview: LibraryIcon[]) => {
    if (!iconsToPreview.length) return;
    setBusy(true);
    setStatus("Rendering exact previews from your template…");
    setError(null);
    postToPlugin({
      type: "generate-previews",
      iconIds: iconsToPreview.map((i) => i.id),
      icons: iconsToPreview,
    });
  }, []);

  useEffect(() => {
    const off = onPluginMessage((msg) => {
      switch (msg.type) {
        case "init":
          setTemplate(msg.template);
          setSavedTemplates(msg.savedTemplates);
          setSelectionName(msg.selectionName);
          setCustomLibrary(msg.customLibrary);
          setIconSource("custom");
          setSelectedIds(
            msg.customLibrary.slice(0, 5).map((i) => i.id)
          );
          break;
        case "selection-changed":
          setSelectionName(msg.selectionName);
          setCanCapture(msg.canCapture);
          setSelectionCount(msg.selectionCount);
          break;
        case "template-captured":
          setTemplate(msg.template);
          setSavedTemplates(msg.savedTemplates);
          setError(null);
          setStatus(null);
          setBusy(false);
          // After capture → Library with Custom Lib selected by default
          setIconSource("custom");
          setTab("library");
          setPreviews([]);
          break;
        case "template-cleared":
          setTemplate(null);
          setSavedTemplates(msg.savedTemplates);
          setPreviews([]);
          setBusy(false);
          setStatus(null);
          break;
        case "saved-templates-updated":
          setSavedTemplates(msg.savedTemplates);
          setTemplate(msg.template);
          setSaveName("");
          setBusy(false);
          break;
        case "custom-library-updated":
          setCustomLibrary(msg.customLibrary);
          setBusy(false);
          setStatus(null);
          setIconSource("custom");
          setSelectedIds(msg.customLibrary.map((i) => i.id));
          setTab("library");
          break;
        case "previews-ready":
          setPreviews(msg.previews);
          setTab("preview");
          setBusy(false);
          setStatus(null);
          setError(null);
          break;
        case "downloads-ready":
          downloadFiles(msg.files);
          setBusy(false);
          setStatus(`Downloaded ${msg.files.length} file(s) @${msg.scale}x`);
          break;
        case "insert-done":
          setBusy(false);
          setStatus(null);
          break;
        case "notify":
          setStatus(msg.message);
          break;
        case "error":
          setError(msg.message);
          setBusy(false);
          setStatus(null);
          break;
        default:
          break;
      }
    });
    postToPlugin({ type: "ui-ready" });
    return off;
  }, []);

  const toggleIcon = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const selectAll = () => setSelectedIds(icons.map((i) => i.id));
  const clearSelection = () => setSelectedIds([]);

  const persistCustom = (next: LibraryIcon[]) => {
    setBusy(true);
    setStatus("Saving custom library…");
    postToPlugin({ type: "save-custom-library", icons: next });
  };

  const onUploadSvg = async (files: FileList | null) => {
    try {
      const uploaded = await readSvgFiles(files);
      if (uploaded.length === 0) {
        setError("Please upload one or more .svg files.");
        return;
      }
      setError(null);
      persistCustom([...uploaded, ...customLibrary]);
    } catch {
      setError("Failed to read SVG file(s).");
    }
  };

  const onImportPack = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseIconPackJson(text);
      if (parsed.length === 0) {
        setError("Icon pack contained no valid icons.");
        return;
      }
      setError(null);
      persistCustom([...parsed, ...customLibrary]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import JSON pack.");
    }
  };

  const capture = () => {
    setBusy(true);
    setError(null);
    setStatus("Capturing template style & layout…");
    postToPlugin({ type: "capture-template" });
  };

  const generate = () => {
    if (!template) {
      setError("Capture a reference template first.");
      setTab("template");
      return;
    }
    if (selectedIcons.length === 0) {
      setError("Select at least one icon from the library.");
      setTab("library");
      return;
    }
    requestExactPreviews(selectedIcons);
  };

  const insertAll = () => {
    if (!template || selectedIcons.length === 0) return;
    setBusy(true);
    setError(null);
    setStatus("Inserting icons with captured layout…");
    postToPlugin({
      type: "insert-icons",
      icons: selectedIcons,
      asComponents,
      gap: 24,
    });
  };

  const downloadSelected = () => {
    if (!template || selectedIcons.length === 0) return;
    const formats: DownloadFormat[] = [];
    if (downloadPng) formats.push("png");
    if (downloadSvg) formats.push("svg");
    if (formats.length === 0) {
      setError("Enable PNG and/or SVG to download.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(`Exporting @${downloadScale}x…`);
    postToPlugin({
      type: "download-icons",
      icons: selectedIcons,
      scale: downloadScale,
      formats,
    });
  };

  return (
    <div className={`app theme-${iconTheme}`}>
      <header className="header">
        <h1>Icon Generator</h1>
        <p>Capture a style, pick Fill / Line / Custom icons, then generate.</p>
      </header>

      <nav className="tabs">
        {(
          [
            ["template", "Template"],
            ["library", "Library"],
            ["preview", "Preview"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={`tab ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}
            type="button"
          >
            {label}
            {id === "library" && selectedIds.length > 0
              ? ` (${selectedIds.length})`
              : ""}
            {id === "preview" && previews.length > 0
              ? ` (${previews.length})`
              : ""}
          </button>
        ))}
      </nav>

      <main className="content">
        {error && <div className="error">{error}</div>}
        {status && <div className="status">{status}</div>}

        {tab === "template" && (
          <div className="section">
            <p className="section-title">Reference selection</p>
            <div className="card">
              <div className="meta-row">
                <span>Current selection</span>
                <span>{selectionName ?? "Nothing selected"}</span>
              </div>
              <div className="meta-row">
                <span>Ready to capture</span>
                <span>{canCapture ? "Yes" : "No"}</span>
              </div>
            </div>
            <p className="hint">
              Select your reference icon container, capture it, then choose
              Custom / Fill / Inner line icons in Library.
            </p>
            <div className="row">
              <button
                className="btn btn-primary grow"
                type="button"
                disabled={!canCapture || busy}
                onClick={capture}
              >
                Capture as template
              </button>
              <button
                className="btn"
                type="button"
                disabled={!template || busy}
                onClick={() => {
                  setBusy(true);
                  postToPlugin({ type: "clear-template" });
                }}
              >
                Clear
              </button>
            </div>

            <p className="section-title">Active template</p>
            {template ? (
              <div className="card">
                {template.thumbnail && (
                  <div className="template-thumb-wrap">
                    <img
                      className="template-thumb"
                      src={template.thumbnail}
                      alt={template.name}
                    />
                  </div>
                )}
                <div className="row wrap">
                  <span className="badge">{template.name}</span>
                  <span className="badge">{shapeLabel(template.shapeHint)}</span>
                  <span className="badge">{template.sourceType}</span>
                </div>
                <div className="meta-row">
                  <span>Size</span>
                  <span>
                    {Math.round(template.width)} × {Math.round(template.height)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="card empty">No template captured yet.</div>
            )}

            <p className="section-title">Saved styles</p>
            <div className="row">
              <input
                className="input grow"
                placeholder="Style name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                disabled={!template}
              />
              <button
                className="btn btn-sm"
                type="button"
                disabled={!template || !saveName.trim() || busy}
                onClick={() => {
                  setBusy(true);
                  postToPlugin({
                    type: "save-named-template",
                    name: saveName.trim(),
                  });
                }}
              >
                Save
              </button>
            </div>
            {savedTemplates.length > 0 && (
              <div className="saved-list">
                {savedTemplates.map((t) => (
                  <div
                    key={t.id}
                    className={`saved-item ${
                      template?.id === t.id ? "active" : ""
                    }`}
                  >
                    <button
                      className="btn btn-sm grow"
                      type="button"
                      onClick={() =>
                        postToPlugin({
                          type: "load-named-template",
                          id: t.id,
                        })
                      }
                    >
                      {t.name}
                    </button>
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() =>
                        postToPlugin({
                          type: "delete-named-template",
                          id: t.id,
                        })
                      }
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "library" && (
          <div className="section">
            <p className="section-title">Icon source</p>
            <div className="source-tabs">
              {(
                [
                  ["custom", "Custom Lib"],
                  ["fa-fill", "Fill icons"],
                  ["fa-line", "Inner line"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`source-tab ${iconSource === id ? "active" : ""}`}
                  onClick={() => switchSource(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {(iconSource === "fa-fill" || iconSource === "fa-line") && (
              <>
                <p className="section-title">Library theme</p>
                <div className="source-tabs">
                  <button
                    type="button"
                    className={`source-tab ${iconTheme === "dark" ? "active" : ""}`}
                    onClick={() => setIconTheme("dark")}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    className={`source-tab ${iconTheme === "light" ? "active" : ""}`}
                    onClick={() => setIconTheme("light")}
                  >
                    Light
                  </button>
                </div>
                <p className="hint">
                  Font Awesome–style {iconSource === "fa-fill" ? "solid/fill" : "outline/inner-line"}{" "}
                  icons. Preview tiles follow Dark/Light; insert still uses your
                  captured template color.
                </p>
              </>
            )}

            {iconSource === "custom" && (
              <>
                <p className="hint">
                  Quick path for your Figma pack: select the whole{" "}
                  <strong>Services</strong>, <strong>Industries</strong>, or{" "}
                  <strong>Basic</strong> frame → <strong>Sync from Figma</strong>.
                  All icon children are imported (no JSON needed).
                </p>
                <div className="row wrap">
                  <button
                    className="btn btn-sm"
                    type="button"
                    disabled={busy || selectionCount < 1}
                    onClick={() => {
                      setBusy(true);
                      postToPlugin({ type: "sync-selection-to-library" });
                    }}
                  >
                    Sync from Figma ({selectionCount})
                  </button>
                  <label className="btn btn-sm file-btn">
                    Upload SVG
                    <input
                      type="file"
                      accept=".svg,image/svg+xml"
                      multiple
                      onChange={(e) => {
                        void onUploadSvg(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <label className="btn btn-sm file-btn">
                    Import JSON
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => {
                        void onImportPack(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={() => setShowPackHelp((v) => !v)}
                  >
                    How to add
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    type="button"
                    disabled={busy || customLibrary.length === 0}
                    onClick={() => {
                      setBusy(true);
                      postToPlugin({ type: "clear-custom-library" });
                    }}
                  >
                    Clear lib
                  </button>
                </div>
                {showPackHelp && (
                  <div className="card help-card">
                    <p className="help-title">How to load custom icons</p>
                    <ol className="help-list">
                      <li>
                        <strong>Fastest (recommended):</strong> select the whole
                        icon frame (Services / Industries / Basic) → Sync from
                        Figma. Every child icon is imported.
                      </li>
                      <li>
                        <strong>Multi-select:</strong> Shift-select several
                        frames and sync once.
                      </li>
                      <li>
                        <strong>SVG / JSON:</strong> Upload SVG files or Import
                        JSON pack if icons are outside Figma.
                      </li>
                    </ol>
                    <pre className="code-block">{ICON_PACK_EXAMPLE}</pre>
                  </div>
                )}
              </>
            )}

            <div className="toolbar">
              <p className="section-title" style={{ margin: 0 }}>
                {iconSource === "custom"
                  ? `Custom icons (${icons.length})`
                  : iconSource === "fa-fill"
                    ? `Fill icons (${icons.length})`
                    : `Inner line icons (${icons.length})`}
              </p>
              <div className="row">
                <button className="btn btn-sm" type="button" onClick={selectAll}>
                  All
                </button>
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={clearSelection}
                >
                  None
                </button>
              </div>
            </div>

            {icons.length === 0 ? (
              <div className="card empty">
                {iconSource === "custom"
                  ? "Custom library is empty. Sync from Figma, upload SVG, or import JSON."
                  : "No icons in this set."}
              </div>
            ) : (
              <div className={`icon-grid lib-${iconTheme}`}>
                {icons.map((icon) => {
                  const selected = selectedIds.includes(icon.id);
                  return (
                    <button
                      key={icon.id}
                      type="button"
                      className={`icon-tile ${selected ? "selected" : ""}`}
                      onClick={() => toggleIcon(icon.id)}
                      title={icon.name}
                    >
                      <span
                        className="glyph"
                        dangerouslySetInnerHTML={{ __html: icon.svg }}
                      />
                      <span className="label">{icon.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "preview" && (
          <div className="section">
            <p className="section-title">Exact preview</p>

            {template && (
              <div className="card download-settings">
                <p className="section-title" style={{ margin: 0 }}>
                  Download settings
                </p>
                <div className="meta-row">
                  <span>Size</span>
                  <span>
                    {Math.round(template.width * downloadScale)} ×{" "}
                    {Math.round(template.height * downloadScale)}
                    {downloadScale === 1 ? " (default)" : " (1.5×)"}
                  </span>
                </div>
                <div className="source-tabs">
                  <button
                    type="button"
                    className={`source-tab ${downloadScale === 1 ? "active" : ""}`}
                    onClick={() => setDownloadScale(1)}
                  >
                    Default 1×
                  </button>
                  <button
                    type="button"
                    className={`source-tab ${downloadScale === 1.5 ? "active" : ""}`}
                    onClick={() => setDownloadScale(1.5)}
                  >
                    1.5×
                  </button>
                </div>
                <div className="row wrap">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={downloadPng}
                      onChange={(e) => setDownloadPng(e.target.checked)}
                    />
                    PNG
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={downloadSvg}
                      onChange={(e) => setDownloadSvg(e.target.checked)}
                    />
                    SVG
                  </label>
                  <button
                    className="btn btn-sm btn-primary grow"
                    type="button"
                    disabled={
                      busy ||
                      !template ||
                      selectedIcons.length === 0 ||
                      (!downloadPng && !downloadSvg)
                    }
                    onClick={downloadSelected}
                  >
                    Download {selectedIcons.length || ""} icon
                    {selectedIcons.length === 1 ? "" : "s"}
                  </button>
                </div>
                <p className="hint">
                  Downloads use the same cloned template style as Insert. Files
                  are named like <code>IconName@1x.png</code>.
                </p>
              </div>
            )}

            {!template ? (
              <div className="card empty">Capture a template first.</div>
            ) : busy ? (
              <div className="card empty">Working…</div>
            ) : previews.length === 0 ? (
              <div className="card empty">
                Select icons in Library, then Generate Icons.
              </div>
            ) : (
              <>
                <p className="hint">
                  Source:{" "}
                  {iconSource === "custom"
                    ? "Custom Lib"
                    : iconSource === "fa-fill"
                      ? "Fill icons"
                      : "Inner line"}{" "}
                  · cloned from your captured template.
                </p>
                <div className="preview-grid">
                  {previews.map((p) => (
                    <div className="preview-item" key={p.id}>
                      <div className="preview-frame">
                        <img
                          className="preview-exact"
                          src={p.previewImage}
                          alt={p.name}
                        />
                      </div>
                      <div className="name">{p.name}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <label className="check">
          <input
            type="checkbox"
            checked={asComponents}
            onChange={(e) => setAsComponents(e.target.checked)}
          />
          Insert as Figma components
        </label>
        <div className="row">
          <button
            className="btn grow"
            type="button"
            disabled={busy || !template || selectedIcons.length === 0}
            onClick={generate}
          >
            Generate Icons
          </button>
          <button
            className="btn btn-primary grow"
            type="button"
            disabled={busy || !template || selectedIcons.length === 0}
            onClick={insertAll}
          >
            Insert All to Figma
          </button>
        </div>
      </footer>
    </div>
  );
}
