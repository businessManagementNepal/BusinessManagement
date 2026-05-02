export type SyncLockState = {
  startedAt: number;
};

export type SyncLockAcquireResult =
  | {
      acquired: true;
      state: SyncLockState;
      release: () => void;
    }
  | {
      acquired: false;
      state: SyncLockState;
    };

export interface SyncLock {
  acquire(): SyncLockAcquireResult;
  getState(): SyncLockState | null;
}

export const createSyncLock = (): SyncLock => {
  let activeState: SyncLockState | null = null;

  return {
    acquire(): SyncLockAcquireResult {
      if (activeState) {
        return {
          acquired: false,
          state: activeState,
        };
      }

      activeState = {
        startedAt: Date.now(),
      };

      return {
        acquired: true,
        state: activeState,
        release: () => {
          activeState = null;
        },
      };
    },

    getState(): SyncLockState | null {
      return activeState;
    },
  };
};

export const syncLock = createSyncLock();
