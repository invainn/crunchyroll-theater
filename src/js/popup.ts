import "bootstrap";
import { ChromeStorage } from "./utils/chrome-storage";
import {
  CRUNCHYROLL_WEBSITE,
  HIDE_HEADER_STORAGE_KEY,
  REMOVE_SCROLLBAR_STORAGE_KEY,
  TOGGLE_HEADER_MESSAGE,
  TOGGLE_SCROLLBAR_MESSAGE,
} from "./utils/constants";

function fetchElementById(id: string): Element {
  const element = document.getElementById(id);
  if (!element) throw Error(`could not find element by id ${id}`);
  return element;
}

function mapSettingToSwitch(
  setting: string,
  switchId: string,
  tabId: number,
  tabMessage: string,
): void {
  ChromeStorage.fetchStorageValue(setting).then((setting) => {
    const switchElement = fetchElementById(switchId) as HTMLInputElement;
    switchElement.checked = setting as boolean;
    switchElement.onclick = () => {
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { msg: tabMessage }).catch(() => {});
      }
    };
  });
}

const queryInfo: chrome.tabs.QueryInfo = {
  active: true,
  currentWindow: true,
};

chrome.tabs.query(queryInfo, (tabs: chrome.tabs.Tab[]) => {
  const tab = tabs[0];
  if (tab?.id && tab.url?.startsWith(CRUNCHYROLL_WEBSITE)) {
    mapSettingToSwitch(
      HIDE_HEADER_STORAGE_KEY,
      "hide-header-switch",
      tab.id,
      TOGGLE_HEADER_MESSAGE,
    );
    mapSettingToSwitch(
      REMOVE_SCROLLBAR_STORAGE_KEY,
      "scrollbar-switch",
      tab.id,
      TOGGLE_SCROLLBAR_MESSAGE,
    );
  } else {
    const switches = fetchElementById("switches") as HTMLElement;
    const notOnPageMessage = fetchElementById("not-on-page");

    switches.classList.toggle("d-none");
    notOnPageMessage.classList.toggle("d-none");
  }
});
