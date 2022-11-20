const eventMappings: Record<string, string> = {
  toggleHeader: "toggle_header",
  toggleScrollbar: "toggle_scrollbar",
  skipTime: "skip_time",
  insertWatchCss: "insert_watch_css",
};

chrome.commands.onCommand.addListener((command: string): void => {
  const queryInfo: chrome.tabs.QueryInfo = {
    active: true,
    currentWindow: true,
  };

  chrome.tabs.query(queryInfo, (tabs: chrome.tabs.Tab[]): void => {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        msg: eventMappings[command],
      });
    }
  });
});

const modifyWatchPage = async ({
  tabId,
  url,
}:
  | chrome.webNavigation.WebNavigationTransitionCallbackDetails
  | chrome.webNavigation.WebNavigationFramedCallbackDetails): Promise<void> => {
  if (url.includes("static")) return;
  if (!url.includes("crunchyroll")) return;
  const watchPageCSSInjection: chrome.scripting.CSSInjection = {
      target: { tabId },
      files: ["./css/watch_page.css"],
  };
  if (url.includes("crunchyroll.com/watch")) {
    await chrome.scripting.insertCSS(watchPageCSSInjection);
  } else {
    // TODO: Fix this when removeCSS gets added to scripting types
    await (chrome.scripting as any).removeCSS(watchPageCSSInjection);
  }
};

// Crunchyroll uses pushState navigation, so we need to add CSS through history updates
// otherwise they might not be applied
chrome.webNavigation.onHistoryStateUpdated.addListener(modifyWatchPage);

// When video page is reloaded/navigated to directly
chrome.webNavigation.onDOMContentLoaded.addListener(modifyWatchPage);

// Pause player when user switches tabs
// chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.TabChangeInfo): void => {
//     const tabId: number = activeInfo.tabId;
//     const url: string = await chrome.tabs.get(tabId, {
//       active: true,
//       currentWindow: true,
//     }).then((tab: chrome.tabs.Tab): string => tab.url);
//     if (!url.includes("crunchyroll")) return;
//     chrome.tabs.sendMessage(tabId, {
//       msg: "pause_video",
//     });
//   }
// )