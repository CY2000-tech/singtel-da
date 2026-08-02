/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-feature. Base block: cards.
 * Source: https://www.singtel.com/personal/products-services/mobile/5g-plus (Singtel 5G+)
 * Instances:
 *   1. .sc-cbPlza.hidDuG .sc-gEvEer.iEmrWN:has(> div > .sc-cKXybt.sc-fatcLD)  -> 5G+ Enhanced features
 *   2. .sc-cbPlza.bTWdQO .sc-gEvEer.iEmrWN:has(> div > .sc-cKXybt.sc-fatcLD)  -> 5G+ Priority features
 *
 * Library structure (Cards, 2 columns, multiple rows):
 *   Row 1: block name
 *   Each following row = one card: [ icon | text (heading + description) ]
 *
 * Source notes (validated against cleaned.html):
 *   - Each feature card is a .sc-cKXybt.sc-fatcLD with an <img> icon and a
 *     .sc-dBFDNq body containing an <h3> title and a nested description <p>.
 *   - The description is double-wrapped; the real text is the innermost
 *     .sc-hqpNSm paragraph, so extract that to avoid empty/duplicate copy.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.sc-cKXybt.sc-fatcLD'));

  // Empty-block guard.
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cards.forEach((card) => {
    const img = card.querySelector('img');
    const body = card.querySelector('.sc-dBFDNq') || card;
    const heading = body.querySelector('h3, h4, h2, [class*="heading"]');

    // Description: innermost real paragraph(s) (ignore empty/nbsp wrappers).
    const descs = Array.from(body.querySelectorAll('.sc-hqpNSm p, p'))
      .filter((p) => p.textContent && p.textContent.replace(/ /g, '').trim())
      // de-dupe nested wrappers: keep leaf paragraphs (no descendant <p>).
      .filter((p) => !p.querySelector('p'));

    const textCell = [];
    if (heading) {
      const h = document.createElement('h3');
      h.textContent = (heading.textContent || '').trim();
      textCell.push(h);
    }
    descs.forEach((p) => textCell.push(p));

    cells.push([img || '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
  element.replaceWith(block);
}
