import { createStackIntegration } from './stack.mjs';
import { localCompose } from './local-compose.mjs';
export function createDeploymentIntegration() { return {
  stack: createStackIntegration(),
  localCompose,
  "volumes": [
    "profiles"
  ],
  "runtime": {},
  "businessBindings": {},
  "initialFiles": [],
  "privateDocuments": {
    "directory": "/data/profiles/documents",
    "environment": "PRAXIS_PROFILES_DIR"
  }
}; }
