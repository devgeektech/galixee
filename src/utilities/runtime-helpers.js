import React from 'react';

function useHandleStreamResponse({
  onChunk,
  onFinish
}) {
  const handleStreamResponse = React.useCallback(
    async (response) => {
      if (response.body) {
        const reader = response.body.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let content = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              onFinish(content);
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            content += chunk;
            onChunk(content);
          }
        }
      }
    },
    [onChunk, onFinish]
  );
  const handleStreamResponseRef = React.useRef(handleStreamResponse);
  React.useEffect(() => {
    handleStreamResponseRef.current = handleStreamResponse;
  }, [handleStreamResponse]);
  return React.useCallback((response) => handleStreamResponseRef.current(response), []); 
}

function useUpload() {
  const [loading, setLoading] = React.useState(false);
  const upload = React.useCallback(async (input) => {
    try {
      setLoading(true);
      let response;
      const getBaseUrl = () => {
        if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
        return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      };
      const base = getBaseUrl();
      if ('reactNativeAsset' in input && input.reactNativeAsset) {
        if (input.reactNativeAsset.file) {
          const formData = new FormData();
          formData.append("file", input.reactNativeAsset.file);
          response = await fetch(`${base}/api/upload/`, {
            method: "POST",
            body: formData
          });
        } else {
          const response = await fetch(`${base}/api/upload/presign/`, {
            method: 'POST',
          })
          const ct = response.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Presign failed: Non-JSON response (${response.status}). ${text.slice(0,200)}`);
          }
          const { secureSignature, secureExpire } = await response.json();
          if (typeof client === 'undefined' || !client?.uploadFile) {
            return { error: 'Upload client is not configured in this environment.' };
          }
          const result = await client.uploadFile(input.reactNativeAsset, {
            fileName: input.reactNativeAsset.name ?? input.reactNativeAsset.uri.split("/").pop(),
            contentType: input.reactNativeAsset.mimeType,
            secureSignature,
            secureExpire
          });
          return { url: `${process.env.EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL}/${result.uuid}/`, mimeType: result.mimeType || null };
        }
      } else if ("file" in input && input.file) {
        const formData = new FormData();
        formData.append("file", input.file);
        response = await fetch(`${base}/api/upload/`, {
          method: "POST",
          body: formData
        });
      } else if ("url" in input) {
        response = await fetch(`${base}/api/upload/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: input.url })
        });
      } else if ("base64" in input) {
        response = await fetch(`${base}/api/upload/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ base64: input.base64 })
        });
      } else {
        response = await fetch(`${base}/api/upload/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream"
          },
          body: input.buffer
        });
      }
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error("Upload failed: File too large.");
        }
        const maybeText = await response.text().catch(() => "");
        throw new Error(`Upload failed (${response.status}). ${maybeText.slice(0, 200)}`);
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Unexpected non-JSON response. ${text.slice(0,200)}`);
      }
      const data = await response.json();
      return { url: data.url, mimeType: data.mimeType || null };
    } catch (uploadError) {
      if (uploadError instanceof Error) {
        return { error: uploadError.message };
      }
      if (typeof uploadError === "string") {
        return { error: uploadError };
      }
      return { error: "Upload failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export {
  useHandleStreamResponse,
  useUpload,
}
