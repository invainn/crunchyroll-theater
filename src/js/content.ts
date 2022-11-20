import { HeaderAction } from "./actions/header-action";
import { MutationObserverHandler } from "./mutation-handler";

new MutationObserverHandler(
	new HeaderAction(),
);

// chrome.runtime.onMessage.addListener(async (req, sender, sendResponse) => {
// 	if (req.msg === "toggle_scrollbar") {
// 		let { isScrollbarShown } = await fetchKeys();

// 		isScrollbarShown = isScrollbarShown === true ? false : true;
// 		await setStorageKey("isScrollbarShown", isScrollbarShown);

// 		if (!isScrollbarShown && initializedVideoState) {
// 			toggleScrollbar(false);
// 		} else {
// 			toggleScrollbar(true);
// 		}
// 	}
// });