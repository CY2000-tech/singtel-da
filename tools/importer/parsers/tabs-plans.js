/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-plans. Base block: tabs.
 * Source: https://www.singtel.com/personal/products-services/mobile/5g-plus (Singtel 5G+)
 * Instance selector:
 *   div:has(> .sc-bkSUFG.jYsZQx):has(> #tabpanel-0):has(> #tabpanel-1)
 *
 * Library structure (Tabs, 2 columns, multiple rows):
 *   Row 1: block name
 *   Each following row = one tab: [ tab label | tab content ]
 *
 * Source notes (validated against cleaned.html):
 *   - Tab labels live in .sc-bkSUFG.jYsZQx as two <h3> ("Phone plans", "SIM Only plans").
 *   - Panel content is #tabpanel-0 / #tabpanel-1, each holding a comparison <img>.
 */
export default function parse(element, { document }) {
  const labelEls = Array.from(element.querySelectorAll('.sc-bkSUFG.jYsZQx h3, .sc-bkSUFG.jYsZQx h4'));
  const panels = Array.from(element.querySelectorAll(':scope > [id^="tabpanel-"]'));

  // Empty-block guard.
  if (labelEls.length === 0 || panels.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  panels.forEach((panel, i) => {
    // Label cell: reuse the matching label text; fall back to a generic name.
    const labelText = labelEls[i] ? (labelEls[i].textContent || '').trim() : `Tab ${i + 1}`;
    const label = document.createElement('p');
    label.textContent = labelText;

    // Content cell: the panel's media (image) plus any text.
    const contentCell = [];
    const img = panel.querySelector('img');
    if (img) contentCell.push(img);
    // Preserve any additional textual content in the panel.
    Array.from(panel.querySelectorAll('p, h1, h2, h3, h4, h5, h6'))
      .filter((el) => el.textContent && el.textContent.trim())
      .forEach((el) => contentCell.push(el));

    cells.push([label, contentCell.length ? contentCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-plans', cells });
  element.replaceWith(block);
}
