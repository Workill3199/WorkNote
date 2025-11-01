import axios from "axios";

export interface UploadedFileResponse {
  url: string;
}

export async function uploadFilesToServer(
  files: any[],
): Promise<UploadedFileResponse[]> {
  const endpoint = "http://mayola.net.ar:9993/upload";

  const responses: UploadedFileResponse[] = [];

  for (const file of files) {
    const formData = new FormData();

    formData.append("file", {
      uri: file.uri,
      name: file.name || "archivo",
      type: file.mimeType || file.type || "application/octet-stream",
    } as any);

    formData.append("token", "OISAHJD)IU!@Haisjfd+ighr9uegh@*148rgfhweubidhj24gt9IUDHFSUH#*(Rh3");

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
