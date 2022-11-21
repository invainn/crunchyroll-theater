type StorageValue = string | boolean;

export class ChromeStorage {
  public static setStorageKey(key: string, value: StorageValue) {
    chrome.storage.sync.set({
      [key]: value,
    });
  }

  public static async fetchStorageValue(key: string): Promise<StorageValue> {
    return new Promise((resolve) => {
      chrome.storage.sync.get([key], (keys) => {
        if (!keys) {
          this.setStorageKey(key, true);
          resolve(true);
        }

        resolve(keys[key]);
      });
    });
  }
}
