/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Singtel section breaks + section metadata.
 *
 * Reads `payload.template.sections` for section order and `style`, then inserts
 * a section break (<hr>) before every non-first section and a "Section Metadata"
 * block for every section that declares a style.
 *
 * IMPORTANT — why anchors are NOT taken verbatim from page-templates.json:
 * This site is a styled-components (React) app that reuses hashed class names
 * across the header/nav and the page content. Several per-section selectors in
 * page-templates.json actually resolve to HEADER chrome, not content
 * (verified against migration-work/cleaned.html):
 *   s2 `.sc-feNupb.bubDsw`  -> only match is in the header (line 36)
 *   s6 `.sc-gZfzYS.kSRtco`  -> 6 matches, all in the header megamenu
 *   s7 `.sc-iNIeMn.cZwMrl`  -> only match is header chrome (line 386)
 *   s8 `.sc-hsUFQk.ciOAtj`  -> only match is header chrome (line 392)
 *   s3/s4 share `.sc-epALIP.euohZm` -> single empty <div> (line 703)
 * Using those verbatim would false-pass validation (validator runs this
 * transformer in isolation, header present) but break the real import (cleanup
 * removes the header in beforeTransform). Instead each section is anchored to a
 * content-unique landmark verified in cleaned.html. Section id/order/style still
 * come from payload.template.sections.
 *
 * Verified content anchors (document order):
 *   s1 Hero        .sc-lbJcrp.bQGNRU                         (line 596)
 *   s2 intro/tabs  <p> containing "upgraded our network"     (line 633)
 *   s3 Enhanced    .sc-cbPlza.hidDuG                         (line 790)
 *   s4 Priority    .sc-cbPlza.bTWdQO                         (line 959)
 *   s5 plan CTA    <h2> "Get your 5G+ mobile plan today"     (line 1137)
 *   s6 huge PLUS   .sc-cbPlza.labNNc                         (line 1197)
 *   s7 steps       .sc-cbPlza.imWEiG                         (line 1297)
 *   s8 pricing     .sc-cbPlza.gdvwMg                         (line 1408)
 *   s9 FAQ         <h2> "Frequently Asked Questions"         (line 1602)
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

/** Find the first element matching selector whose text includes the given string. */
function findByText(root, selector, text) {
  return Array.from(root.querySelectorAll(selector))
    .find((el) => el.textContent && el.textContent.includes(text)) || null;
}

/** Resolve the first content element of a section by its template id. */
function findSectionStart(section, root) {
  switch (section.id) {
    case 's1':
      return root.querySelector('.sc-lbJcrp.bQGNRU');
    case 's2': {
      const p = findByText(root, 'p', 'upgraded our network');
      return p ? p.parentElement : null;
    }
    case 's3':
      return root.querySelector('.sc-cbPlza.hidDuG');
    case 's4':
      return root.querySelector('.sc-cbPlza.bTWdQO');
    case 's5':
      return findByText(root, 'h2', 'Get your 5G+ mobile plan today');
    case 's6':
      return root.querySelector('.sc-cbPlza.labNNc');
    case 's7':
      return root.querySelector('.sc-cbPlza.imWEiG');
    case 's8':
      return root.querySelector('.sc-cbPlza.gdvwMg');
    case 's9':
      return findByText(root, 'h2', 'Frequently Asked Questions');
    default:
      return null;
  }
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const template = payload && payload.template;
  const sections = template && template.sections;
  if (!Array.isArray(sections) || sections.length < 2) return;

  const doc = (payload && payload.document) || element.ownerDocument;

  // Process in reverse so inserting a break/metadata before an earlier section
  // does not shift the anchors of sections not yet processed.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    const start = findSectionStart(section, element);
    if (!start || !start.parentNode) continue;

    // Section Metadata block for sections that declare a style.
    if (section.style) {
      const metaBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      // Place within the section, immediately after its first element.
      start.parentNode.insertBefore(metaBlock, start.nextSibling);
    }

    // Section break before every section except the first.
    if (i > 0) {
      const hr = doc.createElement('hr');
      start.parentNode.insertBefore(hr, start);
    }
  }
}
