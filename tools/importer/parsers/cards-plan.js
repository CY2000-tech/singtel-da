/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-plan. Base block: cards (no images -> 1 column).
 * Source: https://www.singtel.com/personal/mobile/plans/sim-only
 * Instance selector (page-templates.json, template "sim-only"):
 *   div.sc-iBBJcT.jyfDST
 *
 * Library convention (Cards, no images -> 1 column, multiple rows):
 *   Row 1: block name.
 *   Each following row = one plan card, single cell holding the full plan content:
 *     plan name heading (+ tier badge), feature list, "Comes with" inclusions,
 *     optional "Promotions" list, price block (term + monthly + U.P.), and "Get" CTA.
 *
 * Source notes (validated against migration-work/sim-only/cleaned.html):
 *   - The .sc-iBBJcT.jyfDST container holds ALL plans as a flat list of sibling
 *     <div> wrappers. Each plan begins at a .sc-OIPhM.iMiNRO plan-name block
 *     (<h3 class="sc-kpDqfm"> with the name span + a tier badge span .sc-jsJBEP).
 *   - Per plan the following sibling wrappers contain:
 *       feature list -> ul.sc-kgvGAC (icon+text <li> rows; text in p.sc-cwHptR)
 *       "Comes with"  -> .sc-dGHkRN (p "Comes with" + span.sc-iEXKAA items)
 *       "Promotions"  -> .sc-erUUZj (p "Promotions" + span.sc-iEXKAA items) [optional]
 *       price block   -> .sc-jRUPCi.zqfZI (term p.hvumPx + monthly p.sc-dAlyuH + U.P. p.gKCTPt)
 *       "Get" CTA     -> .sc-buvPDS a[href] wrapping <button><p>Get</p></button>
 *   - We split the flat sibling list into per-plan groups at each .sc-OIPhM.iMiNRO.
 */
export default function parse(element, { document }) {
  const nameBlocks = Array.from(element.querySelectorAll('.sc-OIPhM.iMiNRO'));

  // Empty-block guard: unwrap if no plans found.
  if (nameBlocks.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Map each plan-name block to the top-level sibling wrapper it lives in, so we
  // can slice the container's direct children into per-plan groups.
  const topChildren = Array.from(element.children);
  const boundaries = nameBlocks.map((nb) => {
    let node = nb;
    while (node.parentElement && node.parentElement !== element) node = node.parentElement;
    return topChildren.indexOf(node);
  }).filter((i) => i >= 0);

  const cleanText = (el) => (el ? el.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim() : '');

  const cells = [];

  boundaries.forEach((startIdx, i) => {
    const endIdx = i + 1 < boundaries.length ? boundaries[i + 1] : topChildren.length;
    const group = topChildren.slice(startIdx, endIdx);
    // Scope querying to just this plan's wrappers.
    const scope = document.createElement('div');
    group.forEach((g) => scope.appendChild(g.cloneNode(true)));

    const bodyCell = [];

    // Plan name + tier badge.
    const nameEl = scope.querySelector('.sc-OIPhM.iMiNRO h3, h3.sc-kpDqfm');
    if (nameEl) {
      const nameSpan = nameEl.querySelector('span:not(.sc-jsJBEP)');
      const name = cleanText(nameSpan) || cleanText(nameEl);
      const h = document.createElement('h3');
      h.textContent = name;
      bodyCell.push(h);
      const badge = nameEl.querySelector('.sc-jsJBEP');
      if (badge && cleanText(badge)) {
        const bp = document.createElement('p');
        const em = document.createElement('em');
        em.textContent = cleanText(badge);
        bp.append(em);
        bodyCell.push(bp);
      }
    }

    // Feature list (icon + text rows) -> unordered list of text.
    // Each <li> holds an icon wrapper (with an empty &nbsp; <p>) followed by a
    // text wrapper div; read the li's last element child (the text) to avoid the
    // empty icon-adjacent paragraph.
    const featureList = scope.querySelector('ul.sc-kgvGAC, ul');
    if (featureList) {
      const items = Array.from(featureList.querySelectorAll(':scope > li'));
      const ul = document.createElement('ul');
      items.forEach((li) => {
        const textEl = li.querySelector(':scope > div:last-child') || li;
        const text = cleanText(textEl);
        if (text) {
          const nli = document.createElement('li');
          nli.textContent = text;
          ul.append(nli);
        }
      });
      if (ul.children.length) bodyCell.push(ul);
    }

    // "Comes with" inclusions and optional "Promotions" — each a labelled list.
    const listGroups = Array.from(scope.querySelectorAll('.sc-dGHkRN, .sc-erUUZj'));
    listGroups.forEach((grp) => {
      const label = grp.querySelector('p.sc-jEACwC');
      const labelText = cleanText(label);
      if (labelText) {
        const lp = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = labelText;
        lp.append(strong);
        bodyCell.push(lp);
      }
      const items = Array.from(grp.querySelectorAll('span.sc-iEXKAA, .sc-iEXKAA'));
      const ul = document.createElement('ul');
      items.forEach((it) => {
        const text = cleanText(it);
        if (text) {
          const nli = document.createElement('li');
          nli.textContent = text;
          ul.append(nli);
        }
      });
      if (ul.children.length) bodyCell.push(ul);
    });

    // Price block: contract term + monthly price + struck-through usual price.
    const priceGroups = Array.from(scope.querySelectorAll('.sc-jRUPCi.zqfZI'));
    priceGroups.forEach((pg) => {
      const term = cleanText(pg.querySelector('p.hvumPx, p.sc-cwHptR'));
      const monthly = cleanText(pg.querySelector('p.sc-dAlyuH'));
      const usual = cleanText(pg.querySelector('p.gKCTPt'));
      const parts = [];
      if (term) parts.push(term);
      if (monthly) parts.push(monthly);
      if (usual) parts.push(`U.P. ${usual}`);
      if (parts.length) {
        const pp = document.createElement('p');
        pp.textContent = parts.join(' • ');
        bodyCell.push(pp);
      }
    });

    // "Get" CTA.
    const ctaAnchor = scope.querySelector('.sc-buvPDS a[href], a[href]');
    if (ctaAnchor) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = ctaAnchor.getAttribute('href');
      const labelEl = ctaAnchor.querySelector('button p, button, p');
      a.textContent = ((labelEl && labelEl.textContent) || ctaAnchor.textContent || '').trim() || 'Get';
      p.append(a);
      bodyCell.push(p);
    }

    if (bodyCell.length) cells.push([bodyCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-plan', cells });
  element.replaceWith(block);
}
