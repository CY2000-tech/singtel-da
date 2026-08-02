/*
 * Cards (Plan) Block — cards-plan
 * Rich SIM-only plan pricing card. Each authored row is a single cell holding:
 *   - plan name heading (h3)
 *   - an optional tier badge (p > em, e.g. "5G+ Enhanced")
 *   - a feature list (first ul)
 *   - a "Comes with" inclusions list (p > strong label + ul)
 *   - an optional "Promotions" list (p > strong label + ul)
 *   - a price line (p: "term • $price/mth • U.P. $up")
 *   - a "Get" CTA link (p > a)
 * Layout is a row of white bordered cards, horizontally scrollable on wider screens.
 */

/**
 * Parse the price paragraph ("No contract • $36.00/mth • U.P. $40.00")
 * into a structured price block.
 */
function buildPriceBlock(p) {
  const parts = p.textContent.split('•').map((s) => s.trim()).filter(Boolean);
  const term = parts[0] || '';
  const amount = parts[1] || '';
  const up = (parts[2] || '').replace(/^U\.P\.\s*/i, '');

  const block = document.createElement('div');
  block.className = 'cards-plan-price';

  if (term) {
    const t = document.createElement('span');
    t.className = 'cards-plan-term';
    t.textContent = term;
    block.append(t);
  }

  const row = document.createElement('div');
  row.className = 'cards-plan-price-row';
  if (amount) {
    const a = document.createElement('span');
    a.className = 'cards-plan-amount';
    a.textContent = amount;
    row.append(a);
  }
  if (up) {
    const u = document.createElement('span');
    u.className = 'cards-plan-up';
    u.textContent = up;
    row.append(u);
  }
  block.append(row);
  return block;
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-plan-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      div.className = 'cards-plan-card-body';
    });
    ul.append(li);
  });

  ul.querySelectorAll('li').forEach((li) => {
    const body = li.querySelector('.cards-plan-card-body');
    if (!body) return;

    // --- Header: plan name + tier badge ---
    const h3 = body.querySelector(':scope > h3');
    const badgeP = body.querySelector(':scope > p > em')?.closest('p');
    if (h3) {
      const header = document.createElement('div');
      header.className = 'cards-plan-header';
      h3.before(header);
      header.append(h3);
      if (badgeP && badgeP.textContent.trim() === badgeP.querySelector('em').textContent.trim()) {
        const badge = document.createElement('span');
        badge.className = 'cards-plan-badge';
        badge.textContent = badgeP.querySelector('em').textContent.trim();
        header.append(badge);
        badgeP.remove();
      }
    }

    // --- Feature list: the first ul that is NOT preceded by a strong label ---
    const lists = [...body.querySelectorAll(':scope > ul')];
    lists.forEach((list) => {
      const prev = list.previousElementSibling;
      const label = prev && prev.matches('p') ? prev.querySelector('strong') : null;
      if (!label) {
        list.classList.add('cards-plan-features');
        return;
      }
      const text = label.textContent.trim().toLowerCase();
      prev.classList.add('cards-plan-label');
      if (text.startsWith('promotion')) {
        // wrap label + list in a highlighted promo block
        const wrap = document.createElement('div');
        wrap.className = 'cards-plan-promo';
        prev.before(wrap);
        wrap.append(prev, list);
        list.classList.add('cards-plan-promo-list');
      } else {
        list.classList.add('cards-plan-includes');
      }
    });

    // --- Price line: paragraph containing "/mth" ---
    const priceP = [...body.querySelectorAll(':scope > p')]
      .find((p) => /\/mth/i.test(p.textContent) && !p.querySelector('a'));
    if (priceP) {
      priceP.replaceWith(buildPriceBlock(priceP));
    }

    // --- CTA: the last paragraph that contains only a link becomes a pill button ---
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
