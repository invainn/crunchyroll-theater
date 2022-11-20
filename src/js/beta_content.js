let leavingHeader = false;
let enteringHeader = false;

let scheduledAnimationFrame = false;

let initializedHeaderState = false;
let initializedVideoState = false;
let initializedNonVideoPageState = false;
let initializedScrollerState = false;
let intializedVerifyEmailState = false;

const removeScrollbarElement = document.createElement("style");
removeScrollbarElement.id = "remove-scrollbar";
removeScrollbarElement.textContent +=
  "html::-webkit-scrollbar{display:none !important}";
removeScrollbarElement.textContent +=
  "body::-webkit-scrollbar{display:none !important}";

const setStorageKey = (key, value) => {
  chrome.storage.sync.set({
    [key]: value,
  });
};

const getStorageKey = (key) => {
  chrome.storage.sync.get([key], (keys) => {
    if (keys == null) {
      setStorageKey(key, true);
      resolve(true);
    } else {
      resolve(keys[key]);
    }
  });
};

const fetchKeys = () => {
  const result = {};

  result["isHeaderFixed"] = getStorageKey("isHeaderFixed");
  result["isScrollbarShown"] = getStorageKey("isScrollbarShown");

  return result;
};

const toggleHeader = (header, shouldShow) => {
  const { isHeaderFixed } = fetchKeys();
  // TODO: Find better way to tell if we're on video page
  const videoWrapper = document.getElementsByClassName(
    "video-player-wrapper"
  )[0];
  if (!shouldShow && videoWrapper && !isHeaderFixed) {
    header.style.display = "none";
  } else {
    header.style.display = "flex";
  }
};

const toggleScrollbar = (shouldShow) => {
  if (shouldShow === false) {
    document.body.appendChild(removeScrollbarElement);
  } else if (shouldShow === true) {
    const removeScrollbar = document.getElementById("remove-scrollbar");

    if (removeScrollbar) {
      removeScrollbar.remove();
    }
  }
};

const init = async () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(async (mutation) => {
      if (mutation.type == "childList") {
        // TODO: Expand this, it's only temporary
        let { isHeaderFixed, isScrollbarShown } = await fetchKeys();

        const scroller = document.getElementById("template_scroller");
        const videoWrapper = document.getElementsByClassName(
          "video-player-wrapper"
        )[0];
        const verifyEmail = document.getElementsByClassName(
          "c-broadcast-message-wrapper"
        )[0];
        const header = document.getElementsByClassName("erc-header")[0];
        const headerContainer =
          document.getElementsByClassName("header-content")[0];

        videoWrapper.style.height = '100vh';

        if (header && headerContainer && !initializedHeaderState) {
          initializedHeaderState = true;
          header.style.zIndex = 10000;
          header.style.left = 0;
          header.style.right = 0;
          header.style.height = '3.75rem';
          header.style.minWidth = '20rem';

          chrome.runtime.onMessage.addListener(
            (req) => {
              if (req.msg === "toggle_header") {
                isHeaderFixed = isHeaderFixed === true ? false : true;
                setStorageKey("isHeaderFixed", isHeaderFixed);

                if (!isHeaderFixed && initializedVideoState) {
                  toggleHeader(headerContainer, false);
                } else {
                  toggleHeader(headerContainer, true);
                }
              }
            }
          );
        }

        if (header && videoWrapper && !initializedVideoState) {
          initializedVideoState = true;
          initializedNonVideoPageState = false;
          header.style.position = "absolute";

          header.onmouseenter = () => {
            if (scheduledAnimationFrame) return;
            scheduledAnimationFrame = true;
            requestAnimationFrame(async () => {
              await toggleHeader(headerContainer, true);
              scheduledAnimationFrame = false;
            });
          };

          header.onmouseleave = () => {
            if (scheduledAnimationFrame) return;
            scheduledAnimationFrame = true;
            requestAnimationFrame(async () => {
              await toggleHeader(headerContainer, false);
              scheduledAnimationFrame = false;
            });
          };

          toggleHeader(headerContainer, isHeaderFixed);
          toggleScrollbar(isScrollbarShown);
        } else if (header && !videoWrapper && !initializedNonVideoPageState) {
          initializedVideoState = false;
          initializedNonVideoPageState = true;

          header.style.position = "relative";
          header.onmouseover = null;
          header.onmouseout = null;

          toggleHeader(headerContainer, true);
          toggleScrollbar(true);
        }

        if (scroller && !initializedScrollerState) {
          initializedScrollerState = true;
          scroller.style.padding = 0;
        }

        if (verifyEmail && !intializedVerifyEmailState) {
          initializedVerifyEmailState = true;
          verifyEmail.style.display = "none";
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    attributes: true,
    characterData: false,
    subtree: true,
  });
};

(async () => await init())();
