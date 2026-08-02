import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

// Inline tool icons extracted from the source header (24x24, #242328).
const TOOL_ICONS = {
  search: 'M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5M2.25 10.5a8.25 8.25 0 1 1 16.5 0 8.25 8.25 0 0 1-16.5 0',
  personal: 'M8.25 8a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0M12 2.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5m-5 11.5a3.75 3.75 0 1 0 0 7.5h10a3.75 3.75 0 1 0 0-7.5zM4.75 18A2.25 2.25 0 0 1 7 15.75h10a2.25 2.25 0 0 1 0 4.5H7A2.25 2.25 0 0 1 4.75 18',
  cart: 'M1.25 4A.75.75 0 0 1 2 3.25h2.594a1.75 1.75 0 0 1 1.685 1.28l.405 1.447H20c.966 0 1.75.784 1.75 1.75v3.065a1.75 1.75 0 0 1-1.457 1.725l-11.248 1.91.179.64a.25.25 0 0 0 .24.183H21a.75.75 0 0 1 0 1.5H9.465a1.75 1.75 0 0 1-1.686-1.28L4.835 4.934a.25.25 0 0 0-.24-.183H1.999A.75.75 0 0 1 1.25 4m7.39 8.974 11.402-1.936a.25.25 0 0 0 .208-.246V7.727a.25.25 0 0 0-.25-.25H7.103zM11 19.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m8.5 1.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
};

function iconSvg(name) {
  const path = TOOL_ICONS[name];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#242328" fill-rule="evenodd" d="${path}"/></svg>`;
}

/** Close all open top-level megamenu panels. */
function closeAllPanels(navSections) {
  navSections.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((li) => {
    li.setAttribute('aria-expanded', 'false');
  });
}

function closeOnEscape(nav, navSections) {
  return (e) => {
    if (e.code !== 'Escape') return;
    if (isDesktop.matches) {
      closeAllPanels(navSections);
    } else if (nav.getAttribute('aria-expanded') === 'true') {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  };
}

/**
 * Toggles the mobile menu drawer.
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  if (expanded || isDesktop.matches) closeAllPanels(navSections);
}

/**
 * Wire up a top-level nav item that has a submenu (megamenu).
 * Desktop: hover opens; click on the trigger toggles. Mobile: tap toggles accordion.
 */
function decorateNavDrop(li, navSections) {
  li.classList.add('nav-drop');
  li.setAttribute('aria-expanded', 'false');

  // The trigger is the first anchor; add a chevron button for mobile expand.
  const trigger = li.querySelector(':scope > a');
  const chevron = document.createElement('button');
  chevron.className = 'nav-drop-toggle';
  chevron.type = 'button';
  chevron.setAttribute('aria-label', `Toggle ${trigger ? trigger.textContent.trim() : ''} submenu`);
  li.insertBefore(chevron, li.querySelector(':scope > ul'));

  // Desktop hover
  li.addEventListener('mouseenter', () => {
    if (!isDesktop.matches) return;
    closeAllPanels(navSections);
    li.setAttribute('aria-expanded', 'true');
  });
  li.addEventListener('mouseleave', () => {
    if (!isDesktop.matches) return;
    li.setAttribute('aria-expanded', 'false');
  });

  // Mobile accordion: chevron toggles, text navigates.
  chevron.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const open = li.getAttribute('aria-expanded') === 'true';
    if (!isDesktop.matches) {
      // close siblings at same level
      const parentList = li.parentElement;
      [...parentList.children].forEach((sib) => {
        if (sib !== li) sib.setAttribute('aria-expanded', 'false');
      });
    }
    li.setAttribute('aria-expanded', open ? 'false' : 'true');
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment (localhost /content first, then DA/EDS root)
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const candidates = [];
  if (navMeta) candidates.push(navPath);
  candidates.push('/content/nav', '/nav');
  let fragment = null;
  let resolvedNavPath = candidates[0];
  for (let i = 0; i < candidates.length && !fragment; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const candidate = await loadFragment(candidates[i]);
    if (candidate && candidate.firstElementChild) {
      fragment = candidate;
      resolvedNavPath = candidates[i];
    }
  }
  if (!fragment) return;

  // Resolve relative image sources (e.g. images/logo.png) against the nav
  // fragment's directory, not the current page URL.
  const navBase = new URL(`${resolvedNavPath}`, window.location.href);
  fragment.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('./media_')) {
      img.src = new URL(src, navBase).href;
    }
  });

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Sections: [0] utility bar, [1] brand/logo, [2] main nav
  const classes = ['utility', 'brand', 'sections'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Brand: strip button decoration from the logo link
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a.button, .button');
    if (brandLink) {
      brandLink.className = '';
      const container = brandLink.closest('.button-container');
      if (container) container.className = '';
    }
  }

  // Main nav sections: wire megamenus. EDS wraps default content in
  // .default-content-wrapper, so the top-level <ul> lives one level deeper.
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    const topList = navSections.querySelector('ul');
    if (topList) {
      topList.querySelectorAll(':scope > li').forEach((li) => {
        if (li.querySelector(':scope > ul')) decorateNavDrop(li, navSections);
      });
    }
  }

  // Tools row: search / account / cart icon buttons (built in JS per contract)
  const navTools = document.createElement('div');
  navTools.className = 'nav-tools';
  ['search', 'personal', 'cart'].forEach((name) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-tool';
    btn.setAttribute('aria-label', name === 'personal' ? 'My account' : name);
    btn.innerHTML = iconSvg(name);
    navTools.append(btn);
  });

  // Hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));

  // Tools + hamburger are direct nav children so the grid can place them
  nav.append(navTools);
  nav.append(hamburger);

  nav.setAttribute('aria-expanded', 'false');
  window.addEventListener('keydown', closeOnEscape(nav, navSections));

  // Reset menu state when crossing the breakpoint
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, navSections, isDesktop.matches);
    closeAllPanels(navSections);
    document.body.style.overflowY = '';
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
