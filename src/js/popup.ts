const toggleHeader: HTMLElement | null =
  document.getElementById("toggle_header");

if (toggleHeader) {
  toggleHeader.onclick = function () {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          msg: "toggle_header",
        });
      }
    });
  };
}
