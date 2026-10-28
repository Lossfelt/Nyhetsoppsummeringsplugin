import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

export default defineManifest({
  manifest_version: 3,
  name: 'Nyhetsoppsummering',
  version: pkg.version,
  description: pkg.description,
  icons: {
    16: 'src/icons/icon16.png',
    48: 'src/icons/icon48.png',
    128: 'src/icons/icon128.png',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/content-script.ts'],
      run_at: 'document_idle',
    },
  ],
  options_ui: {
    page: 'src/options/options.html',
    open_in_tab: true,
  },
  permissions: ['contextMenus', 'storage', 'scripting', 'offscreen', 'tabs'],
  host_permissions: ['<all_urls>'],
  commands: {
    'summarize-hovered-link': {
      suggested_key: { default: 'Alt+S' },
      description: 'Oppsummer lenken under musepekeren',
    },
  },
});
