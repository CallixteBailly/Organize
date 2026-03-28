const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above/i,
  /system\s*:/i,
  /\buser\s*:/i,
  /\bassistant\s*:/i,
  /\[INST\]/i,
  /<<\s*SYS\s*>>/i,
];

export function sanitizePromptInput(text: string): string {
  // Strip control characters (keep newlines and tabs)
  let cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Collapse excessive whitespace
  cleaned = cleaned.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  // Neutralize prompt injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  return cleaned.trim();
}
