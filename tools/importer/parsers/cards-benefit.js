/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-benefit. Base block: cards.
 * Sources:
 *   - https://www.singtel.com/personal/products-services/mobile/5g-plus (Singtel 5G+)
 *   - https://www.singtel.com/personal/mobile/plans/sim-only
 *
 * Instances:
 *   5G+ (hashed): the "Upsize" intro tiles and "huge PLUS" tiles.
 *   sim-only (hash-free): the PayLater perks row (3 icon tiles, one linking to
 *     Singtel Red membership):
 *       [data-testid="ColumnControllerRow"]:has(> div a[href*='red-membership'])
 *
 * Library structure (Cards, 2 columns, multiple rows):
 *   Row 1: block name
 *   Each following row = one card: [ image/icon | text (heading + optional description) ]
 *
 * Two source shapes are handled:
 *   A. 5G+ tiles: .sc-cKXybt.sc-lgjHQU wrappers, each an <img> icon + <h4> label
 *      (PLUS tiles also carry a description <p>).
 *   B. sim-only perk tiles: the row's direct-child tiles, each an <img> plus a
 *      description <p> (no heading on the perks row).
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  const cells = [];

  // Shape A: hashed 5G+ tiles.
  const cards = Array.from(element.querySelectorAll('.sc-cKXybt.sc-lgjHQU'));
  if (cards.length > 0) {
    cards.forEach((card) => {
      const img = card.querySelector('img');
      const heading = card.querySelector('h4, h3, h2, [class*="heading"]');
      const descs = Array.from(card.querySelectorAll('p'))
        .filter((p) => p.textContent && p.textContent.replace(/ /g, '').trim());

      const textCell = [];
      if (heading) {
        const h = document.createElement('h3');
        h.textContent = clean(heading.textContent);
        textCell.push(h);
      }
      descs.forEach((p) => textCell.push(p));
      cells.push([img || '', textCell.length ? textCell : '']);
    });

    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-benefit', cells });
    element.replaceWith(block);
    return;
  }

  // Shape B: sim-only perk tiles (direct-child tiles with an image).
  const tiles = Array.from(element.children).filter((t) => t.querySelector('img'));
  if (tiles.length > 0) {
    tiles.forEach((tile) => {
      const img = tile.querySelector('img');
      const heading = tile.querySelector('h4, h3, h2');
      // Description: leaf paragraphs with real text.
      const descs = Array.from(tile.querySelectorAll('p'))
        .filter((p) => clean(p.textContent))
        .filter((p) => !p.querySelector('p'));

      const textCell = [];
      if (heading && clean(heading.textContent)) {
        const h = document.createElement('h3');
        h.textContent = clean(heading.textContent);
        textCell.push(h);
      }
      descs.forEach((p) => {
        const np = document.createElement('p');
        // Preserve inline links inside the description paragraph.
        np.append(...p.cloneNode(true).childNodes);
        if (clean(np.textContent)) textCell.push(np);
      });
      cells.push([img || '', textCell.length ? textCell : '']);
    });

    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-benefit', cells });
    element.replaceWith(block);
    return;
  }

  // Empty-block guard.
  element.replaceWith(...element.childNodes);
}
