import fs from "fs";
import path from "path";

const SKILLS_DIR = path.join(process.cwd(), "lib/skills");
const cache = new Map<string, string>();

function stripFrontmatter(content: string): string {
  return content.replace(/^---[\s\S]+?---\s*\n/, "");
}

function readShared(name: string): string {
  const filePath = path.join(SKILLS_DIR, "_shared", `${name}.md`);
  return stripFrontmatter(fs.readFileSync(filePath, "utf-8"));
}

export function loadSkill(name: string): string {
  if (cache.has(name)) return cache.get(name)!;

  const filePath = path.join(SKILLS_DIR, `${name}.md`);
  let content = stripFrontmatter(fs.readFileSync(filePath, "utf-8"));

  if (content.includes("{{WRITING_CHECKS}}")) {
    content = content.replace("{{WRITING_CHECKS}}", readShared("writing-checks"));
  }
  if (content.includes("{{ISSUE_SCHEMA}}")) {
    content = content.replace("{{ISSUE_SCHEMA}}", readShared("issue-schema"));
  }

  cache.set(name, content);
  return content;
}
