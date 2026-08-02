/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Singtel site-wide cleanup.
 *
 * All selectors below were verified against migration-work/cleaned.html for the
 * Singtel 5G+ page. This site is a styled-components (React) app that REUSES
 * hashed class names across the header/nav and the page content. Several of the
 * per-section hashed selectors in page-templates.json (e.g. `.sc-feNupb.bubDsw`,
 * `.sc-gZfzYS.kSRtco`, `.sc-iNIeMn.cZwMrl`, `.sc-hsUFQk.ciOAtj`) actually resolve
 * to header/nav chrome. Because block parsers run BETWEEN beforeTransform and
 * afterTransform using those same hashed selectors, the header and search widget
 * must be removed in `beforeTransform` so parsers never match nav chrome.
 *
 * Verified top-level structure under <body>:
 *   .sc-AHTeh.hiiwou      -> header / global nav + megamenu (line 2, unique)
 *   .sc-grmefH.fRxSBT     -> search popup wrapper (line 493) / #popupsearch
 *   <div> ... .sc-fqkvVR.eVVIly wrappers -> authorable page content (lines 584-2044)
 *   .sc-41182dc4-1 / nav.sc-ezreuY -> breadcrumb (line 2045, unique)
 *   next-route-announcer  -> Next.js route announcer (line 2065)
 *   .sc-cGNDeh            -> footer (line 2067, unique)
 *   .ywa-10000 / iframe / #batBeacon640238781397 -> tracking pixels (lines 2152-2158)
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove global chrome that reuses the same hashed class names as content
    // sections. Must run before parsing so block parsers don't match nav chrome.
    WebImporter.DOMUtils.remove(element, [
      '.sc-AHTeh.hiiwou', // global header / nav + megamenu
      '#popupsearch', // search popup dialog
      '.sc-grmefH.fRxSBT', // search popup wrapper(s)
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global content and leftover tracking/markup.
    WebImporter.DOMUtils.remove(element, [
      'header', // safety: any semantic header if present
      'footer', // safety: any semantic footer if present
      '.sc-cGNDeh', // site footer (links + copyright)
      '.sc-41182dc4-1', // breadcrumb wrapper
      'nav.sc-ezreuY', // breadcrumb <nav> (safety)
      'next-route-announcer', // Next.js route announcer
      '.ywa-10000', // Yahoo analytics pixel
      '#batBeacon640238781397', // Bing tracking beacon
      'iframe', // DoubleClick tracking iframes
      'link',
      'noscript',
    ]);
  }
}
