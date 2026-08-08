import * as FileSystem from "expo-file-system/legacy";

type LocalFileSystemAdapter = Pick<
  typeof FileSystem,
  | "cacheDirectory"
  | "documentDirectory"
  | "deleteAsync"
  | "getInfoAsync"
  | "readDirectoryAsync"
>;

export interface LocalProfileDataFilesStore {
  clearAppPrivateUserFiles(): Promise<void>;
}

type CreateLocalProfileDataFilesStoreParams = {
  fileSystem?: LocalFileSystemAdapter;
};

const APP_PRIVATE_DOCUMENT_DIRECTORIES = [
  "exports/",
  "reports-exports/",
] as const;

const joinDirectoryUri = (root: string, child: string): string =>
  `${root.endsWith("/") ? root : `${root}/`}${child}`;

const clearDirectoryContents = async (
  fileSystem: LocalFileSystemAdapter,
  directoryUri: string,
): Promise<void> => {
  const directoryInfo = await fileSystem.getInfoAsync(directoryUri);
  if (!directoryInfo.exists) {
    return;
  }

  const childNames = await fileSystem.readDirectoryAsync(directoryUri);
  await Promise.all(
    childNames.map((childName) =>
      fileSystem.deleteAsync(joinDirectoryUri(directoryUri, childName), {
        idempotent: true,
      }),
    ),
  );
};

export const createLocalProfileDataFilesStore = ({
  fileSystem = FileSystem,
}: CreateLocalProfileDataFilesStoreParams = {}): LocalProfileDataFilesStore => ({
  async clearAppPrivateUserFiles() {
    if (fileSystem.cacheDirectory) {
      await clearDirectoryContents(fileSystem, fileSystem.cacheDirectory);
    }

    const documentDirectory = fileSystem.documentDirectory;
    if (!documentDirectory) {
      return;
    }

    await Promise.all(
      APP_PRIVATE_DOCUMENT_DIRECTORIES.map((directoryName) =>
        fileSystem.deleteAsync(
          joinDirectoryUri(documentDirectory, directoryName),
          { idempotent: true },
        ),
      ),
    );
  },
});
