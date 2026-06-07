const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const UI_ROOTS = [
  path.join(ROOT, "feature"),
  path.join(ROOT, "shared", "components", "reusable"),
];

// Temporary exceptions for legacy UI that still needs theme migration.
// Keep this list shrinking over time; do not add new files casually.
const LEGACY_EXCEPTIONS = new Set([
  "feature/pos/ui/PosReceiptDetail.tsx",
  "feature/pos/ui/PosReceiptModal.tsx",
  "feature/pos/ui/PosSaleHistory.tsx",
  "feature/startup/ui/StartupErrorScreen.tsx",
  "feature/startup/ui/StartupLoadingScreen.tsx",
]);

const STATIC_COLOR_IMPORT_PATTERN = /from\s+["'][^"']*theme\/colors["'];?/;
const UI_FILE_PATTERN = /\.(ts|tsx)$/;

const toRelativePath = (absolutePath) =>
  path.relative(ROOT, absolutePath).split(path.sep).join("/");

const collectUiFiles = (directoryPath) => {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectUiFiles(absolutePath));
      continue;
    }

    if (!UI_FILE_PATTERN.test(entry.name)) {
      continue;
    }

    files.push(toRelativePath(absolutePath));
  }

  return files;
};

const offenders = UI_ROOTS.flatMap((rootPath) => collectUiFiles(rootPath))
  .filter((relativePath) => !LEGACY_EXCEPTIONS.has(relativePath))
  .filter((relativePath) => {
    const absolutePath = path.join(ROOT, relativePath);
    const source = fs.readFileSync(absolutePath, "utf8");
    return STATIC_COLOR_IMPORT_PATTERN.test(source);
  })
  .sort();

if (offenders.length > 0) {
  console.error(
    "Static theme color imports are not allowed in UI files outside the legacy exception list:",
  );
  offenders.forEach((offender) => {
    console.error(`- ${offender}`);
  });
  process.exit(1);
}

console.log("No unexpected static theme color imports found in UI files.");
