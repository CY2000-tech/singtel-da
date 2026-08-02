/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS - one per block used by the sim-only template
import heroPromoParser from './parsers/hero-promo.js';
import cardsPlanParser from './parsers/cards-plan.js';
import cardsStepParser from './parsers/cards-step.js';
import cardsBenefitParser from './parsers/cards-benefit.js';
import cardsProductParser from './parsers/cards-product.js';
import accordionFaqParser from './parsers/accordion-faq.js';

// TRANSFORMER IMPORTS - all files in tools/importer/transformers/
import singtelCleanupTransformer from './transformers/singtel-cleanup.js';
import singtelSectionsTransformer from './transformers/singtel-sections.js';

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json (template "sim-only")
const PAGE_TEMPLATE = {
  name: 'sim-only',
  description:
    "Singtel SIM Only plans page: promo banner + hero heading, detailed plan pricing cards (5 plans with features/inclusions/promotions/price/CTA), 'shop smarter with AI' CTA band, 'more savings' 3-column benefit tiles, PayLater phone-shop product carousel, and FAQ accordion.",
  urls: [
    'https://www.singtel.com/personal/mobile/plans/sim-only',
  ],
  blocks: [
    {
      name: 'hero-promo',
      instances: [
        '[data-testid="Banner"]:not(:has(a))',
        '[data-testid="Banner"]:has(a[href*="sg60-simonly-seniors"])',
      ],
    },
    { name: 'cards-plan', instances: ['div.sc-iBBJcT.jyfDST'] },
    { name: 'cards-step', instances: ['[data-testid="ColumnControllerRow"]:has(> div a[href$="#featuredmobile"])'] },
    { name: 'cards-benefit', instances: ['[data-testid="ColumnControllerRow"]:has(> div a[href*=\'red-membership\'])'] },
    { name: 'cards-product', instances: ['[data-testid="ColumnControllerRow"]:has(a[href*=\'shop.singtel.com/phones\'])'] },
    { name: 'accordion-faq', instances: ['div:has(> div h2):has(> section [data-testid="titleId"])'] },
  ],
  sections: [
    {
      id: 's1', name: 'Promo hero banner - 10% OFF your monthly plan', selector: '[data-testid="Banner"]:not(:has(a))', style: null, blocks: ['hero-promo'], defaultContent: [],
    },
    {
      id: 's2', name: 'Hero heading / intro copy', selector: 'div:has(> [data-testid="TextWithIcon"] h1)', style: null, blocks: [], defaultContent: ['h1'],
    },
    {
      id: 's3', name: 'Plan pricing cards (5 plans)', selector: 'div.sc-iBBJcT.jyfDST', style: null, blocks: ['cards-plan'], defaultContent: [],
    },
    {
      id: 's4', name: 'Pick a plan with AI - pill CTA', selector: null, style: null, blocks: [], defaultContent: [],
    },
    {
      id: 's5', name: 'Shop smarter with AI - CTA band', selector: null, style: 'lavender', blocks: [], defaultContent: [],
    },
    {
      id: 's6', name: 'FREE 3 MONTHS - Seniors promo band', selector: '[data-testid="Banner"]:has(a[href*="sg60-simonly-seniors"])', style: null, blocks: ['hero-promo'], defaultContent: [],
    },
    {
      id: 's7', name: 'Get more with no-contract SIM Only plans heading', selector: null, style: null, blocks: [], defaultContent: [],
    },
    {
      id: 's8', name: 'Benefit tiles - More savings / flexibility / perks', selector: '[data-testid="ColumnControllerRow"]:has(> div a[href$="#featuredmobile"])', style: null, blocks: ['cards-step'], defaultContent: [],
    },
    {
      id: 's9', name: 'PayLater perks row - icon + text (3-col)', selector: "[data-testid=\"ColumnControllerRow\"]:has(> div a[href*='red-membership'])", style: null, blocks: ['cards-benefit'], defaultContent: [],
    },
    {
      id: 's10', name: 'PayLater phone-shop product carousel', selector: "[data-testid=\"ColumnControllerRow\"]:has(a[href*='shop.singtel.com/phones'])", style: null, blocks: ['cards-product'], defaultContent: [],
    },
    {
      id: 's11', name: 'FAQ accordion', selector: 'div:has(> div h2):has(> section [data-testid="titleId"])', style: null, blocks: ['accordion-faq'], defaultContent: [],
    },
  ],
};

// PARSER REGISTRY - map block name to parser function
const parsers = {
  'hero-promo': heroPromoParser,
  'cards-plan': cardsPlanParser,
  'cards-step': cardsStepParser,
  'cards-benefit': cardsBenefitParser,
  'cards-product': cardsProductParser,
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
