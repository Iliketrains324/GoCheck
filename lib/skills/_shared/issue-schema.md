---
name: Issue Schema (Shared)
description: JSON output schema all document skills must follow
---

## OUTPUT FORMAT

Return a JSON object with this exact structure:

```json
{
  "status": "ok" | "has_issues",
  "summary": "one-sentence summary",
  "issues": [
    {
      "field": "name of the form field or section",
      "problem": "specific description of what is wrong",
      "suggestion": "exact correction text or instruction",
      "severity": "major" | "minor"
    }
  ]
}
```

**Rules:**
- `"major"` severity = causes pend/rejection; `"minor"` = advisory/formatting
- If no issues found, return status `"ok"` and empty issues array
- Be specific in field names (e.g. "Section I - Title of Activity" not just "title")
- Do NOT include issues that are not violations of the checking guide
- NEVER flag cross-document inconsistencies or "cannot verify against [other doc]" issues. You only have access to THIS document's text. Cross-document checks are handled by a separate coherence agent.
