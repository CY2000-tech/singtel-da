/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-plans. Base block: tabs.
 * Sources:
 *   - https://www.singtel.com/personal/products-services/mobile/5g-plus (Singtel 5G+)
 *   - https://www.singtel.com/personal/products-services/lifestyle-services/my-smart-network
 *
 * Instance selector (hash-free, stable):
 *   div:has(> [role="tablist"]):has(> [id^="tabpanel-"])
 *
 * Library structure (Tabs, 2 columns, multiple rows):
 *   Row 1: block name
 *   Each following row = one tab: [ tab label | tab content ]
 *
 * Stability notes:
 *   - Styled-component hashes (e.g. .sc-bkSUFG.jYsZQx) are regenerated on every
 *     React build, so we anchor on stable [role="tab"]/[role="tablist"] and the
 *     #tabpanel-N ids instead.
 *   - The tab content cell keeps ALL of the panel's element children. On the
 *     my-smart-network page the panels contain product carousels that the
 *     cards-solution parser has ALREADY replaced with a `cards-solution` block
 *     (cards-solution runs before tabs-plans), so moving the panel children in
 *     preserves that nested block instead of discarding it.
 */
export default function parse(element, { document }) {
  // Tab labels: prefer accessible [role="tab"] elements; fall back to the
  // hashed label bar's headings for older markup.
  let labelEls = Array.from(element.querySelectorAll(':scope > [role="tablist"] [role="tab"]'));
  if (labelEls.length === 0) {
    labelEls = Array.from(element.querySelectorAll('[role="tab"]'));
  }
  if (labelEls.length === 0) {
    labelEls = Array.from(element.querySelectorAll('.sc-bkSUFG.jYsZQx h3, .sc-bkSUFG.jYsZQx h4'));
  }

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

    // Content cell: keep every element child of the panel (moves nodes out of
    // the panel and into the cell). This preserves any block table a prior
    // parser (e.g. cards-solution) already created inside the panel.
    const contentCell = Array.from(panel.children);

    cells.push([label, contentCell.length ? contentCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-plans', cells });
  element.replaceWith(block);
}
