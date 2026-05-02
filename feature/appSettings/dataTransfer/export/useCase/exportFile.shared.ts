import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import {
  DataTransferResult,
  DataTransferValidationError,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

type SaveFilePayload = {
  fileName: string;
  mimeType: string;
  content:
    | {
        kind: "text";
        value: string;
      }
    | {
        kind: "base64";
        value: string;
      };
  dialogTitle: string;
  uti?: string;
};

const downloadOnWeb = async ({
  fileName,
  mimeType,
  content,
}: SaveFilePayload): Promise<void> => {
  if (typeof document === "undefined") {
    throw new Error("Web export is unavailable on this platform.");
  }

  const blob =
    content.kind === "text"
      ? new Blob([content.value], { type: mimeType })
      : new Blob(
          [
            Uint8Array.from(atob(content.value), (character) =>
              character.charCodeAt(0),
            ),
          ],
          { type: mimeType },
        );
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
};

const saveToAndroidLocalDirectory = async ({
  fileName,
  mimeType,
  content,
}: SaveFilePayload): Promise<boolean> => {
  const initialDownloadsUri =
    FileSystem.StorageAccessFramework.getUriForDirectoryInRoot("Download");
  const directoryPermission =
    await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
      initialDownloadsUri,
    );

  if (!directoryPermission.granted) {
    return false;
  }

  const targetFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
    directoryPermission.directoryUri,
    fileName,
    mimeType,
  );

  await FileSystem.StorageAccessFramework.writeAsStringAsync(
    targetFileUri,
    content.value,
    {
      encoding:
        content.kind === "text"
          ? FileSystem.EncodingType.UTF8
          : FileSystem.EncodingType.Base64,
    },
  );

  return true;
};

export const saveExportFile = async ({
  fileName,
  mimeType,
  content,
  dialogTitle,
  uti,
}: SaveFilePayload): Promise<DataTransferResult<{ fileName: string }>> => {
  try {
    if (Platform.OS === "web") {
      await downloadOnWeb({
        fileName,
        mimeType,
        content,
        dialogTitle,
        uti,
      });
    } else if (Platform.OS === "android") {
      const savedToLocalDirectory = await saveToAndroidLocalDirectory({
        fileName,
        mimeType,
        content,
        dialogTitle,
        uti,
      });

      if (!savedToLocalDirectory) {
        return {
          success: false,
          error: DataTransferValidationError(
            "Downloads folder access is required to save on device. Please allow access and select Downloads.",
          ),
        };
      }
    } else {
      const writableDirectory =
        FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!writableDirectory) {
        return {
          success: false,
          error: DataTransferValidationError(
            "Unable to access local storage for export.",
          ),
        };
      }

      const outputUri = `${writableDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(outputUri, content.value, {
        encoding:
          content.kind === "text"
            ? FileSystem.EncodingType.UTF8
            : FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(outputUri, {
          mimeType,
          dialogTitle,
          UTI: uti,
        });
      }
    }

    return {
      success: true,
      value: {
        fileName,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: DataTransferValidationError(
        error instanceof Error
          ? error.message
          : "Unable to save the exported file.",
      ),
    };
  }
};
