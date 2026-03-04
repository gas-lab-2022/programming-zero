export function extractJson<T>(text: string): T {
  // Try fenced code block (```json ... ``` or ``` ... ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim());
  }

  // Try raw JSON parse
  const trimmed = text.trim();
  return JSON.parse(trimmed);
}
