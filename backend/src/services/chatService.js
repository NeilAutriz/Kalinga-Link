import { Event } from '../models/Event.js';
import { ResourceNeed } from '../models/ResourceNeed.js';
import { Pledge } from '../models/Pledge.js';
import { env } from '../config/env.js';
import { sitioKnowledge, chatbotPersona } from '../data/knowledge.js';

// Provider config — Groq (OpenAI-compatible) by default; Gemini optional fallback.
const PROVIDER = (process.env.CHAT_PROVIDER || (process.env.GROQ_API_KEY ? 'groq' : 'gemini')).toLowerCase();
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

const PROGRAM_LABEL = {
  feeding: 'Feeding',
  health: 'Health',
  learning: 'Learning',
  environment: 'Environment',
  livelihood: 'Livelihood',
  youth: 'Youth & arts',
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

/** Pull a small, public-safe snapshot of live program data for the prompt. */
async function buildLiveContext() {
  const now = new Date();

  const upcoming = await Event.find({
    eventDate: { $gte: now },
    status: { $in: ['published', 'ongoing'] },
  })
    .sort({ eventDate: 1 })
    .limit(3)
    .lean();

  let resourceLines = [];
  if (upcoming.length) {
    const eventIds = upcoming.map((e) => e._id);
    const needs = await ResourceNeed.find({ eventId: { $in: eventIds } }).lean();
    const needIds = needs.map((n) => n._id);
    const pledges = needIds.length
      ? await Pledge.aggregate([
          { $match: { resourceNeedId: { $in: needIds } } },
          {
            $group: {
              _id: '$resourceNeedId',
              received: { $sum: { $cond: [{ $eq: ['$status', 'received'] }, '$quantity', 0] } },
            },
          },
        ])
      : [];
    const receivedMap = new Map(pledges.map((p) => [String(p._id), p.received]));
    const openNeeds = needs
      .map((n) => ({ ...n, received: receivedMap.get(String(n._id)) || 0 }))
      .filter((n) => n.received < n.quantityNeeded)
      .slice(0, 8);
    resourceLines = openNeeds.map(
      (n) =>
        `  - ${n.itemName} (${n.category}): need ${n.quantityNeeded - n.received} more ${n.unit}`,
    );
  }

  const eventLines = upcoming.map((e) => {
    const program = PROGRAM_LABEL[e.program] || e.program;
    return `- ${fmtDate(e.eventDate)} — ${e.title} [${program}] @ ${e.location}`;
  });

  return [
    '## Live program data (real-time)',
    eventLines.length ? '### Upcoming visits:' : '### Upcoming visits: (none scheduled right now)',
    ...eventLines,
    resourceLines.length ? '### Open resource needs across upcoming visits:' : '',
    ...resourceLines,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildSystemPrompt(liveContext) {
  return `${chatbotPersona}\n\n# Static knowledge\n${sitioKnowledge}\n\n${liveContext}`;
}

async function callGroq(systemText, history, userMessage) {
  const messages = [
    { role: 'system', content: systemText },
    ...history.slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    })),
    { role: 'user', content: userMessage },
  ];

  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.4,
      top_p: 0.9,
      max_tokens: 512,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    // eslint-disable-next-line no-console
    console.error('Groq error', resp.status, text);
    const err = new Error('Chat backend error');
    err.status = 502;
    throw err;
  }

  const data = await resp.json();
  const reply =
    data?.choices?.[0]?.message?.content?.trim() ||
    "Pasensya na, hindi ko na-process 'yan. Subukan ulit?";
  return { reply, model: `groq:${GROQ_MODEL}` };
}

async function callGemini(systemText, history, userMessage) {
  const contents = [
    ...history.slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const body = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents,
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
      maxOutputTokens: 512,
      responseMimeType: 'text/plain',
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  const resp = await fetch(GEMINI_URL(GEMINI_MODEL, env.GEMINI_API_KEY), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    // eslint-disable-next-line no-console
    console.error('Gemini error', resp.status, text);
    const err = new Error('Chat backend error');
    err.status = 502;
    throw err;
  }

  const data = await resp.json();
  const reply =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim() ||
    "Pasensya na, hindi ko na-process 'yan. Subukan ulit?";
  return { reply, model: `gemini:${GEMINI_MODEL}` };
}

export async function answer(userMessage, history = []) {
  const hasGroq = !!env.GROQ_API_KEY;
  const hasGemini = !!env.GEMINI_API_KEY;
  if (!hasGroq && !hasGemini) {
    const err = new Error('Chat is not configured. Set GROQ_API_KEY or GEMINI_API_KEY.');
    err.status = 503;
    throw err;
  }

  const liveContext = await buildLiveContext().catch(() => '## Live program data\n(unavailable)');
  const systemText = buildSystemPrompt(liveContext);

  // Prefer the explicitly chosen provider if its key exists; otherwise fall back.
  if (PROVIDER === 'gemini' && hasGemini) return callGemini(systemText, history, userMessage);
  if (PROVIDER === 'groq' && hasGroq) return callGroq(systemText, history, userMessage);
  if (hasGroq) return callGroq(systemText, history, userMessage);
  return callGemini(systemText, history, userMessage);
}

