import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.RAZY_SERVER_URL;

if (serverUrl) {
  const parsedUrl = new URL(serverUrl);
  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error("RAZY_SERVER_URL must be an HTTPS website origin without credentials, path, query, or fragment.");
  }
}

const config: CapacitorConfig = {
  appId: "com.razy.app",
  appName: "RAZY",
  webDir: "public",
  ...(serverUrl ? { server: { url: serverUrl, cleartext: false } } : {}),
};

export default config;