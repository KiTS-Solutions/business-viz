// Single source of truth for the deployed base path, shared between
// next.config.ts (which sets Next's basePath/assetPrefix for its own
// managed assets) and any hand-written asset reference in app code
// (e.g. a plain <img src>), which Next does NOT rewrite automatically —
// confirmed by inspecting the built output: next/image under
// images.unoptimized did not prepend basePath either. Never hardcode
// "/Data-Vis" anywhere else; import BASE_PATH instead.
//
// MUST match the GitHub repo name exactly (case-sensitive — GitHub Pages
// project sites are served at github.io/<repo-name>/). If the repo is
// renamed again, update this constant in the same commit as the rename,
// or the deployed site will 404 every CSS/JS asset and render as raw
// unstyled HTML — this happened once already when the repo was renamed
// from "business-viz" to "Data-Vis" without updating this value.
const REPO_NAME = "Data-Vis";
const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";

export const BASE_PATH = isGithubPagesBuild ? `/${REPO_NAME}` : "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
