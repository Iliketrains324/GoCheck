// Static requires let webpack bundle .md files as string assets (no fs needed in client bundles).
// When adding a new skill file, add a require() entry below.

function stripFrontmatter(content: string): string {
  return content.replace(/^---[\s\S]+?---\s*\n/, "");
}

const RAW: Record<string, string> = {
  "aform":                     require("./aform.md"),
  "ppr":                       require("./ppr.md"),
  "letter-of-invitation":      require("./letter-of-invitation.md"),
  "credentials":               require("./credentials.md"),
  "venue-reservation":         require("./venue-reservation.md"),
  "meeting-agenda":            require("./meeting-agenda.md"),
  "recruitment-mechanics":     require("./recruitment-mechanics.md"),
  "list-of-questions":         require("./list-of-questions.md"),
  "election-mechanics":        require("./election-mechanics.md"),
  "general-contest-mechanics": require("./general-contest-mechanics.md"),
  "academic-contest-mechanics":require("./academic-contest-mechanics.md"),
  "sample-pub":                require("./sample-pub.md"),
  "pre-registration-form":     require("./pre-registration-form.md"),
  "coherence":                 require("./coherence.md"),
  "_shared/writing-checks":    require("./_shared/writing-checks.md"),
  "_shared/issue-schema":      require("./_shared/issue-schema.md"),
};

const cache = new Map<string, string>();

export function loadSkill(name: string): string {
  if (cache.has(name)) return cache.get(name)!;

  const raw = RAW[name];
  if (!raw) throw new Error(`Skill not found: ${name}`);

  let content = stripFrontmatter(raw);

  if (content.includes("{{WRITING_CHECKS}}")) {
    content = content.replace("{{WRITING_CHECKS}}", stripFrontmatter(RAW["_shared/writing-checks"]));
  }
  if (content.includes("{{ISSUE_SCHEMA}}")) {
    content = content.replace("{{ISSUE_SCHEMA}}", stripFrontmatter(RAW["_shared/issue-schema"]));
  }

  cache.set(name, content);
  return content;
}
