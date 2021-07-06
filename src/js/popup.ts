const toggleHeader: HTMLElement | null =
  document.getElementById("toggle_header");

if (toggleHeader) {
  toggleHeader.onclick = () => {
    const queryInfo: chrome.tabs.QueryInfo = {
      active: true,
      currentWindow: true,
    };

    chrome.tabs.query(queryInfo, (tabs: chrome.tabs.Tab[]) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          msg: "toggle_header",
        });
      }
    });
  };
}
