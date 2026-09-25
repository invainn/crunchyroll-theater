import { CLEAR_ELEMENT_STATE_MESSAGE } from "./utils/constants";
import { sendMessageToTab } from "./utils/message";

chrome.commands.onCommand.addListener((command, tab) =>
  sendMessageToTab(tab, command),
);

chrome.webNavigation.onHistoryStateUpdated.addListener(
  (details) => {
    // Ignore SPA navigations inside iframes (e.g. the player frame).
    if (details.frameId !== 0) return;
    chrome.tabs.get(details.tabId, (tab) =>
      sendMessageToTab(tab, CLEAR_ELEMENT_STATE_MESSAGE),
    );
  },
  { url: [{ hostEquals: "www.crunchyroll.com" }] },
);
