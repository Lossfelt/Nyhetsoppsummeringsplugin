import type { ParseRequest, ParseResponse } from '../offscreen/offscreen';

// Under denne lengden regner vi ikke ekstraksjonen som en reell artikkel.
const MIN_TEXT_LENGTH = 600;
const OFFSCREEN_PATH = 'src/offscreen/offscreen.html';
const TAB_LOAD_TIMEOUT_MS = 12000;

export type ExtractResult =
  { ok: true; text: string; title: string } | { ok: false; reason: 'fetch-failed' | 'not-article' };

let creating: Promise<void> | null = null;

async function ensureOffscreen(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) return;
  if (!creating) {
    creating = chrome.offscreen.createDocument({
      url: OFFSCREEN_PATH,
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Parse artikkel-HTML med Readability for å hente ut brødteksten.',
    });
  }
  try {
    await creating;
  } finally {
    creating = null;
  }
}

async function parseInOffscreen(html: string, url: string): Promise<ParseResponse> {
  await ensureOffscreen();
  const request: ParseRequest = { target: 'offscreen', type: 'parse', html, url };
  return (await chrome.runtime.sendMessage(request)) as ParseResponse;
}

// Tilnærming A: rask fetch. Bærer ikke nødvendigvis session-cookies.
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { credentials: 'omit', redirect: 'follow' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function waitForComplete(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(finish, TAB_LOAD_TIMEOUT_MS);
    function finish() {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }
    function listener(id: number, info: chrome.tabs.OnUpdatedInfo) {
      if (id === tabId && info.status === 'complete') finish();
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// Tilnærming B: åpne en inaktiv fane som arver Vivaldi-sessionen (cookies/JS),
// hent fullt rendret HTML, og lukk fanen igjen.
async function fetchRenderedHtml(url: string): Promise<string | null> {
  let tabId: number | undefined;
  try {
    const tab = await chrome.tabs.create({ url, active: false });
    tabId = tab.id;
    if (tabId === undefined) return null;
    await waitForComplete(tabId);
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.documentElement.outerHTML,
    });
    return typeof injection?.result === 'string' ? injection.result : null;
  } catch {
    return null;
  } finally {
    if (tabId !== undefined) await chrome.tabs.remove(tabId).catch(() => {});
  }
}

export async function extractArticle(url: string): Promise<ExtractResult> {
  let sawAnyHtml = false;

  // A
  const html = await fetchHtml(url);
  if (html) {
    sawAnyHtml = true;
    const parsed = await parseInOffscreen(html, url);
    if (parsed.text.length >= MIN_TEXT_LENGTH) {
      return { ok: true, text: parsed.text, title: parsed.title };
    }
  }

  // B (fallback)
  const rendered = await fetchRenderedHtml(url);
  if (rendered) {
    sawAnyHtml = true;
    const parsed = await parseInOffscreen(rendered, url);
    if (parsed.text.length >= MIN_TEXT_LENGTH) {
      return { ok: true, text: parsed.text, title: parsed.title };
    }
  }

  // Vi nådde siden, men fant ingen lesbar artikkel vs. klarte ikke hente i det hele tatt.
  return { ok: false, reason: sawAnyHtml ? 'not-article' : 'fetch-failed' };
}
