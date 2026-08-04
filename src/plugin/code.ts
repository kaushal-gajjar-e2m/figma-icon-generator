import type { LibraryIcon, UiToPluginMessage } from "../shared/types";
import { buildExactPreviews, exportIconDownloads, insertIcons } from "./generator";
import {
  clearCustomLibrary,
  loadCustomLibrary,
  mergeCustomLibrary,
  saveCustomLibrary,
  syncSelectionToCustomLibrary,
} from "./librarySync";
import {
  captureTemplateFromSelection,
  deleteNamedTemplate,
  loadActiveTemplate,
  loadSavedTemplates,
  saveActiveTemplate,
  saveNamedTemplate,
  selectionCanCapture,
} from "./template";

figma.showUI(__html__, {
  width: 440,
  height: 680,
  themeColors: true,
});

function post(msg: unknown): void {
  figma.ui.postMessage(msg);
}

async function sendInit(): Promise<void> {
  const [template, savedTemplates, customLibrary] = await Promise.all([
    loadActiveTemplate(),
    loadSavedTemplates(),
    loadCustomLibrary(),
  ]);
  const { selectionName, canCapture } = selectionCanCapture();
  post({
    type: "init",
    template,
    savedTemplates,
    selectionName,
    customLibrary,
  });
  post({
    type: "selection-changed",
    selectionName,
    canCapture,
    selectionCount: figma.currentPage.selection.length,
  });
}

figma.on("selectionchange", () => {
  const { selectionName, canCapture } = selectionCanCapture();
  post({
    type: "selection-changed",
    selectionName,
    canCapture,
    selectionCount: figma.currentPage.selection.length,
  });
});

figma.ui.onmessage = async (raw: UiToPluginMessage) => {
  try {
    switch (raw.type) {
      case "ui-ready": {
        await sendInit();
        break;
      }

      case "capture-template": {
        const template = await captureTemplateFromSelection();
        await saveActiveTemplate(template);
        const savedTemplates = await loadSavedTemplates();
        post({
          type: "template-captured",
          template,
          savedTemplates,
        });
        figma.notify(`Template captured: ${template.name}`);
        break;
      }

      case "clear-template": {
        await saveActiveTemplate(null);
        const savedTemplates = await loadSavedTemplates();
        post({ type: "template-cleared", savedTemplates });
        break;
      }

      case "save-named-template": {
        const active = await loadActiveTemplate();
        if (!active) {
          throw new Error("Capture a template before saving it.");
        }
        const savedTemplates = await saveNamedTemplate(active, raw.name);
        const template = await loadActiveTemplate();
        post({
          type: "saved-templates-updated",
          savedTemplates,
          template,
        });
        figma.notify(`Saved style "${raw.name}"`);
        break;
      }

      case "load-named-template": {
        const saved = await loadSavedTemplates();
        const found = saved.find((t) => t.id === raw.id);
        if (!found) throw new Error("Saved template not found.");
        await saveActiveTemplate(found);
        post({
          type: "saved-templates-updated",
          savedTemplates: saved,
          template: found,
        });
        break;
      }

      case "delete-named-template": {
        const { saved, active } = await deleteNamedTemplate(raw.id);
        post({
          type: "saved-templates-updated",
          savedTemplates: saved,
          template: active,
        });
        break;
      }

      case "generate-previews": {
        const template = await loadActiveTemplate();
        if (!template) {
          throw new Error("Capture a reference icon template first.");
        }
        const icons: LibraryIcon[] = raw.icons.filter((i) =>
          raw.iconIds.includes(i.id)
        );
        if (icons.length === 0) {
          throw new Error("Select at least one icon from the library.");
        }
        post({ type: "notify", message: "Rendering exact previews…" });
        const previews = await buildExactPreviews(template, icons);
        post({ type: "previews-ready", previews });
        break;
      }

      case "insert-icons": {
        const template = await loadActiveTemplate();
        if (!template) {
          throw new Error("Capture a reference icon template first.");
        }
        const count = await insertIcons(
          template,
          raw.icons,
          raw.asComponents,
          raw.gap
        );
        post({ type: "insert-done", count });
        figma.notify(`Inserted ${count} icon${count === 1 ? "" : "s"}`);
        break;
      }

      case "sync-selection-to-library": {
        post({ type: "notify", message: "Syncing icons from selection…" });
        const result = await syncSelectionToCustomLibrary();
        post({
          type: "custom-library-updated",
          customLibrary: result.customLibrary,
        });
        const skip =
          result.skippedCount > 0 ? ` (${result.skippedCount} skipped)` : "";
        figma.notify(
          `Synced ${result.addedCount} icon(s) into Custom Lib${skip}`
        );
        break;
      }

      case "save-custom-library": {
        const customLibrary = await mergeCustomLibrary(raw.icons);
        post({ type: "custom-library-updated", customLibrary });
        figma.notify(`Custom library updated (${customLibrary.length})`);
        break;
      }

      case "clear-custom-library": {
        await clearCustomLibrary();
        post({ type: "custom-library-updated", customLibrary: [] });
        figma.notify("Custom library cleared");
        break;
      }

      case "download-icons": {
        const template = await loadActiveTemplate();
        if (!template) {
          throw new Error("Capture a reference icon template first.");
        }
        if (raw.icons.length === 0) {
          throw new Error("Select at least one icon to download.");
        }
        post({
          type: "notify",
          message: `Preparing ${raw.scale}× downloads…`,
        });
        const files = await exportIconDownloads(
          template,
          raw.icons,
          raw.scale,
          raw.formats
        );
        post({
          type: "downloads-ready",
          files,
          scale: raw.scale,
        });
        figma.notify(`Ready: ${files.length} file(s) @${raw.scale}x`);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    post({ type: "error", message });
    figma.notify(message, { error: true });
  }
};
