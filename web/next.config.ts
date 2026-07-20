import type { NextConfig } from "next";

const REPO_NAME = "business-viz";
const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isGithubPagesBuild ? `/${REPO_NAME}` : "",
  assetPrefix: isGithubPagesBuild ? `/${REPO_NAME}/` : "",
};

export default nextConfig;
