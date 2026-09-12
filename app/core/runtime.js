const STORAGE_KEY = "starcard_state_v1";

export function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const monthValue = date.getMonth() + 1;
  const dayValue = date.getDate();
  const month = monthValue < 10 ? `0${monthValue}` : `${monthValue}`;
  const day = dayValue < 10 ? `0${dayValue}` : `${dayValue}`;

  return `${year}-${month}-${day}`;
}

export function readState(storageApi, key = STORAGE_KEY) {
  return new Promise((resolve) => {
    storageApi.get({
      key,
      success(data) {
        if (!data) {
          resolve(null);
          return;
        }

        try {
          resolve(JSON.parse(data));
        } catch (error) {
          resolve(null);
        }
      },
      fail() {
        resolve(null);
      }
    });
  });
}

export function writeState(storageApi, state, key = STORAGE_KEY) {
  return new Promise((resolve, reject) => {
    storageApi.set({
      key,
      value: JSON.stringify(state),
      success() {
        resolve();
      },
      fail() {
        reject(new Error("failed to persist state"));
      }
    });
  });
}
