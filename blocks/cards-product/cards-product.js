import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Cards (Product) Block — cards-product
 * Horizontally scrollable product carousel for the PayLater phone shop.
 * Each card row = image cell (product photo) + body cell { product name + "Add" CTA }.
 * No price/description — image + name + CTA only.
 */
export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-product-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-product-card-image';
      else div.className = 'cards-product-card-body';
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '512' }])));

  // Promote the CTA link ("Add") to a pill button
  ul.querySelectorAll('li .cards-product-card-body').forEach((body) => {
    const ctaLink = [...body.querySelectorAll(':scope > p > a')]
      .reverse()
      .find((a) => a.closest('p').textContent.trim() === a.textContent.trim());
    if (ctaLink) {
      const ctaP = ctaLink.closest('p');
      ctaP.className = 'button-container';
      ctaLink.className = 'button';
      ctaLink.title = ctaLink.title || ctaLink.textContent;
    }
  });

  block.replaceChildren(ul);
}
