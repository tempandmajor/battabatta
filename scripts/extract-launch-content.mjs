import { extractDocxText, parseLaunchContentText } from "./lib/launch-content.mjs";

const input = process.argv[2];

try {
  console.log(JSON.stringify(parseLaunchContentText(extractDocxText(input)), null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not extract launch content");
  process.exit(1);
}
