// Source-only local installation recipe. Preserve volume identities during upgrades.
export const localCompose = {
  "services": {},
  "volumes": {
    "profiles-data": {}
  },
  "initializeVolumes": [],
  "webVolumes": []
};
