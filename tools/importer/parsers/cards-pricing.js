/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-pricing. Base block: cards.
 * Source: https://www.singtel.com/personal/products-services/mobile/5g-plus (Singtel 5G+)
 * Instance selector:
 *   .sc-cbPlza.gdvwMg .sc-dAEZTx.LGnnw
 *
 * Library structure (Cards, 2 columns, multiple rows):
 *   Row 1: block name
 *   Each following row = one card: [ image/icon | text (title + price + description + CTA) ]
 *
 * Source notes (validated against cleaned.html):
 *   - Each pricing card is a .sc-iHGNWf.axQpY with an <img> icon, a title
 *     <span> (.sc-cfxfcM), a price <p> (.sc-gFAWRd), a description block
 *     (.sc-kdBSHD) and a CTA <a href> wrapping a <button>.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.sc-iHGNWf.axQpY'));

  // Empty-block guard.
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cards.forEach((card) => {
    const img = card.querySelector('img');
    const titleEl = card.querySelector('.sc-cfxfcM span, .sc-cfxfcM, .sc-kpDqfm');
    const priceEl = card.querySelector('.sc-gFAWRd p, .sc-gFAWRd, .sc-cwHptR');
    const descEl = card.querySelector('.sc-kdBSHD .sc-hqpNSm, .sc-kdBSHD');
    const ctaAnchor = card.querySelector('a[href]');

    const textCell = [];
    if (titleEl && titleEl.textContent.trim()) {
      const h = document.createElement('h3');
      h.textContent = titleEl.textContent.trim();
      textCell.push(h);
    }
    if (priceEl && priceEl.textContent.trim()) {
      const price = document.createElement('p');
      price.textContent = priceEl.textContent.trim();
      textCell.push(price);
    }
    if (descEl && descEl.textContent.trim()) {
      const desc = document.createElement('p');
      desc.textContent = descEl.textContent.trim();
      textCell.push(desc);
    }
    if (ctaAnchor) {
      const link = document.createElement('a');
      link.href = ctaAnchor.getAttribute('href');
      const label = ctaAnchor.querySelector('button p, button, p') || ctaAnchor;
      link.textContent = (label.textContent || '').trim() || 'Sign up';
      textCell.push(link);
    }

    cells.push([img || '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-pricing', cells });
  element.replaceWith(block);
}
