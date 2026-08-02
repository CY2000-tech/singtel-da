/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-feature. Base block: cards.
 * Sources:
 *   - https://www.singtel.com/personal/products-services/mobile/5g-plus (Singtel 5G+)
 *   - https://www.singtel.com/personal/products-services/lifestyle-services/my-smart-network
 *
 * Instances:
 *   5G+ (hashed, unchanged): the two feature grids under Enhanced / Priority.
 *   my-smart-network (hash-free): the two 3-step approach rows, anchored on the
 *     stable step image alts:
 *       div:has(> div > div > picture img[alt="Singtel 3-step approach step 1"])
 *       div:has(> div > div > picture img[alt="Singtel 3-step approach step 3"])
 *
 * Library structure (Cards, 2 columns, multiple rows):
 *   Row 1: block name
 *   Each following row = one card: [ icon/image | text (heading + description) ]
 *
 * Two source shapes are handled:
 *   A. 5G+ feature card: a .sc-cKXybt.sc-fatcLD wrapper with an <img> icon and a
 *      .sc-dBFDNq body (h3 title + nested description <p>).
 *   B. my-smart-network 3-step row: alternating image wrapper + text wrapper
 *      children. Each step image (alt="Singtel 3-step approach step N") is
 *      followed by a sibling text block holding a <p> title and <p> description.
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  const cells = [];

  // Shape A: hashed 5G+ feature cards.
  const featureCards = Array.from(element.querySelectorAll('.sc-cKXybt.sc-fatcLD'));
  if (featureCards.length > 0) {
    featureCards.forEach((card) => {
      const img = card.querySelector('img');
      const body = card.querySelector('.sc-dBFDNq') || card;
      const heading = body.querySelector('h3, h4, h2, [class*="heading"]');
      const descs = Array.from(body.querySelectorAll('.sc-hqpNSm p, p'))
        .filter((p) => p.textContent && p.textContent.replace(/ /g, '').trim())
        .filter((p) => !p.querySelector('p'));

      const textCell = [];
      if (heading) {
        const h = document.createElement('h3');
        h.textContent = clean(heading.textContent);
        textCell.push(h);
      }
      descs.forEach((p) => textCell.push(p));
      cells.push([img || '', textCell.length ? textCell : '']);
    });

    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
    element.replaceWith(block);
    return;
  }

  // Shape B: my-smart-network 3-step row (image wrapper + text wrapper siblings).
  const stepImgs = Array.from(element.querySelectorAll('img[alt^="Singtel 3-step approach step"]'));
  if (stepImgs.length > 0) {
    stepImgs.forEach((img) => {
      // Climb to the direct child of the row that holds this image.
      let imgWrap = img;
      while (imgWrap.parentElement && imgWrap.parentElement !== element) {
        imgWrap = imgWrap.parentElement;
      }
      const textWrap = imgWrap.nextElementSibling;

      const textCell = [];
      if (textWrap) {
        const ps = Array.from(textWrap.querySelectorAll('p'))
          .filter((p) => clean(p.textContent))
          .filter((p) => !p.querySelector('p'));
        // First real paragraph is the label -> promote to heading.
        if (ps.length) {
          const h = document.createElement('h3');
          h.textContent = clean(ps[0].textContent);
          textCell.push(h);
          ps.slice(1).forEach((p) => {
            const np = document.createElement('p');
            np.textContent = clean(p.textContent);
            textCell.push(np);
          });
        }
      }
      cells.push([img || '', textCell.length ? textCell : '']);
    });

    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
    element.replaceWith(block);
    return;
  }

  // Empty-block guard.
  element.replaceWith(...element.childNodes);
}
