import { Readability } from '@mozilla/readability';

export interface ParseRequest {
  target: 'offscreen';
  type: 'parse';
  html: string;
  url: string;
}

export interface ParseResponse {
  text: string;
  title: string;
}

function parse(html: string, url: string): ParseResponse {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Sett base-URL så Readability kan vurdere relative lenker korrekt.
  const base = doc.createElement('base');
  base.href = url;
  doc.head?.appendChild(base);

  const article = new Readability(doc).parse();
  return {
    text: article?.textContent?.trim() ?? '',
    title: article?.title?.trim() ?? '',
  };
}

chrome.runtime.onMessage.addListener((message: ParseRequest, _sender, sendResponse) => {
  if (message?.target !== 'offscreen' || message.type !== 'parse') return;
  try {
    sendResponse(parse(message.html, message.url));
  } catch {
    sendResponse({ text: '', title: '' } satisfies ParseResponse);
  }
  return false;
});
