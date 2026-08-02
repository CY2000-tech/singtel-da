/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Singtel section breaks + section metadata (template-agnostic).
 *
 * Reads `payload.template.sections` for section order, selector, and `style`,
 * then inserts a section break (<hr>) before every non-first section and a
 * "Section Metadata" block for every section that declares a style.
 *
 * Section start resolution (first strategy that yields an element wins):
 *   1. section.selector (or first entry if it is an array) — the verified,
 *      content-unique selector stored in page-templates.json by block-mapping.
 *   2. The first block instance selector belonging to the section
 *      (template.blocks[name].instances) — a section always contains its blocks.
 *   3. A text anchor from section.name via a heading/paragraph scan.
 *
 * Runs at afterTransform, after singtel-cleanup has removed header/nav/footer,
 * so selectors resolve against de-collided page content.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

/** Find first element matching selector whose text includes the given string. */
function findByText(root, selector, text) {
  return Array.from(root.querySelectorAll(selector))
    .find((el) => el.textContent && el.textContent.includes(text)) || null;
}

/** Safe querySelector that tolerates :has() / invalid selectors. */
function safeQuery(root, selector) {
  if (!selector) return null;
  try {
    return root.querySelector(selector);
  } catch (e) {
    return null;
  }
}

/** Resolve the first content element of a section. */
function findSectionStart(section, template, root) {
  // 1. section.selector (string or array of candidates)
  const sel = section.selector;
  if (Array.isArray(sel)) {
    for (let i = 0; i < sel.length; i += 1) {
      const el = safeQuery(root, sel[i]);
      if (el) return el;
    }
  } else if (typeof sel === 'string') {
    const el = safeQuery(root, sel);
    if (el) return el;
  }

  // 2. First block instance that lives in this section.
  const blockNames = Array.isArray(section.blocks) ? section.blocks : [];
  const templateBlocks = (template && Array.isArray(template.blocks)) ? template.blocks : [];
  for (let b = 0; b < blockNames.length; b += 1) {
    const def = templateBlocks.find((x) => x.name === blockNames[b]);
    const instances = def && Array.isArray(def.instances) ? def.instances : [];
    for (let i = 0; i < instances.length; i += 1) {
      const el = safeQuery(root, instances[i]);
      if (el) return el;
    }
  }

  // 3. Text anchor derived from the section name (first few significant words).
  if (section.name) {
    const words = section.name.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
    for (let take = Math.min(4, words.length); take >= 2; take -= 1) {
      const phrase = words.slice(0, take).join(' ');
      const el = findByText(root, 'h1, h2, h3', phrase);
      if (el) return el;
    }
  }

  return null;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const template = payload && payload.template;
  const sections = template && template.sections;
  if (!Array.isArray(sections) || sections.length < 2) return;

  const doc = (payload && payload.document) || element.ownerDocument;

  // Process in reverse so inserting before an earlier section does not shift
  // the anchors of sections not yet processed.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    const start = findSectionStart(section, template, element);
    if (!start || !start.parentNode) continue;

    if (section.style) {
      const metaBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      start.parentNode.insertBefore(metaBlock, start.nextSibling);
    }

    if (i > 0) {
      const hr = doc.createElement('hr');
      start.parentNode.insertBefore(hr, start);
    }
  }
}
