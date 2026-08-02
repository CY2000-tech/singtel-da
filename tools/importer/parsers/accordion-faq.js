/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base block: accordion.
 * Source: https://www.singtel.com/personal/products-services/mobile/5g-plus (Singtel 5G+)
 * Instance selector:
 *   .sc-eqUAAy.eLrnuL:has(section.sc-faUjhM)
 *
 * Library structure (Accordion, 2 columns, multiple rows):
 *   Row 1: block name
 *   Each following row = one item: [ title | content ]
 *
 * Source notes (validated against cleaned.html):
 *   - Each FAQ item is a <section class="sc-faUjhM ..."> containing:
 *       - a <button> with the question <h3> (plus a decorative chevron <img>)
 *       - a #accordion-content-undefined body wrapping the answer <p>(s).
 *   - The section-level <h2> "Frequently Asked Questions" is NOT part of the
 *     accordion; it is left in place to remain default content / section heading.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('section.sc-faUjhM'));

  // Empty-block guard.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  items.forEach((item) => {
    // Title: the question heading (drop the decorative chevron image).
    const questionEl = item.querySelector('button h3, button h4, button h2, button');
    const title = document.createElement('p');
    title.textContent = questionEl ? (questionEl.textContent || '').trim() : '';

    // Answer body: the accordion content region; keep real paragraphs/links.
    const bodyRoot = item.querySelector('[id^="accordion-content"]') || item;
    const answers = Array.from(bodyRoot.querySelectorAll('p'))
      .filter((p) => p.textContent && p.textContent.replace(/ /g, '').trim())
      .filter((p) => !p.querySelector('p'));

    const contentCell = answers.length ? answers : [''];
    cells.push([title, contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
