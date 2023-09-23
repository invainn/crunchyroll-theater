import { CLEAR_ELEMENT_STATE_MESSAGE } from "./utils/constants";
import { sendMessageToCurrentTab } from "./utils/message";

chrome.commands.onCommand.addListener((command: string): void =>
  sendMessageToCurrentTab(command),
);
chrome.webNavigation.onHistoryStateUpdated.addListener(() =>
  sendMessageToCurrentTab(CLEAR_ELEMENT_STATE_MESSAGE),
);
