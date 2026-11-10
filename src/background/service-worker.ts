import { extractArticle } from './extract';
import { getCached, setCached, summaryCacheKey } from '../lib/cache';
import { loadSettings } from '../lib/settings';
import { getProvider } from '../providers';
import { ProviderError } from '../providers/errors';
import type { CommandMessage, ContentMessage, SummarizeResult } from '../lib/messages';

const CONTEXT_MENU_ID = 'summarize-article';
const COMMAND_ID = 'summarize-hovered-link';
// Dekker både henting (fallback via fane kan ta opptil 12 s) og modeller
// som tenker før de svarer.
const TIMEOUT_MS = 45000;

chrome.runtime.onInstalled.addListener(() => {
  // removeAll først, ellers kaster create() på duplikat-id ved oppdatering/reload.
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Oppsummer artikkel',
      contexts: ['link'],
    });
  });
});

// Høyreklikk på en lenke -> be content scriptet starte med den konkrete URL-en.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id || !info.linkUrl) return;
  const message: CommandMessage = { type: 'start', url: info.linkUrl };
  void chrome.tabs.sendMessage(tab.id, message);
});

// Hurtigtast -> be content scriptet om å bruke lenken under musepekeren.
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== COMMAND_ID) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const message: CommandMessage = { type: 'start-hovered' };
  void chrome.tabs.sendMessage(tab.id, message);
});

chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
  if (message?.type === 'open-options') {
    void chrome.runtime.openOptionsPage();
    return false;
  }
  if (message?.type === 'summarize') {
    summarize(message.url).then(sendResponse);
    return true; // svarer asynkront
  }
  return false;
});

async function summarize(url: string): Promise<SummarizeResult> {
  try {
    return await withTimeout(doSummarize(url), TIMEOUT_MS);
  } catch (error) {
    return {
      kind: 'summary-failed',
      reason: error instanceof Error ? error.message : 'Tidsavbrudd eller uventet feil.',
    };
  }
}

async function doSummarize(url: string): Promise<SummarizeResult> {
  const settings = await loadSettings();
  const apiKey = settings.apiKeys[settings.provider];
  const model = settings.models[settings.provider];
  const cacheKey = summaryCacheKey(url, settings.provider, model);

  const cached = await getCached(cacheKey);
  if (cached) return { kind: 'ok', sentence: cached };
  if (!apiKey) return { kind: 'no-key' };

  const extracted = await extractArticle(url);
  if (!extracted.ok) return { kind: extracted.reason };

  try {
    const provider = getProvider(settings.provider);
    const sentence = await provider.summarize(extracted.text, {
      apiKey,
      model,
      ...(settings.effort === 'low' ? { effort: 'low' as const } : {}),
    });
    if (!sentence) return { kind: 'summary-failed' };
    await setCached(cacheKey, sentence);
    return { kind: 'ok', sentence };
  } catch (error) {
    return toFailure(error);
  }
}

function toFailure(error: unknown): SummarizeResult {
  if (error instanceof ProviderError && error.kind === 'auth') return { kind: 'bad-key' };
  if (error instanceof ProviderError && error.kind === 'rate-limit') {
    return { kind: 'rate-limited' };
  }
  return {
    kind: 'summary-failed',
    reason: error instanceof Error ? error.message : undefined,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Tidsavbrudd.')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
