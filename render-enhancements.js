export function appendRenderEnhancements(output, config = {}) {
  let html = String(output)

  if (hasAttributeOptions(config.attributeOptions)) {
    html = appendAttributeOptionsScript(html, config.attributeOptions)
  }

  return appendFloatingFooter(html, {
    copyLinkUi: config.copyLinkUi !== false,
  })
}

export function markdownLinkPayload({ title, href, targetId, selectedText = '' }) {
  const url = new URL(href)
  url.hash = targetId
  const escapedTitle = escapeMarkdownLinkText((title || url.href).replace(/\s+/g, ' ').trim())
  const trimmedSelection = String(selectedText || '').trim()
  const quote = trimmedSelection
    ? `\n\n${trimmedSelection.split(/\r?\n/).map((line) => `> ${line}`).join('\n')}`
    : ''
  return `[${escapedTitle}](${url.href})${quote}`
}

export function compactUrlPreview(href) {
  const url = new URL(href)
  return `${compactHost(url.host)}${compactPath(url.pathname)}${url.search}${url.hash}`
}

function compactHost(host) {
  return host
    .split('.')
    .filter(Boolean)
    .map((part) => part[0])
    .join('.')
}

function compactPath(pathname) {
  return pathname
    .split('/')
    .filter(Boolean)
    .map((part) => part[0])
    .join('/')
    .replace(/^(.+)/, '/$1')
}

function escapeMarkdownLinkText(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]')
}

function hasAttributeOptions(attributeOptions) {
  return Object.keys(normalizeAttributeOptions(attributeOptions)).length > 0
}

function normalizeAttributeOptions(attributeOptions) {
  const fields = attributeOptions?.fields || attributeOptions || {}
  const normalized = {}
  for (const [name, config] of Object.entries(fields)) {
    const options = Array.isArray(config) ? config : config?.options
    if (!Array.isArray(options) || options.length === 0) continue
    normalized[name] = {
      default: typeof config?.default === 'string' ? config.default : null,
      options: options.map((option) => String(option)),
    }
  }
  return normalized
}

function appendAttributeOptionsScript(output, attributeOptions) {
  const optionsJson = JSON.stringify(normalizeAttributeOptions(attributeOptions)).replace(/</g, '\\u003c')
  const script = `
<style>
.attribute-substitution-menu {
  position: absolute;
  z-index: 1000;
  margin-top: 2px;
  font-family: inherit;
  font-size: 0.9em;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  background-color: white;
  min-width: 150px;
  max-width: 250px;
  width: auto;
}
</style>
<script>
(() => {
  const attributeOptions = ${optionsJson};
  let menu;

  function closeMenu() {
    if (menu) menu.remove();
    menu = null;
  }

  function setAttributeValue(name, value) {
    document.querySelectorAll(\`.attribute-substitution[data-attribute="\${CSS.escape(name)}"]\`).forEach((button) => {
      button.textContent = value;
      button.dataset.value = value;
    });
  }

  function showMenu(button, name) {
    closeMenu();
    const config = attributeOptions[name];
    if (!config) return;
    const allOptions = [];
    const currentValue = button.dataset.value;
    const attributeRef = \`{\${name}}\`;

    if (currentValue && currentValue !== attributeRef && currentValue !== config.default && !config.options.includes(currentValue)) {
      allOptions.push(currentValue);
    }

    allOptions.push(attributeRef);
    if (config.default && config.default !== currentValue) allOptions.push(config.default);

    for (const option of config.options) {
      if (!allOptions.includes(option)) allOptions.push(option);
    }

    menu = document.createElement('select');
    menu.className = 'attribute-substitution-menu';
    menu.setAttribute('size', Math.min(allOptions.length, 10));

    const placeholder = document.createElement('option');
    placeholder.textContent = \`Select value for {\${name}}...\`;
    placeholder.disabled = true;
    placeholder.selected = true;
    menu.append(placeholder);

    for (const option of allOptions) {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      menu.append(optionElement);
    }

    menu.addEventListener('change', () => {
      const option = menu.value;
      setAttributeValue(name, option);
      closeMenu();
    });

    menu.addEventListener('blur', () => closeMenu());
    button.insertAdjacentElement('afterend', menu);
    menu.focus();
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.attribute-substitution');
    if (!button) {
      if (!event.target.closest?.('.attribute-substitution-menu')) closeMenu();
      return;
    }

    const name = button.dataset.attribute;
    if (!attributeOptions[name]) return;
    event.preventDefault();
    showMenu(button, name);
  });
})();
</script>`

  return appendBeforeBodyEnd(output, script)
}

function appendFloatingFooter(output, { copyLinkUi }) {
  const copyButton = copyLinkUi ? `
<button type="button" class="copy-link-button" id="copy-link-button" aria-label="Copy Markdown link" title="Copy Markdown link">
  ${getLinkIconSvg()}
</button>
<div class="copy-link-status" id="copy-link-status" role="status" aria-live="polite"></div>` : ''

  const placementControls = copyLinkUi ? `
      <label class="copy-placement-control">
        <select id="copy-placement-select" data-copy-placement="margin" aria-label="Copy icon placement">
          <option value="margin" selected>Margin</option>
          <option value="selection">Selection</option>
          <option value="block">Block</option>
        </select>
      </label>` : ''

  const html = `
${copyButton}
<footer class="floating-footer" id="floating-footer" aria-label="Document tools">
  <div class="floating-footer-tools">
    <div class="floating-footer-left">${placementControls}
    </div>
    <div class="copy-link-url" id="copy-link-url" aria-live="polite"></div>
    <div class="floating-footer-actions">
    <button type="button" class="footer-toggle-ids" id="toggle-ids-button" title="Toggle element ID visibility" aria-pressed="false">
      ${getToggleIconSvg()}
      <span>Toggle IDs</span>
    </button>
    <a href="https://github.com/pwright/asciidoc-comments" target="_blank" rel="noopener noreferrer" class="footer-link" title="View this project on GitHub">
      ${getGitHubIconSvg()}
      <span>GitHub</span>
    </a>
    </div>
  </div>
</footer>
${footerStyles(copyLinkUi)}
${footerScript(copyLinkUi)}`

  return appendBeforeBodyEnd(output, html)
}

function appendBeforeBodyEnd(output, addition) {
  return output.includes('</body>')
    ? output.replace('</body>', `${addition}\n</body>`)
    : `${output}${addition}`
}

function footerStyles(copyLinkUi) {
  return `<style>
.floating-footer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 999;
  box-sizing: border-box;
  min-height: 54px;
  padding: 8px 16px;
  border-top: 1px solid #ddd;
  background: rgba(248, 248, 247, 0.97);
  box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.08);
}
.floating-footer-tools {
  display: grid;
  grid-template-columns: minmax(110px, 1fr) minmax(0, 2fr) minmax(220px, 1fr);
  gap: 0.5rem;
  align-items: center;
  max-width: 1100px;
  margin: 0 auto;
}
.floating-footer-left,
.floating-footer-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.floating-footer-actions {
  justify-content: flex-end;
}
.copy-link-url {
  min-width: 0;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(0, 0, 0, 0.72);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8125rem;
}
.footer-link,
.footer-toggle-ids,
.copy-placement-control select {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 34px;
  box-sizing: border-box;
  padding: 0.35rem 0.65rem;
  font-size: 0.875rem;
  font-family: inherit;
  text-decoration: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  color: rgba(0, 0, 0, 0.75);
}
.copy-placement-control {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
}
.footer-link {
  color: #2156a5;
}
.footer-toggle-ids {
  cursor: pointer;
}
.footer-toggle-ids.active {
  background: #2156a5;
  color: #fff;
  border-color: #1d4b8f;
}
.footer-link:focus,
.footer-toggle-ids:focus,
.copy-placement-control select:focus {
  outline: 2px solid #2156a5;
  outline-offset: 2px;
}
.footer-link svg,
.footer-toggle-ids svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
body.ids-visible [id]:not(.copy-link-button):not(.copy-link-status):not(.floating-footer) {
  outline: 2px solid rgba(180, 35, 24, 0.78);
  outline-offset: 2px;
}
${copyLinkUi ? copyLinkStyles() : ''}
</style>`
}

function copyLinkStyles() {
  return `.copy-link-button {
  position: absolute;
  z-index: 1000;
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #9aa8bb;
  border-radius: 999px;
  background: #fff;
  color: #2156a5;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.22);
  cursor: pointer;
}
.copy-link-button.visible {
  display: inline-flex;
}
.copy-link-button.copied {
  color: #18794e;
  border-color: #18794e;
}
.copy-link-button.failed {
  color: #b42318;
  border-color: #b42318;
}
.copy-link-status {
  position: fixed;
  right: 16px;
  bottom: 64px;
  z-index: 1001;
  padding: 4px 8px;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
  color: #18794e;
  font-size: 0.875rem;
}
@media (max-width: 720px) {
  .floating-footer-tools {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .copy-link-url {
    grid-column: 1 / -1;
    grid-row: 1;
  }
  .floating-footer-left,
  .floating-footer-actions {
    grid-row: 2;
  }
  .copy-link-button {
    transform: translate(-50%, -48px) !important;
  }
}`
}

function footerScript(copyLinkUi) {
  return `<script>
(() => {
  const toggleIdsButton = document.getElementById('toggle-ids-button');
  if (toggleIdsButton) {
    toggleIdsButton.addEventListener('click', () => {
      const visible = !document.body.classList.contains('ids-visible');
      document.body.classList.toggle('ids-visible', visible);
      toggleIdsButton.classList.toggle('active', visible);
      toggleIdsButton.setAttribute('aria-pressed', String(visible));
    });
  }
${copyLinkUi ? copyLinkScript() : ''}
})();
</script>`
}

function copyLinkScript() {
  return `
  const copyButton = document.getElementById('copy-link-button');
  const status = document.getElementById('copy-link-status');
  const urlPreview = document.getElementById('copy-link-url');
  const placementSelect = document.getElementById('copy-placement-select');
  let currentTarget = null;
  let currentText = '';

  function uiChromeContains(element) {
    return Boolean(element?.closest?.('#copy-link-button, #floating-footer, .' + 'attr' + 'ibute-substitution-menu'));
  }

  function nearestContentId(node) {
    let element = node && node.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    while (element && uiChromeContains(element)) element = element.parentElement;
    return element?.closest?.('[id]') || null;
  }

  function selectionInfo() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') return null;
    const range = selection.getRangeAt(0);
    const target = nearestContentId(range.startContainer);
    if (!target) return null;
    return {
      target,
      text: selection.toString().trim(),
      rect: range.getBoundingClientRect(),
      targetRect: target.getBoundingClientRect(),
    };
  }

  function escapeTitle(value) {
    return String(value).replace(/\\\\/g, '\\\\\\\\').replace(/\\[/g, '\\\\[').replace(/\\]/g, '\\\\]');
  }

  function markdownFor(target, selectedText) {
    const url = new URL(window.location.href);
    url.hash = target.id;
    const title = escapeTitle((document.title || url.href).replace(/\\s+/g, ' ').trim());
    const quote = selectedText
      ? '\\n\\n' + selectedText.split(/\\r?\\n/).map((line) => '> ' + line).join('\\n')
      : '';
    return '[' + title + '](' + url.href + ')' + quote;
  }

  function urlFor(target) {
    const url = new URL(window.location.href);
    url.hash = target.id;
    return url.href;
  }

  function compactUrlPreview(href) {
    const url = new URL(href);
    const host = url.host.split('.').filter(Boolean).map((part) => part[0]).join('.');
    const path = url.pathname.split('/').filter(Boolean).map((part) => part[0]).join('/');
    return host + (path ? '/' + path : '') + url.search + url.hash;
  }

  function place(info) {
    currentTarget = info.target;
    currentText = info.text;
    const placement = placementSelect?.value || 'margin';
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    let left;
    let top;
    copyButton.style.transform = '';

    if (placement === 'block') {
      left = info.targetRect.right + scrollX;
      top = info.targetRect.top + scrollY;
      copyButton.style.transform = 'translate(10px, 10px)';
    } else if (placement === 'selection') {
      left = info.rect.left + (info.rect.width / 2) + scrollX;
      top = info.rect.top + scrollY;
      copyButton.style.transform = 'translate(-50%, -48px)';
    } else {
      left = info.targetRect.left + scrollX;
      top = info.targetRect.top + scrollY;
      copyButton.style.transform = 'translate(-48px, -2px)';
    }

    copyButton.style.left = left + 'px';
    copyButton.style.top = top + 'px';
    copyButton.classList.add('visible');
    if (urlPreview) {
      const href = urlFor(info.target);
      urlPreview.textContent = compactUrlPreview(href);
      urlPreview.title = href;
    }
  }

  function showStatus(message, className) {
    if (status) status.textContent = message;
    copyButton.classList.remove('copied', 'failed');
    if (className) copyButton.classList.add(className);
    window.setTimeout(() => copyButton.classList.remove('copied', 'failed'), 1400);
  }

  function updateFromSelection() {
    const info = selectionInfo();
    if (!info) {
      if (document.activeElement !== copyButton) copyButton.classList.remove('visible', 'copied', 'failed');
      currentTarget = null;
      currentText = '';
      if (urlPreview) {
        urlPreview.textContent = '';
        urlPreview.removeAttribute('title');
      }
      return;
    }
    place(info);
  }

  copyButton?.addEventListener('click', async () => {
    if (!currentTarget) {
      const activeTarget = nearestContentId(document.activeElement);
      const hashTarget = window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null;
      currentTarget = activeTarget || hashTarget;
      currentText = '';
      if (currentTarget && urlPreview) {
        const href = urlFor(currentTarget);
        urlPreview.textContent = compactUrlPreview(href);
        urlPreview.title = href;
      }
    }
    if (!currentTarget) {
      showStatus('No block ID found', 'failed');
      return;
    }
    const markdown = markdownFor(currentTarget, currentText);
    try {
      await navigator.clipboard.writeText(markdown);
      showStatus('Copied', 'copied');
    } catch (_error) {
      window.prompt('Copy Markdown link', markdown);
      showStatus('Copy fallback opened', 'failed');
    }
  });

  document.addEventListener('selectionchange', () => window.setTimeout(updateFromSelection, 0));
  document.addEventListener('mouseup', updateFromSelection);
  document.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
      copyButton?.classList.remove('visible', 'copied', 'failed');
      return;
    }
    updateFromSelection();
  });
  placementSelect?.addEventListener('change', updateFromSelection);`
}

function getGitHubIconSvg() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>`
}

function getToggleIconSvg() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M0 2a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V2zm1 0v12a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1H2a1 1 0 00-1 1z"/>
  </svg>`
}

function getLinkIconSvg() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>`
}
