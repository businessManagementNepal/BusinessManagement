import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "elekha.device.installation_id";

type SecureStorageAdapter = Pick<
  typeof SecureStore,
  "getItemAsync" | "setItemAsync" | "deleteItemAsync"
>;

export interface DeviceIdStore {
  getDeviceId(): Promise<string>;
  clearDeviceId(): Promise<void>;
}

type CreateDeviceIdStoreParams = {
  secureStore?: SecureStorageAdapter;
  key?: string;
};

const normalizeDeviceId = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const createRandomDeviceId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createDeviceIdStore = ({
  secureStore = SecureStore,
  key = DEVICE_ID_KEY,
}: CreateDeviceIdStoreParams = {}): DeviceIdStore => ({
  async getDeviceId() {
    const existingDeviceId = normalizeDeviceId(await secureStore.getItemAsync(key));
    if (existingDeviceId) {
      return existingDeviceId;
    }

    const createdDeviceId = createRandomDeviceId();
    await secureStore.setItemAsync(key, createdDeviceId);
    return createdDeviceId;
  },

  async clearDeviceId() {
    await secureStore.deleteItemAsync(key);
  },
});
