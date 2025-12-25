#!/usr/bin/env bun

/**
 * Automatic version bump script based on Conventional Commits
 *
 * Analyzes commits since last tag for each package and bumps versions:
 * - feat: → minor bump
 * - fix: → patch bump
 * - BREAKING CHANGE: or !: → major bump
 */

import { $ } from "bun";

const PACKAGES = ["api", "admin", "web", "shared"] as const;
const PACKAGE_PREFIX = "@marcomarchione";

type BumpType = "major" | "minor" | "patch" | null;

interface PackageUpdate {
  name: string;
  oldVersion: string;
  newVersion: string;
  bumpType: BumpType;
}

/**
 * Execute a shell command and return stdout
 */
async function exec(command: string): Promise<string> {
  const result = await $`sh -c ${command}`.quiet().nothrow();
  return result.stdout.toString().trim();
}

/**
 * Get the latest tag for a package
 */
async function getLatestTag(pkg: string): Promise<string | null> {
  const tagPattern = `${PACKAGE_PREFIX}/${pkg}@*`;
  const result = await exec(
    `git tag -l "${tagPattern}" --sort=-v:refname | head -n 1`
  );
  return result || null;
}

/**
 * Get commits since a tag (or all commits if no tag) for a specific path
 */
async function getCommitsSince(
  tag: string | null,
  path: string
): Promise<string[]> {
  const range = tag ? `${tag}..HEAD` : "HEAD";
  const result = await exec(
    `git log ${range} --format="%s%n%b---COMMIT_END---" -- ${path}`
  );

  if (!result) return [];

  return result
    .split("---COMMIT_END---")
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Analyze commits to determine bump type
 */
function analyzeBumpType(commits: string[]): BumpType {
  let hasFeat = false;
  let hasFix = false;

  for (const commit of commits) {
    // Check for breaking changes
    if (
      commit.includes("BREAKING CHANGE:") ||
      commit.includes("BREAKING-CHANGE:") ||
      /^[a-z]+(\([^)]+\))?!:/.test(commit)
    ) {
      return "major";
    }

    // Check for features
    if (/^feat(\([^)]+\))?:/.test(commit)) {
      hasFeat = true;
    }

    // Check for fixes
    if (/^fix(\([^)]+\))?:/.test(commit)) {
      hasFix = true;
    }
  }

  if (hasFeat) return "minor";
  if (hasFix) return "patch";
  return null;
}

/**
 * Increment version based on bump type
 */
function incrementVersion(version: string, bumpType: BumpType): string {
  if (!bumpType) return version;

  const [major, minor, patch] = version.split(".").map(Number);

  switch (bumpType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Read package.json version
 */
async function getPackageVersion(pkg: string): Promise<string> {
  const path =
    pkg === "root" ? "package.json" : `packages/${pkg}/package.json`;
  const content = await Bun.file(path).text();
  const json = JSON.parse(content);
  return json.version;
}

/**
 * Update package.json version
 */
async function updatePackageVersion(
  pkg: string,
  newVersion: string
): Promise<void> {
  const path =
    pkg === "root" ? "package.json" : `packages/${pkg}/package.json`;
  const content = await Bun.file(path).text();
  const json = JSON.parse(content);
  json.version = newVersion;
  await Bun.write(path, JSON.stringify(json, null, 2) + "\n");
}

/**
 * Create a git tag
 */
async function createTag(tag: string): Promise<void> {
  await exec(`git tag ${tag}`);
}

/**
 * Main function
 */
async function main() {
  console.log("🔍 Analyzing commits for version bumps...\n");

  const updates: PackageUpdate[] = [];

  // Analyze each package
  for (const pkg of PACKAGES) {
    const latestTag = await getLatestTag(pkg);
    const commits = await getCommitsSince(latestTag, `packages/${pkg}/`);

    if (commits.length === 0) {
      console.log(`📦 ${pkg}: No commits since ${latestTag || "beginning"}`);
      continue;
    }

    const bumpType = analyzeBumpType(commits);

    if (!bumpType) {
      console.log(
        `📦 ${pkg}: ${commits.length} commits, but no version-relevant changes`
      );
      continue;
    }

    const currentVersion = await getPackageVersion(pkg);
    const newVersion = incrementVersion(currentVersion, bumpType);

    updates.push({
      name: pkg,
      oldVersion: currentVersion,
      newVersion,
      bumpType,
    });

    console.log(
      `📦 ${pkg}: ${currentVersion} → ${newVersion} (${bumpType}) [${commits.length} commits]`
    );
  }

  if (updates.length === 0) {
    console.log("\n✅ No version bumps needed.");
    return;
  }

  console.log(`\n📝 Updating ${updates.length} package(s)...`);

  // Update package versions
  for (const update of updates) {
    await updatePackageVersion(update.name, update.newVersion);
  }

  // Update root package.json with highest version
  const maxVersion = updates.reduce((max, u) => {
    const [maxMajor, maxMinor, maxPatch] = max.split(".").map(Number);
    const [uMajor, uMinor, uPatch] = u.newVersion.split(".").map(Number);

    if (
      uMajor > maxMajor ||
      (uMajor === maxMajor && uMinor > maxMinor) ||
      (uMajor === maxMajor && uMinor === maxMinor && uPatch > maxPatch)
    ) {
      return u.newVersion;
    }
    return max;
  }, await getPackageVersion("root"));

  const rootVersion = await getPackageVersion("root");
  if (maxVersion !== rootVersion) {
    await updatePackageVersion("root", maxVersion);
    console.log(`📦 root: ${rootVersion} → ${maxVersion}`);
  }

  // Stage changes
  await exec("git add .");

  // Create commit
  const commitMessage = `chore(release): bump versions

${updates.map((u) => `- ${u.name}: ${u.oldVersion} → ${u.newVersion} (${u.bumpType})`).join("\n")}`;

  await exec(`git commit -m "${commitMessage}"`);
  console.log("\n✅ Created release commit");

  // Create tags
  for (const update of updates) {
    const tag = `${PACKAGE_PREFIX}/${update.name}@${update.newVersion}`;
    await createTag(tag);
    console.log(`🏷️  Created tag: ${tag}`);
  }

  // Push with tags
  await exec("git push --follow-tags");
  console.log("\n🚀 Pushed to remote with tags");

  console.log("\n✅ Version bump complete!");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
