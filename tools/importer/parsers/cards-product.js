/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-product. Base block: cards (images present -> 2 columns).
 * Source: https://www.singtel.com/personal/mobile/plans/sim-only
 *
 * Instance selector (hash-free, stable):
 *   [data-testid="ColumnControllerRow"]:has(a[href*='shop.singtel.com/phones'])
 *
 * The passed element is the row wrapping the PayLater phone carousel (plus a
 * trailing "See more phones" link). Each product card is discovered by its
 * phone-shop link so the parser is independent of styled-component hashes and of
 * whether the carousel testids have hydrated yet.
 *
 * Library convention (Cards, images present -> 2 columns, multiple rows):
 *   Row 1: block name.
 *   Each following row = one product card:
 *     [ image (mandatory) | text (product name heading + "Add" CTA) ]
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

  // Prefer explicit card wrappers; else derive one card per phone-shop link.
  let cards = Array.from(element.querySelectorAll('[data-testid="BigImageCard"]'));
  if (cards.length === 0) {
    cards = Array.from(element.querySelectorAll('.sc-iHGNWf.axQpY'));
  }
  if (cards.length === 0) {
    // Derive the card wrapper from each product ("Add") link: climb until the
    // element also contains the product image.
    const addLinks = Array.from(element.querySelectorAll("a[href*='shop.singtel.com/phones']"));
    cards = addLinks.map((link) => {
      let el = link;
      while (el.parentElement && el.parentElement !== element && !el.querySelector('img')) {
        el = el.parentElement;
      }
      return el;
    }).filter((el, i, arr) => el && arr.indexOf(el) === i);
  }

  // Empty-block guard.
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cards.forEach((card) => {
    const img = card.querySelector('picture img, img');
    const ctaAnchor = card.querySelector("a[href*='shop.singtel.com/phones'], a[href]");

    // Name: first <span> with real text, else the card text minus the CTA label.
    let name = '';
    const nameSpan = Array.from(card.querySelectorAll('span')).find((s) => clean(s.textContent));
    if (nameSpan) {
      name = clean(nameSpan.textContent);
    } else {
      const clone = card.cloneNode(true);
      clone.querySelectorAll('a, button, img, picture').forEach((n) => n.remove());
      name = clean(clone.textContent);
    }

    const bodyCell = [];
    if (name) {
      const h = document.createElement('h3');
      h.textContent = name;
      bodyCell.push(h);
    }
    if (ctaAnchor) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = ctaAnchor.getAttribute('href');
      const labelEl = ctaAnchor.querySelector('button p, button, p');
      a.textContent = clean((labelEl && labelEl.textContent) || ctaAnchor.textContent) || 'Add';
      p.append(a);
      bodyCell.push(p);
    }

    cells.push([img || '', bodyCell.length ? bodyCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });
  element.replaceWith(block);
}
