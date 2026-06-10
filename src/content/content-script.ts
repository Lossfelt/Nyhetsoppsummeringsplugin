import { showTooltip } from './tooltip';
import type { CommandMessage, ContentMessage, SummarizeResult } from '../lib/messages';

let lastMouseX = 0;
let lastMouseY = 0;
let hoveredAnchor: HTMLAnchorElement | null = null;

document.addEventListener(
  'mousemove',
  (event) => {
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    const target = event.target as Element | null;
    hoveredAnchor = (target?.closest('a[href]') as HTMLAnchorElement | null) ?? null;
  },
  { passive: true, capture: true },
);

chrome.runtime.onMessage.addListener((message: CommandMessage) => {
  if (message?.type === 'start') {
    void run(message.url);
  } else if (message?.type === 'start-hovered') {
    const url = hoveredAnchor?.href;
    // Ingen lenke under pekeren -> ingenting skjer (bevisst valg).
    if (url) void run(url);
  }
});

async function run(url: string): Promise<void> {
  const tip = showTooltip(lastMouseX, lastMouseY);
  tip.setLoading();
  try {
    const message: ContentMessage = { type: 'summarize', url };
    const result = (await chrome.runtime.sendMessage(message)) as SummarizeResult;
    tip.setResult(result ?? { kind: 'summary-failed' });
  } catch {
    tip.setResult({ kind: 'summary-failed' });
  }
}
