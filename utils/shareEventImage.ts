import * as FileSystem from "expo-file-system";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

export async function shareEventImage({
  imageUrl,
  title,
  link,
}: {
  imageUrl: string;
  title: string;
  link: string;
}) {
  if (!FileSystem.cacheDirectory) {
    throw new Error("Image sharing is unavailable on this device.");
  }

  const filename = `gathergo-event-${uuidv4()}`;
  const path = `${FileSystem.cacheDirectory}${filename}`;
  try {
    const image = await FileSystem.downloadAsync(imageUrl, path);
    if (
      image.status < 200 ||
      image.status >= 300 ||
      !image.mimeType?.startsWith("image/")
    ) {
      throw new Error(
        "Could not download the event cover. You can share its link instead.",
      );
    }
    const base64 = await FileSystem.readAsStringAsync(image.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Load the native module only when sharing, so link/QR sharing still loads on web.
    const { default: NativeShare } = await import("react-native-share");
    await NativeShare.open({
      title,
      subject: title,
      message: `${title}\n${link}`,
      url: `data:${image.mimeType};base64,${base64}`,
      type: image.mimeType,
      filename,
      useInternalStorage: true,
      failOnCancel: false,
    });
  } finally {
    await FileSystem.deleteAsync(path, { idempotent: true }).catch((error) =>
      console.warn("Event cover cache cleanup failed", error),
    );
  }
}
