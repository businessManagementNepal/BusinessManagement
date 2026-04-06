import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export type PickedImage = {
  uri: string;
  fileName: string;
  mimeType: string;
  dataUrl: string | null;
};

const DEFAULT_MIME_TYPE = "image/jpeg";

const inferMimeType = ({
  fileName,
  providedMimeType,
}: {
  fileName: string;
  providedMimeType?: string | null;
}): string => {
  if (providedMimeType && providedMimeType.trim().length > 0) {
    return providedMimeType;
  }

  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "png") {
    return "image/png";
  }
  if (extension === "webp") {
    return "image/webp";
  }

  return DEFAULT_MIME_TYPE;
};

const resolveFileName = ({
  uri,
  providedFileName,
}: {
  uri: string;
  providedFileName?: string | null;
}): string => {
  if (providedFileName && providedFileName.trim().length > 0) {
    return providedFileName;
  }

  const fallbackName = uri.split("/").pop()?.trim();
  if (fallbackName) {
    return fallbackName;
  }

  return `image-${Date.now()}.jpg`;
};

const readBlobAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to read image data."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(new Error("Unable to read selected image."));
    };
    reader.readAsDataURL(blob);
  });

const readWebImageUriAsDataUrl = async (uri: string): Promise<string | null> => {
  if (Platform.OS !== "web") {
    return null;
  }

  try {
    const response = await fetch(uri);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return await readBlobAsDataUrl(blob);
  } catch {
    return null;
  }
};

export async function pickImageFromLibrary(): Promise<PickedImage | null> {
  try {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.85,
      base64: true,
      exif: false,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return null;
    }

    const asset = result.assets[0];
    const fileName = resolveFileName({
      uri: asset.uri,
      providedFileName: asset.fileName,
    });
    const mimeType = inferMimeType({
      fileName,
      providedMimeType: asset.mimeType,
    });

    const dataUrlFromBase64 =
      asset.base64 && asset.base64.length > 0
        ? `data:${mimeType};base64,${asset.base64}`
        : null;

    const dataUrl =
      dataUrlFromBase64 ?? (await readWebImageUriAsDataUrl(asset.uri));

    return {
      uri: asset.uri,
      fileName,
      mimeType,
      dataUrl,
    };
  } catch {
    return null;
  }
}
