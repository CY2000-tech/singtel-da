/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base block: accordion.
 * Sources:
 *   - https://www.singtel.com/personal/products-services/mobile/5g-plus (Singtel 5G+)
 *   - https://www.singtel.com/personal/products-services/lifestyle-services/my-smart-network
 *   - https://www.singtel.com/personal/mobile/plans/sim-only
 *
 * Instance selector (hash-free, stable):
 *   div:has(> div h2):has(> section [data-testid="titleId"])
 *
 * Library structure (Accordion, 2 columns, multiple rows):
 *   Row 1: block name
 *   Each following row = one item: [ title | content ]
 *
 * Stability notes:
 *   - Each FAQ item is a <section> containing a question button (stable
 *     data-testid="titleId") and an answer region (data-testid="descriptionId").
 *   - Older 5G+ markup used <section class="sc-faUjhM ...">; we anchor on the
 *     testids first and fall back to the hashed class.
 *   - The section-level <h2> heading stays in place as default content.
 */
export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll('section:has([data-testid="titleId"])'));
  if (items.length === 0) {
    items = Array.from(element.querySelectorAll('section.sc-faUjhM'));
  }
  if (items.length === 0) {
    items = Array.from(element.querySelectorAll('section'));
  }

  // Empty-block guard.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  items.forEach((item) => {
    // Title: the question heading (drop the decorative chevron image).
    const titleRoot = item.querySelector('[data-testid="titleId"]') || item;
    const questionEl = titleRoot.querySelector('h3, h4, h2') || titleRoot.querySelector('button') || titleRoot;
    const title = document.createElement('p');
    title.textContent = (questionEl.textContent || '').trim();

    // Answer body: the description region; keep real leaf paragraphs/links.
    const bodyRoot = item.querySelector('[data-testid="descriptionId"]')
      || item.querySelector('[id^="accordion-content"]')
      || item;
    const answers = Array.from(bodyRoot.querySelectorAll('p'))
      .filter((p) => p.textContent && p.textContent.replace(/ /g, '').trim())
      .filter((p) => !p.querySelector('p'));

    const contentCell = answers.length ? answers : [''];
    cells.push([title, contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
