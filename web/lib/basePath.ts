// Single source of truth for the deployed base path, shared between
// next.config.ts (which sets Next's basePath/assetPrefix for its own
// managed assets) and any hand-written asset reference in app code
// (e.g. a plain <img src>), which Next does NOT rewrite automatically —
// confirmed by inspecting the built output: next/image under
// images.unoptimized did not prepend basePath either. Never hardcode
// "/business-viz" anywhere else; import BASE_PATH instead.
const REPO_NAME = "business-viz";
const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";

export const BASE_PATH = isGithubPagesBuild ? `/${REPO_NAME}` : "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
