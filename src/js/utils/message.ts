import { CRUNCHYROLL_WEBSITE } from "./constants";

const queryInfo: chrome.tabs.QueryInfo = {
  active: true,
  currentWindow: true,
};

export function sendMessageToCurrentTab(msg: string): void {
  chrome.tabs.query(queryInfo, (tabs: chrome.tabs.Tab[]): void => {
    if (
      tabs[0].id &&
      tabs[0].url?.includes(CRUNCHYROLL_WEBSITE) &&
      tabs[0].status === "complete"
    ) {
      chrome.tabs.sendMessage(tabs[0].id, { msg });
    }
  });
}
