/**
 * build-registry.js
 *
 * Generates static JSON files in public/r/ from registry.json.
 * Run: pnpm registry:build (or node scripts/build-registry.js)
 *
 * This is for static hosting / CDN scenarios.
 * For dynamic serving, the API routes at /api/v1/ui/ handle it at runtime.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, "registry.json");
const OUTPUT_DIR = path.join(ROOT, "public", "r");

if (!fs.existsSync(REGISTRY_PATH)) {
  console.error("registry.json not found at", REGISTRY_PATH);
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let successCount = 0;
let errorCount = 0;

for (const item of registry.items) {
  try {
    const registryItem = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: item.name,
      type: item.type,
      description: item.description || "",
      dependencies: item.dependencies || [],
      registryDependencies: item.registryDependencies || [],
      files: [],
    };

    for (const file of item.files) {
      const filePath = path.join(ROOT, file.path);

      if (!fs.existsSync(filePath)) {
        console.warn(`  Warning: File not found: ${filePath}`);
        continue;
      }

      const content = fs.readFileSync(filePath, "utf-8");
      registryItem.files.push({
        path: file.path,
        type: file.type,
        content: content,
      });
    }

    const outputPath = path.join(OUTPUT_DIR, `${item.name}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(registryItem, null, 2));
    successCount++;
    console.log(`  Built: ${item.name}.json`);
  } catch (err) {
    errorCount++;
    console.error(`  Error building ${item.name}:`, err.message);
  }
}

// Write the index
const indexPayload = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: registry.name,
  homepage: registry.homepage,
  items: registry.items.map((item) => ({
    name: item.name,
    type: item.type,
    description: item.description || "",
    dependencies: item.dependencies || [],
    registryDependencies: item.registryDependencies || [],
  })),
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, "index.json"),
  JSON.stringify(indexPayload, null, 2)
);

console.log(
  `\nDone! Built ${successCount} items (${errorCount} errors) -> public/r/`
);
