import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export type DocumentExportAction = "print" | "share" | "save";

export type DocumentExportPayload = {
  html: string;
  fileName: string;
  title: string;
  action: DocumentExportAction;
};

export type DocumentExportResult = {
  success: true;
  uri: string | null;
} | {
  success: false;
  error: string;
};

const sanitizeFileName = (value: string): string => {
  const normalized = value
    .trim()
    .replaceAll(/[^a-zA-Z0-9-_ ]/g, "")
    .replaceAll(/\s+/g, "_");
  if (normalized.length > 0) {
    return normalized;
  }
  return `document_${Date.now()}`;
};

const openWebPrintPreview = (html: string): DocumentExportResult => {
  const popup = window.open("", "_blank", "width=1000,height=760");
  if (!popup) {
    return {
      success: false,
      error: "Unable to open print preview. Please allow popups.",
    };
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 250);
  return {
    success: true,
    uri: null,
  };
};

const ensureExportDirectory = async (): Promise<string> => {
  const root = FileSystem.documentDirectory;
  if (!root) {
    throw new Error("Unable to access device document directory.");
  }
  const dir = `${root}exports/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
};

const savePdfToLocalExports = async ({
  pdfUri,
  fileName,
}: {
  pdfUri: string;
  fileName: string;
}): Promise<string> => {
  const exportDirectory = await ensureExportDirectory();
  const targetUri = `${exportDirectory}${sanitizeFileName(fileName)}.pdf`;
  await FileSystem.copyAsync({
    from: pdfUri,
    to: targetUri,
  });
  return targetUri;
};

export const exportDocument = async (
  payload: DocumentExportPayload,
): Promise<DocumentExportResult> => {
  try {
    if (Platform.OS === "web") {
      return openWebPrintPreview(payload.html);
    }

    if (payload.action === "print") {
      await Print.printAsync({
        html: payload.html,
      });
      return {
        success: true,
        uri: null,
      };
    }

    const printResult = await Print.printToFileAsync({
      html: payload.html,
      base64: false,
    });

    if (payload.action === "save") {
      const savedUri = await savePdfToLocalExports({
        pdfUri: printResult.uri,
        fileName: payload.fileName,
      });
      return {
        success: true,
        uri: savedUri,
      };
    }

    if (!(await Sharing.isAvailableAsync())) {
      return {
        success: false,
        error: "Sharing is not available on this device.",
      };
    }

    const savedUri = await savePdfToLocalExports({
      pdfUri: printResult.uri,
      fileName: payload.fileName,
    });
    await Sharing.shareAsync(savedUri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: payload.title,
    });

    return {
      success: true,
      uri: savedUri,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to export document.",
    };
  }
};
