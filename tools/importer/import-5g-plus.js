/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS - one per block used by the 5g-plus template
import heroPromoParser from './parsers/hero-promo.js';
import cardsBenefitParser from './parsers/cards-benefit.js';
import tabsPlansParser from './parsers/tabs-plans.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import cardsStepParser from './parsers/cards-step.js';
import cardsPricingParser from './parsers/cards-pricing.js';
import accordionFaqParser from './parsers/accordion-faq.js';

// TRANSFORMER IMPORTS - all files in tools/importer/transformers/
import singtelCleanupTransformer from './transformers/singtel-cleanup.js';
import singtelSectionsTransformer from './transformers/singtel-sections.js';

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json (template "5g-plus")
const PAGE_TEMPLATE = {
  name: '5g-plus',
  description:
    "Singtel 5G+ mobile product marketing page: hero promo banner, intro/benefit tiles, tabbed plan comparison, Enhanced (teal) and Priority (navy) feature sections, plan-category CTA, 'huge PLUS' benefit tiles, how-to step cards, Priority Pass pricing cards, and FAQ accordion.",
  urls: [
    'https://www.singtel.com/personal/products-services/mobile/5g-plus',
  ],
  blocks: [
    { name: 'hero-promo', instances: ['.sc-lbJcrp.bQGNRU'] },
    {
      name: 'cards-benefit',
      instances: [
        '.sc-gEvEer.iEmrWN:has(> .sc-eqUAAy.liiqJP > .sc-cKXybt.sc-lgjHQU img[alt*="Upsize"])',
        '.sc-cbPlza.labNNc .sc-gEvEer.iEmrWN:has(> div > .sc-cKXybt.sc-lgjHQU)',
      ],
    },
    {
      name: 'tabs-plans',
      instances: ['div:has(> .sc-bkSUFG.jYsZQx):has(> #tabpanel-0):has(> #tabpanel-1)'],
    },
    {
      name: 'cards-feature',
      instances: [
        '.sc-cbPlza.hidDuG .sc-gEvEer.iEmrWN:has(> div > .sc-cKXybt.sc-fatcLD)',
        '.sc-cbPlza.bTWdQO .sc-gEvEer.iEmrWN:has(> div > .sc-cKXybt.sc-fatcLD)',
      ],
    },
    {
      name: 'cards-step',
      instances: ['.sc-cbPlza.imWEiG .sc-gEvEer.iEmrWN:has(> .sc-eqUAAy.kxvbvX)'],
    },
    { name: 'cards-pricing', instances: ['.sc-cbPlza.gdvwMg .sc-dAEZTx.LGnnw'] },
    { name: 'accordion-faq', instances: ['.sc-eqUAAy.eLrnuL:has(section.sc-faUjhM)'] },
  ],
  sections: [
    {
      id: 's1', name: 'Hero promo banner', selector: '.sc-lbJcrp.bQGNRU', style: null, blocks: ['hero-promo'], defaultContent: [],
    },
    {
      id: 's2', name: '5G+ intro / key benefits + plan comparison', selector: '.sc-feNupb.bubDsw', style: null, blocks: ['cards-benefit', 'tabs-plans'], defaultContent: ['p.sc-jlZhew'],
    },
    {
      id: 's3', name: '5G+ Enhanced benefits', selector: '.sc-epALIP.euohZm', style: 'teal', blocks: ['cards-feature'], defaultContent: [],
    },
    {
      id: 's4', name: '5G+ Priority benefits', selector: '.sc-epALIP.euohZm', style: 'navy', blocks: ['cards-feature'], defaultContent: [],
    },
    {
      id: 's5', name: 'Plan category selector CTA', selector: '.sc-jXbUNg.buzYkj', style: 'light-grey', blocks: [], defaultContent: ['h2.sc-jXbUNg'],
    },
    {
      id: 's6', name: 'Now, 5G comes with a huge PLUS', selector: '.sc-gZfzYS.kSRtco', style: 'light-grey', blocks: ['cards-benefit'], defaultContent: ['h2.sc-jXbUNg'],
    },
    {
      id: 's7', name: "Here's how to enjoy Singtel 5G+", selector: '.sc-iNIeMn.cZwMrl', style: null, blocks: ['cards-step'], defaultContent: ['h2.sc-jXbUNg'],
    },
    {
      id: 's8', name: '5G+ Priority Pass pricing', selector: '.sc-hsUFQk.ciOAtj', style: 'navy', blocks: ['cards-pricing'], defaultContent: ['h2.sc-jXbUNg.fdGsdY'],
    },
    {
      id: 's9', name: 'Frequently Asked Questions', selector: '#accordion-content-undefined', style: null, blocks: ['accordion-faq'], defaultContent: ['h2.sc-jXbUNg'],
    },
  ],
};

// PARSER REGISTRY - map block name to parser function
const parsers = {
  'hero-promo': heroPromoParser,
  'cards-benefit': cardsBenefitParser,
  'tabs-plans': tabsPlansParser,
  'cards-feature': cardsFeatureParser,
  'cards-step': cardsStepParser,
  'cards-pricing': cardsPricingParser,
  'accordion-faq': accordionFaqParser,
};

// TRANSFORMER REGISTRY - cleanup runs first; sections runs after cleanup.
// The section transformer only acts when the template declares 2+ sections.
const transformers = [
  singtelCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1
    ? [singtelSectionsTransformer]
    : []),
];

/**
 * Execute all page transformers for a specific hook.
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform (typically document.body)
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  // Pass PAGE_TEMPLATE so section transformer can read section order/style.
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements;
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.error(`Invalid selector for block "${blockDef.name}": ${selector}`, e);
        return;
      }
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  /**
   * Main transformation function (Helix Importer 'one input / multiple outputs').
   * @param {Object} payload - { document, url, html, params }
   */
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform: initial cleanup (removes header/nav chrome that reuses
    //    the same hashed class names as content sections).
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover block instances using the embedded template selectors.
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using its registered parser.
    //    Skip elements already detached from the DOM by an earlier parser.
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform: final cleanup + section breaks / section metadata.
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules.
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized document path (localized path, no extension/trailing slash).
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
