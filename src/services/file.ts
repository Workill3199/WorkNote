import axios from "axios";

export interface UploadedFileResponse {
  url: string;
}

export async function uploadFilesToServer(
  files: any[],
): Promise<UploadedFileResponse[]> {
  const endpoint =
    process.env.EXPO_PUBLIC_UPLOAD_ENDPOINT ||
    process.env.UPLOAD_ENDPOINT ||
    "http://mayola.net.ar:9993/upload";

  const responses: UploadedFileResponse[] = [];

  for (const file of files) {
    const formData = new FormData();

    // En web, si viene un File nativo, lo adjuntamos directamente para que axios envíe los bytes.
    if (file?.fileRef) {
      try {
        formData.append("file", file.fileRef);
      } catch {
        // fallback por si el navegador requiere nombre
        formData.append("file", file.fileRef, file?.fileRef?.name || file?.name || "archivo");
      }
    } else {
      // En mobile/Expo, utilizamos el objeto con uri, nombre y tipo
      formData.append("file", {
        uri: file.uri,
        name: file.name || "archivo",
        type: file.mimeType || file.type || "application/octet-stream",
      } as any);
    }

    const token =
      process.env.EXPO_PUBLIC_UPLOAD_TOKEN ||
      process.env.UPLOAD_TOKEN ||
      "";
    if (token) {
      formData.append("token", token);
    }

    try {
      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      console.log("✅ Respuesta del servidor:", response.data);

      if (response.data?.url) {
        responses.push({ url: response.data.url });
      } else {
        console.warn("⚠️ Respuesta inesperada del servidor:", response.data);
      }
    } catch (error: any) {
      console.error("❌ Error al subir archivo:", error.response || error.message);
      throw new Error("No se pudieron subir los archivos");
    }
  }

  return responses;
}
