#!/usr/bin/env node

/**
 * MCP Job Agent Server
 *
 * Purpose:
 * - Provide a small set of safe, focused tools for job search + outreach.
 * - Uses OpenAI-compatible chat completions via the existing `openai` dependency.
 *
 * Env:
 * - OPENAI_API_KEY (required for generation tools)
 * - OPENAI_MODEL (optional, default: gpt-4o-mini)
 * - OPENAI_BASE_URL (optional, default: https://api.openai.com/v1)
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Load local .env automatically (safe: .env is gitignored)
import 'dotenv/config';

import OpenAI from 'openai';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function getEnv(name, fallback = undefined) {
  const v = process.env[name];
  return (v === undefined || v === '') ? fallback : v;
}

const OPENAI_MODEL = getEnv('OPENAI_MODEL', 'gpt-4o-mini');
const OPENAI_BASE_URL = getEnv('OPENAI_BASE_URL', 'https://api.openai.com/v1');

function requireOpenAI() {
  const apiKey = getEnv('OPENAI_API_KEY');
  if (!apiKey) {
    const err = new Error('OPENAI_API_KEY is not set. Add it to your .env (not committed) and restart the MCP server.');
    err.code = 'MISSING_OPENAI_API_KEY';
    throw err;
  }
  return new OpenAI({ apiKey, baseURL: OPENAI_BASE_URL });
}

function safeReadText(relPath, maxBytes = 200_000) {
  const abs = path.resolve(ROOT, relPath);
  if (!abs.startsWith(ROOT)) throw new Error('Path escapes project root');
  const stat = fs.statSync(abs);
  if (!stat.isFile()) throw new Error('Not a file');
  if (stat.size > maxBytes) throw new Error(`File too large (${stat.size} bytes)`);
  return fs.readFileSync(abs, 'utf8');
}

function formatDob(yyyy, mm, dd) {
  // basic formatting helper for UAE CV style
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(dd).padStart(2, '0')} ${months[date.getUTCMonth()]} ${yyyy}`;
}

const server = new Server(
  {
    name: 'cv-job-agent-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'job_defaults',
        description: 'Get recommended job search defaults for Dubai/UAE roles (Flutter + Full Stack) and important do/don’t notes.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      {
        name: 'draft_cover_letter',
        description: 'Draft a short, UAE-friendly cover letter (Markdown) for a given role and company.',
        inputSchema: {
          type: 'object',
          properties: {
            role: { type: 'string' },
            company: { type: 'string' },
            jobDescription: { type: 'string' },
            highlights: { type: 'string', description: 'Optional bullets about your strongest matching points.' },
          },
          required: ['role', 'company'],
          additionalProperties: false,
        },
      },
      {
        name: 'draft_followup_message',
        description: 'Draft a polite follow-up message for a recruiter/HR after applying.',
        inputSchema: {
          type: 'object',
          properties: {
            role: { type: 'string' },
            company: { type: 'string' },
            channel: { type: 'string', description: 'e.g., LinkedIn, Email, WhatsApp' },
            tone: { type: 'string', description: 'e.g., polite, direct, enthusiastic' },
          },
          required: ['role', 'company'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_resume_paths',
        description: 'Return the paths to the current resume PDF and Markdown source-of-truth in this repository.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      {
        name: 'format_dob',
        description: 'Format date of birth in a clean CV format (DD Mon YYYY).',
        inputSchema: {
          type: 'object',
          properties: {
            year: { type: 'integer' },
            month: { type: 'integer' },
            day: { type: 'integer' },
          },
          required: ['year', 'month', 'day'],
          additionalProperties: false,
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'job_defaults') {
      const defaults = {
        location: 'Dubai / United Arab Emirates',
        keywords: [
          'Flutter Developer',
          'Full Stack Developer',
          'Node.js Developer',
          'React Developer',
          'Flutter + Node.js',
        ],
        notes: [
          'Avoid using “Senior” unless the job explicitly says Senior.',
          'Start with Past 24 hours or Past Week; keep batches small to avoid account flags.',
          'Prefer Easy Apply + roles with clear matching stack (Flutter/Node/React).',
        ],
      };
      return { content: [{ type: 'text', text: JSON.stringify(defaults, null, 2) }] };
    }

    if (name === 'get_resume_paths') {
      const result = {
        pdf: 'resumes/resume-fasil-software-2025.pdf',
        markdown: 'resumes/resume-fasil-software-focused.md',
        html: 'public/cv.html',
      };
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    if (name === 'format_dob') {
      const { year, month, day } = args ?? {};
      return { content: [{ type: 'text', text: formatDob(year, month, day) }] };
    }

    if (name === 'draft_cover_letter') {
      const { role, company, jobDescription = '', highlights = '' } = args ?? {};

      const resumeMd = (() => {
        try {
          return safeReadText('resumes/resume-fasil-software-focused.md');
        } catch {
          return '';
        }
      })();

      const openai = requireOpenAI();
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 0.4,
        max_tokens: 650,
        messages: [
          {
            role: 'system',
            content:
              'You write concise, UAE-friendly cover letters. Keep it 160-220 words. No clichés. Mention Flutter + Full Stack strengths. Use a professional tone.',
          },
          {
            role: 'user',
            content:
              `Role: ${role}\nCompany: ${company}\n\nJob description (if any):\n${jobDescription}\n\nHighlights (optional):\n${highlights}\n\nCandidate resume (optional excerpt):\n${resumeMd.slice(0, 6000)}`,
          },
        ],
      });

      const text = response.choices?.[0]?.message?.content?.trim() || '';
      return { content: [{ type: 'text', text }] };
    }

    if (name === 'draft_followup_message') {
      const { role, company, channel = 'LinkedIn', tone = 'polite' } = args ?? {};

      const openai = requireOpenAI();
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 0.5,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content:
              'Draft short follow-up messages for job applications. Keep it 2-4 sentences. Make it specific and professional. UAE context is fine.',
          },
          {
            role: 'user',
            content: `Channel: ${channel}\nTone: ${tone}\nRole: ${role}\nCompany: ${company}\n\nWrite the message.`,
          },
        ],
      });

      const text = response.choices?.[0]?.message?.content?.trim() || '';
      return { content: [{ type: 'text', text }] };
    }

    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    const message = err?.message ? String(err.message) : String(err);
    return {
      content: [{ type: 'text', text: message }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
