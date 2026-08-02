import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment (localhost /content first, then DA/EDS root)
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const candidates = [];
  if (footerMeta) candidates.push(footerPath);
  candidates.push('/content/footer', '/footer');

  let fragment = null;
  for (let i = 0; i < candidates.length && !fragment; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const candidate = await loadFragment(candidates[i]);
    if (candidate && candidate.firstElementChild) fragment = candidate;
  }
  if (!fragment) return;

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Tag the three sections: [0] nav columns, [1] legal links, [2] copyright
  const sections = footer.querySelectorAll(':scope > div');
  const classes = ['footer-columns', 'footer-legal', 'footer-copyright'];
  classes.forEach((c, i) => {
    if (sections[i]) sections[i].classList.add(c);
  });

  block.append(footer);
}
