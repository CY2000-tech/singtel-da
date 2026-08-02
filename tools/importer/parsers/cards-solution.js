/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-solution. Base block: cards.
 * Source: https://www.singtel.com/personal/products-services/lifestyle-services/my-smart-network
 *
 * Instance selectors (page-templates.json, template "my-smart-network"):
 *   #tabpanel-0
 *   #tabpanel-1
 *   #tabpanel-2
 *
 * The passed element is a tab PANEL (#tabpanel-N). Its product carousel is
 * converted into a `cards-solution` block that is inserted as a SIBLING right
 * after the tabbed-section container (i.e. OUTSIDE the tabs-plans element). This
 * matters because cards-solution runs before tabs-plans, and tabs-plans replaces
 * the whole tab container — anything left inside a panel would be swallowed into
 * the tabs-plans block instead of surviving as its own top-level block.
 * The carousel is removed from the panel so it is not duplicated.
 *
 * Library convention (Cards, images present -> 2 columns, multiple rows):
 *   Row 1: block name.
 *   Each following row = one solution card:
 *     [ image (mandatory) | text (title heading + description + "Learn more" CTA) ]
 *
 * Stability notes:
 *   - Product cards carry a stable data-testid="BigImageCard" once hydrated; at
 *     scrape time they use the hashed class .sc-iHGNWf.axQpY. Both are tried.
 */
export default function parse(element, { document }) {
  let cards = Array.from(element.querySelectorAll('[data-testid="BigImageCard"]'));
  if (cards.length === 0) {
    cards = Array.from(element.querySelectorAll('.sc-iHGNWf.axQpY'));
  }

  // Empty-block guard: leave the panel untouched if no cards found.
  if (cards.length === 0) {
    return;
  }

  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

  const cells = [];
  cards.forEach((card) => {
    const img = card.querySelector('picture img, img');

    // Title: the first <span> holding real text (product name).
    const titleEl = Array.from(card.querySelectorAll('span'))
      .find((s) => clean(s.textContent))
      || card.querySelector('.sc-cfxfcM span, .sc-cfxfcM, .sc-kpDqfm');
    const title = clean(titleEl && titleEl.textContent);

    const ctaAnchor = card.querySelector('a[href]');

    // Description: card text minus title, CTA label, span/img/picture nodes.
    const cardClone = card.cloneNode(true);
    cardClone.querySelectorAll('a, button, span, img, picture').forEach((n) => n.remove());
    let desc = clean(cardClone.textContent);
    if (desc && title && desc.startsWith(title)) desc = clean(desc.slice(title.length));

    const bodyCell = [];
    if (title) {
      const h = document.createElement('h3');
      h.textContent = title;
      bodyCell.push(h);
    }
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc;
      bodyCell.push(p);
    }
    if (ctaAnchor) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = ctaAnchor.getAttribute('href');
      const labelEl = ctaAnchor.querySelector('button p, button, p');
      a.textContent = clean((labelEl && labelEl.textContent) || ctaAnchor.textContent) || 'Learn more';
      p.append(a);
      bodyCell.push(p);
    }

    cells.push([img || '', bodyCell.length ? bodyCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-solution', cells });

  // The tabbed-section container is the panel's parent (holds tablist + panels).
  const tabsContainer = element.parentElement;

  if (tabsContainer && tabsContainer.parentNode) {
    // Insert after the container, keeping order for successive panels: skip past
    // any cards-solution blocks a previous panel already inserted.
    let anchor = tabsContainer;
    while (
      anchor.nextElementSibling
      && anchor.nextElementSibling.classList
      && anchor.nextElementSibling.classList.contains('cards-solution')
    ) {
      anchor = anchor.nextElementSibling;
    }
    anchor.after(block);
  } else {
    // Fallback: replace the carousel in place.
    element.appendChild(block);
  }

  // Remove the carousel from the panel so tabs-plans does not re-capture it.
  cards.forEach((card) => {
    if (card.parentNode) card.remove();
  });
}
