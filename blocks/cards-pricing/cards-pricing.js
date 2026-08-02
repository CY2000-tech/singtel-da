import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-pricing-card-image';
      else div.className = 'cards-pricing-card-body';
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '256' }])));

  /* Restructure each card so the icon sits beside the title/price header,
     with the description below and the CTA pinned to the bottom. */
  ul.querySelectorAll('li').forEach((li) => {
    const image = li.querySelector('.cards-pricing-card-image');
    const body = li.querySelector('.cards-pricing-card-body');
    if (!body) return;

    const heading = body.querySelector('h3, h2, h4');
    // price = first paragraph that is not a button-container and matches a price-like string
    const priceP = [...body.querySelectorAll(':scope > p')].find(
      (p) => !p.classList.contains('button-container') && /^[$€£]?\s*\d/.test(p.textContent.trim()),
    );

    // Build the header (icon + title/price group)
    const header = document.createElement('div');
    header.className = 'cards-pricing-card-header';
    if (image) header.append(image);

    const titleGroup = document.createElement('div');
    titleGroup.className = 'cards-pricing-card-title-group';
    if (heading) titleGroup.append(heading);
    if (priceP) {
      priceP.classList.add('cards-pricing-card-price');
      titleGroup.append(priceP);
    }
    header.append(titleGroup);

    // Insert header at the top of the body
    body.prepend(header);

    // Promote the CTA: the last paragraph that contains only a link becomes a pill button
    const ctaLink = [...body.querySelectorAll(':scope > p > a')]
      .reverse()
      .find((a) => a.closest('p').textContent.trim() === a.textContent.trim());
    if (ctaLink) {
      const ctaP = ctaLink.closest('p');
      ctaP.className = 'button-container';
      ctaLink.className = 'button';
      ctaLink.title = ctaLink.title || ctaLink.textContent;
    }

    // Tag the remaining description paragraph(s)
    [...body.querySelectorAll(':scope > p')].forEach((p) => {
      if (!p.classList.contains('button-container') && !p.classList.contains('cards-pricing-card-price')) {
        p.classList.add('cards-pricing-card-desc');
      }
    });
  });

  block.replaceChildren(ul);
}
