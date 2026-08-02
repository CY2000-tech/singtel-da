import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Cards (Solution) Block — cards-solution
 * Informational product/solution cards: image-top thumbnail + title + description
 * + "Learn more" link. Rendered as a responsive grid; typically nested inside a
 * tabs-plans panel (Security & protection / Productivity / Travel & lifestyle).
 * Distinct from cards-product (shop carousel: image + name + Add-to-cart, no description).
 */
export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-solution-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-solution-card-image';
      else div.className = 'cards-solution-card-body';
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '512' }])));

  // Style the trailing "Learn more" link as a text CTA within each card body
  ul.querySelectorAll('li .cards-solution-card-body').forEach((body) => {
    const lastP = body.querySelector('p:last-of-type');
    const link = lastP && lastP.querySelector('a');
    if (link && lastP.textContent.trim() === link.textContent.trim()) {
      lastP.classList.add('cards-solution-cta');
      link.classList.add('cards-solution-link');
    }
  });

  block.replaceChildren(ul);
}
