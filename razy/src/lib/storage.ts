import { randomUUID } from "node:crypto";

const sanitizeFilename = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "upload";

export async function createUploadUrl(name: string, size: number, contentType: string) {
  const safe = sanitizeFilename(name);
  const extension = safe.includes(".") ? safe.slice(safe.lastIndexOf(".")) : ".bin";
  const key = `quarantine/${randomUUID()}${extension}`;
  return {
    key,
    uploadUrl: `https://example.invalid/${encodeURIComponent(key)}`,
    objectKey: key,
    safeName: safe,
    sizeBytes: Number(size),
    contentType,
  };
}

export async function inspectQuarantinedObject(key: string, size: number, name: string, contentType: string) {
  if (!/^quarantine\/[0-9a-f-]{36}\.(apk|zip|png|jpg|jpeg|webp|pdf)$/i.test(key)) {
    throw new Error("Invalid quarantined object reference");
  }
  if (!Number.isFinite(size) || size <= 0 || size > 2 * 1024 * 1024 * 1024) {
    throw new Error("File size is not allowed");
  }
  return {
    objectKey: key,
    safeName: sanitizeFilename(name),
    sizeBytes: Number(size),
    sha256: "stub-sha256",
    contentType,
  };
}

export async function getPublishedObject(_key: string) {
  return {
    Body: (async function* () {
      yield new Uint8Array([0]);
    })(),
  } as any;
}

export async function quarantineToPublished(key: string) {
  if (!key.startsWith("quarantine/")) return key;
  return key.replace(/^quarantine\//, "published/");
}

export async function getObjectSignedUrl(_key: string) {
  return `https://example.invalid/${encodeURIComponent(_key)}`;
}
