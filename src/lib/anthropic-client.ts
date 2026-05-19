/**
 * Shared Anthropic client factory.
 *
 * Reads ANTHROPIC_API_KEY from process.env. If the env var is missing or
 * empty (e.g. shadowed by a blank system variable), it falls back to
 * reading the project-local .env.local file directly so the dev server
 * keeps working without a restart.
 */
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

function resolveApiKey(): string | undefined {
  const fromEnv = process.env.ANTHROPIC_API_KEY;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim();

  // Fallback: parse .env.local from the project root
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('ANTHROPIC_API_KEY=')) {
        const val = trimmed.slice('ANTHROPIC_API_KEY='.length).trim();
        if (val) return val;
      }
    }
  } catch {
    // .env.local not found or unreadable — let Anthropic SDK throw its own error
  }

  return undefined;
}

export function createAnthropicClient(): Anthropic {
  const apiKey = resolveApiKey();
  return new Anthropic({ apiKey });
}
