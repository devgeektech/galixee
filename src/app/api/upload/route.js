import { promises as fs } from "fs";
import path from "path";

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {}
}

function randomName(ext = "") {
  const base = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return ext ? `${base}.${ext}` : base;
}

async function saveBufferToUploads(buffer, suggestedName = "file", mimeType = "application/octet-stream") {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await ensureDir(uploadsDir);

  const extFromName = path.extname(suggestedName || "").replace(/^\./, "");
  const ext = extFromName || (mimeType?.split("/")[1] || "bin");
  const fileName = randomName(ext);
  const filePath = path.join(uploadsDir, fileName);
  await fs.writeFile(filePath, buffer);
  return {
    url: `/uploads/${fileName}`,
    mimeType: mimeType || null,
  };
}

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 1) Multipart form-data with a "file" field
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || typeof file === "string") {
        return Response.json({ error: "No file uploaded" }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await saveBufferToUploads(buffer, file.name, file.type);
      return Response.json(result);
    }

    // 2) JSON body { url } to fetch and save
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      if (body?.url) {
        const res = await fetch(body.url);
        if (!res.ok) {
          return Response.json({ error: "Failed to fetch remote URL" }, { status: 400 });
        }
        const mimeType = res.headers.get("content-type") || null;
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await saveBufferToUploads(buffer, path.basename(new URL(body.url).pathname), mimeType);
        return Response.json(result);
      }
      // 3) JSON body { base64 }
      if (body?.base64) {
        // Accept formats: "data:mime/type;base64,AAA..." or plain base64
        let base64 = body.base64;
        let mimeType = null;
        const match = /^data:([^;]+);base64,(.*)$/.exec(base64);
        if (match) {
          mimeType = match[1];
          base64 = match[2];
        }
        const buffer = Buffer.from(base64, "base64");
        const result = await saveBufferToUploads(buffer, "upload", mimeType || "application/octet-stream");
        return Response.json(result);
      }
      // Unknown JSON payload
      return Response.json({ error: "Missing url or base64 in JSON" }, { status: 400 });
    }

    // 4) Raw octet-stream
    const raw = await request.arrayBuffer();
    if (raw && raw.byteLength > 0) {
      const buffer = Buffer.from(raw);
      const result = await saveBufferToUploads(buffer, "upload", request.headers.get("content-type") || "application/octet-stream");
      return Response.json(result);
    }

    return Response.json({ error: "Unsupported request" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: "Upload failed", details: err?.message || String(err) }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    ok: true,
    message: "Upload route is reachable. Use POST to upload a file.",
    endpoints: [
      "POST multipart/form-data with 'file'",
      "POST application/json { url }",
      "POST application/json { base64 }",
      "POST application/octet-stream (raw)"
    ],
  });
}
