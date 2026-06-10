import type { ContentMessage, SummarizeResult } from '../lib/messages';

const HOST_TAG = 'nyhetsoppsummering-tooltip';
const MAX_WIDTH = 320;

const ERROR_TEXT: Record<Exclude<SummarizeResult['kind'], 'ok' | 'no-key'>, string> = {
  'fetch-failed': 'Klarte ikke hente artikkelen',
  'not-article': 'Fant ingen artikkel',
  'summary-failed': 'Oppsummering feilet',
};

const STYLE = `
  .box {
    font: 14px/1.45 system-ui, -apple-system, Segoe UI, sans-serif;
    background: #1f2937;
    color: #f9fafb;
    border-radius: 8px;
    padding: 10px 12px;
    max-width: ${MAX_WIDTH}px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  .row { display: flex; align-items: center; gap: 8px; }
  .spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    animation: spin 0.7s linear infinite;
    flex: none;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .link {
    background: none; border: none; color: #93c5fd; cursor: pointer;
    font: inherit; text-decoration: underline; padding: 0;
  }
  .muted { color: #d1d5db; }
`;

export interface Tooltip {
  setLoading(): void;
  setResult(result: SummarizeResult): void;
}

export function showTooltip(x: number, y: number): Tooltip {
  document.querySelectorAll(HOST_TAG).forEach((el) => el.remove());

  const host = document.createElement(HOST_TAG);
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647';
  host.style.left = `${Math.max(8, Math.min(x + 12, window.innerWidth - MAX_WIDTH - 8))}px`;
  host.style.top = `${Math.min(y + 12, window.innerHeight - 80)}px`;

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = STYLE;
  const box = document.createElement('div');
  box.className = 'box';
  shadow.append(style, box);
  document.documentElement.appendChild(host);

  function close() {
    host.remove();
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('mousedown', onOutside, true);
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }
  function onOutside(e: MouseEvent) {
    if (!e.composedPath().includes(host)) close();
  }
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('mousedown', onOutside, true);

  return {
    setLoading() {
      box.innerHTML =
        '<div class="row"><span class="spinner"></span><span class="muted">Oppsummerer …</span></div>';
    },
    setResult(result) {
      box.textContent = '';
      if (result.kind === 'ok') {
        box.textContent = result.sentence;
        return;
      }
      if (result.kind === 'no-key') {
        const button = document.createElement('button');
        button.className = 'link';
        button.textContent = 'Sett opp API-nøkkel i innstillinger';
        button.addEventListener('click', () => {
          const message: ContentMessage = { type: 'open-options' };
          void chrome.runtime.sendMessage(message);
          close();
        });
        box.appendChild(button);
        return;
      }
      box.textContent = ERROR_TEXT[result.kind];
    },
  };
}
