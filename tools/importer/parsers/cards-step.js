/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-step. Base block: cards.
 * Source: https://www.singtel.com/personal/products-services/mobile/5g-plus (Singtel 5G+)
 * Instance selector:
 *   .sc-cbPlza.imWEiG .sc-gEvEer.iEmrWN:has(> .sc-eqUAAy.kxvbvX)
 *
 * Library structure (Cards, 2 columns, multiple rows):
 *   Row 1: block name
 *   Each following row = one card: [ image | text (heading + description) ]
 *
 * Source notes (validated against cleaned.html):
 *   - Step cards are .sc-eqUAAy.kxvbvX columns; only the ones with an <img> hold
 *     a real step (Step 1, Step 2). Empty kxvbvX columns are layout spacers.
 *   - Each step card has a top <img>, an <h3> ("Step N: ...") and one or more
 *     descriptive <p> (with inline links) that follow.
 */
export default function parse(element, { document }) {
  const columns = Array.from(element.querySelectorAll(':scope > .sc-eqUAAy.kxvbvX'));
  // Keep only columns that actually contain a step (image + heading).
  const stepCards = columns.filter((col) => col.querySelector('img') && col.querySelector('h3, h4, h2'));

  // Empty-block guard.
  if (stepCards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  stepCards.forEach((card) => {
    const img = card.querySelector('img');
    const heading = card.querySelector('h3, h4, h2, [class*="heading"]');

    // Description: leaf paragraphs with real text (skip nbsp-only spacers).
    const descs = Array.from(card.querySelectorAll('p'))
      .filter((p) => p.textContent && p.textContent.replace(/ /g, '').trim())
      .filter((p) => !p.querySelector('p'));

    const textCell = [];
    if (heading) {
      const h = document.createElement('h3');
      // Preserve inline markup inside the heading if any, else text.
      h.append(...heading.childNodes);
      textCell.push(h);
    }
    descs.forEach((p) => textCell.push(p));

    cells.push([img || '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-step', cells });
  element.replaceWith(block);
}
