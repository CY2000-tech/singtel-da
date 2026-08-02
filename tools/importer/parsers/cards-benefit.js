/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-benefit. Base block: cards.
 * Source: https://www.singtel.com/personal/products-services/mobile/5g-plus (Singtel 5G+)
 * Instances:
 *   1. .sc-gEvEer.iEmrWN:has(> .sc-eqUAAy.liiqJP > .sc-cKXybt.sc-lgjHQU img[alt*="Upsize"])
 *      -> "Upsize" intro benefit tiles (UNLIMITED 5G+, Safer Roaming, Secure 5G+ Network)
 *   2. .sc-cbPlza.labNNc .sc-gEvEer.iEmrWN:has(> div > .sc-cKXybt.sc-lgjHQU)
 *      -> "huge PLUS" benefit tiles (Network PLUS, Coverage PLUS, Innovation PLUS)
 *
 * Library structure (Cards, 2 columns, multiple rows):
 *   Row 1: block name
 *   Each following row = one card: [ image/icon | text (heading + optional description) ]
 *
 * Source notes (validated against cleaned.html):
 *   - Each tile is a .sc-cKXybt.sc-lgjHQU containing one <img> icon and one <h4> label.
 *   - The PLUS tiles additionally carry a descriptive <p>; the intro tiles do not.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.sc-cKXybt.sc-lgjHQU'));

  // Empty-block guard.
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cards.forEach((card) => {
    const img = card.querySelector('img');
    const heading = card.querySelector('h4, h3, h2, [class*="heading"]');
    // Description paragraph(s), if present (PLUS tiles). Skip empty/nbsp-only ones.
    const descs = Array.from(card.querySelectorAll('p'))
      .filter((p) => p.textContent && p.textContent.replace(/ /g, '').trim());

    const textCell = [];
    if (heading) {
      // Normalise the label to a real heading element.
      const h = document.createElement('h3');
      h.textContent = (heading.textContent || '').trim();
      textCell.push(h);
    }
    descs.forEach((p) => textCell.push(p));

    cells.push([img || '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-benefit', cells });
  element.replaceWith(block);
}
