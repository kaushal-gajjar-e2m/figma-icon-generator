import type { PluginToUiMessage, UiToPluginMessage } from "../shared/types";

export function postToPlugin(message: UiToPluginMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

export function onPluginMessage(
  handler: (message: PluginToUiMessage) => void
): () => void {
  const listener = (event: MessageEvent) => {
    const msg = event.data?.pluginMessage as PluginToUiMessage | undefined;
    if (!msg?.type) return;
    handler(msg);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
