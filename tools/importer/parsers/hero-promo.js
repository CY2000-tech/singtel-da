/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-promo. Base block: hero.
 * Source: https://www.singtel.com/personal/products-services/mobile/5g-plus (Singtel 5G+)
 * Instance selector: .sc-lbJcrp.bQGNRU
 *
 * Library structure (Hero, 1 column, up to 3 rows):
 *   Row 1: block name
 *   Row 2: background image (optional)
 *   Row 3: single cell with Title (heading) + Subheading + CTA
 *
 * Source notes (validated against cleaned.html):
 *   - Background image is a direct-child <img> of the hero root.
 *   - <h1> is the title, first <p> is the subheading.
 *   - The CTA is an <a href> wrapping a <button><p>Learn more</p></button>.
 */
export default function parse(element, { document }) {
  // Background image: prefer a direct-child img, fall back to first img before the copy block.
  const bgImage = element.querySelector(':scope > img') || element.querySelector('img');

  const heading = element.querySelector('h1, h2, [class*="title"]');
  // Subheading: first paragraph that is NOT the button label.
  const paragraphs = Array.from(element.querySelectorAll('p'));
  const subheading = paragraphs.find((p) => !p.closest('button'));

  // CTA: the anchor that wraps the button; rebuild as a clean text link.
  const ctaAnchors = Array.from(element.querySelectorAll('a[href]'));
  const ctaLinks = ctaAnchors.map((a) => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    const label = a.querySelector('button p, button, p') || a;
    link.textContent = (label.textContent || '').trim();
    return link;
  }).filter((a) => a.textContent);

  // Empty-block guard.
  if (!heading && !subheading && ctaLinks.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (bgImage) cells.push([bgImage]);

  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (subheading) contentCell.push(subheading);
  contentCell.push(...ctaLinks);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-promo', cells });
  element.replaceWith(block);
}
