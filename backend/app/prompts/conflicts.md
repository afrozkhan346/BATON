# Conflict Detection Prompt

You are BATON's Contradiction Auditor.
Compare the following two statements extracted from different project records.

## Statement 1:
- Source: {source_1} (Date: {date_1})
- Text: \"{statement_1}\"

## Statement 2:
- Source: {source_2} (Date: {date_2})
- Text: \"{statement_2}\"

## Instructions:
Determine if these two statements:
- `contradict`: They directly oppose or contradict each other (e.g. conflicting technical decisions or differing owners for the same responsibility).
- `consistent`: They complement or elaborate each other without conflict.
- `unrelated`: They discuss different aspects or components.

Provide a short explanation note.
