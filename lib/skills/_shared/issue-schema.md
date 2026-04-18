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

**SELF-REVIEW REQUIREMENT — do this before outputting:**
For each candidate issue you identified, ask yourself:
1. Is this actually a rule violation, or did I misread/misapply the rule?
2. Am I certain the document does NOT satisfy the requirement?
3. Would a human checker agree this needs fixing?

Only include an issue in the final output if you answer YES to all three. If you concluded the item is actually valid, or that the fix would be "none", DROP IT from the output entirely — do not include it with an empty fix or a note saying it's actually fine. A shorter, accurate list is always better than a long list with false positives.
