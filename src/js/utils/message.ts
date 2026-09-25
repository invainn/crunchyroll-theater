import { CRUNCHYROLL_WEBSITE } from "./constants";

export function sendMessageToTab(
  tab: chrome.tabs.Tab | undefined,
  msg: string,
): void {
  if (!tab?.id || !tab.url?.startsWith(CRUNCHYROLL_WEBSITE)) return;

  // The content script may not be injected yet (tab still loading, or the
  // extension was just reloaded); nothing is listening, so drop the message.
  chrome.tabs.sendMessage(tab.id, { msg }).catch(() => {});
}
