/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-step. Base block: cards.
 * Sources:
 *   - https://www.singtel.com/personal/products-services/mobile/5g-plus (Singtel 5G+)
 *   - https://www.singtel.com/personal/mobile/plans/sim-only
 *
 * Instances:
 *   5G+ (hashed): .sc-cbPlza.imWEiG .sc-gEvEer.iEmrWN:has(> .sc-eqUAAy.kxvbvX)
 *   sim-only (hash-free): the "More savings / flexibility / perks" 3-tile row:
 *     [data-testid="ColumnControllerRow"]:has(> div a[href$="#featuredmobile"])
 *
 * Library structure (Cards, 2 columns, multiple rows):
 *   Row 1: block name
 *   Each following row = one card: [ image | text (heading + description) ]
 *
 * Two source shapes are handled:
 *   A. 5G+ step columns: .sc-eqUAAy.kxvbvX children; only those with an image +
 *      heading are real steps ("Step 1", "Step 2").
 *   B. sim-only benefit tiles: the row's direct-child tiles, each holding an
 *      <img>, an <h3> label, and a description <p>.
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  const cells = [];

  // Shape A: hashed 5G+ step columns.
  const columns = Array.from(element.querySelectorAll(':scope > .sc-eqUAAy.kxvbvX'));
  const stepCards = columns.filter((col) => col.querySelector('img') && col.querySelector('h3, h4, h2'));
  if (stepCards.length > 0) {
    stepCards.forEach((card) => {
      const img = card.querySelector('img');
      const heading = card.querySelector('h3, h4, h2, [class*="heading"]');
      const descs = Array.from(card.querySelectorAll('p'))
        .filter((p) => p.textContent && p.textContent.replace(/ /g, '').trim())
        .filter((p) => !p.querySelector('p'));

      const textCell = [];
      if (heading) {
        const h = document.createElement('h3');
        h.append(...heading.childNodes);
        textCell.push(h);
      }
      descs.forEach((p) => textCell.push(p));
      cells.push([img || '', textCell.length ? textCell : '']);
    });

    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-step', cells });
    element.replaceWith(block);
    return;
  }

  // Shape B: sim-only benefit tiles (direct-child tiles with image + heading).
  const tiles = Array.from(element.children).filter((t) => t.querySelector('img'));
  if (tiles.length > 0) {
    tiles.forEach((tile) => {
      const img = tile.querySelector('img');
      const heading = tile.querySelector('h3, h4, h2');
      const descs = Array.from(tile.querySelectorAll('p'))
        .filter((p) => clean(p.textContent))
        .filter((p) => !p.querySelector('p'));

      const textCell = [];
      if (heading) {
        const h = document.createElement('h3');
        h.textContent = clean(heading.textContent);
        textCell.push(h);
      }
      descs.forEach((p) => {
        const np = document.createElement('p');
        np.textContent = clean(p.textContent);
        textCell.push(np);
      });
      cells.push([img || '', textCell.length ? textCell : '']);
    });

    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-step', cells });
    element.replaceWith(block);
    return;
  }

  // Empty-block guard.
  element.replaceWith(...element.childNodes);
}
