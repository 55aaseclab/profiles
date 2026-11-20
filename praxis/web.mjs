export function createWebIntegration() {
  return {
    "slug": "profiles",
    "policy": "document-owner",
    "kind": "private-documents",
    "directory": "public",
    "assets": [
      "/app.js",
      "/app.css"
    ],
    "directoryEnv": "PRAXIS_PROFILES_DIR",
    "mountTarget": "/run/praxis-documents/profiles",
    "privateConfigKey": "profiles"
  };
}
