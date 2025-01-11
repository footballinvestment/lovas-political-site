// src/lib/cloudflare/client.ts

interface CloudflareStreamResponse {
  result: {
    uid: string;
    thumbnail: string;
    playback: {
      hls: string;
      dash: string;
    };
    readyToStream: boolean;
    status: {
      state: string;
      pctComplete: number;
      errorReasonCode: string;
      errorReasonText: string;
    };
  };
  success: boolean;
  errors: string[];
  messages: string[];
}

interface UploadProgressCallback {
  (progress: number): void;
}

export async function uploadToCloudflareStream(
  file: Buffer | Blob,
  filename: string,
  onProgress?: UploadProgressCallback
): Promise<CloudflareStreamResponse> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Cloudflare környezeti változók hiányoznak");
  }

  const formData = new FormData();
  formData.append("file", new Blob([file]), filename);

  const xhr = new XMLHttpRequest();

  // Progress tracking
  if (onProgress) {
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    };
  }

  // Promise wrapper for XHR
  const uploadPromise = new Promise<CloudflareStreamResponse>(
    (resolve, reject) => {
      xhr.open(
        "POST",
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`
      );
      xhr.setRequestHeader("Authorization", `Bearer ${apiToken}`);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error("Hibás válasz a szervertől"));
          }
        } else {
          reject(new Error(`HTTP hiba: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Hálózati hiba történt"));
      xhr.onabort = () => reject(new Error("Feltöltés megszakítva"));

      xhr.send(formData);
    }
  );

  return uploadPromise;
}

export async function getVideoStatus(
  videoId: string
): Promise<CloudflareStreamResponse> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Cloudflare környezeti változók hiányoznak");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Cloudflare API hiba: ${response.statusText}\n${JSON.stringify(
        errorData
      )}`
    );
  }

  const data = await response.json();
  return data;
}

export async function deleteVideo(videoId: string): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Cloudflare környezeti változók hiányoznak");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Videó törlési hiba: ${response.statusText}\n${JSON.stringify(errorData)}`
    );
  }
}
