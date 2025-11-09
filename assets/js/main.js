// Consolidated main.js - menu, animations, placements modal, contact prefill and WhatsApp redirect
// Utilities
function qs(selector, scope) { return (scope || document).querySelector(selector); }
function qsa(selector, scope) { return Array.from((scope || document).querySelectorAll(selector)); }

(function () {
    'use strict';

    const WHATSAPP_NUMBER = '242067458011'; // international format without + or dashes

    // Menu toggle
    function initMenu() {
        const menuToggle = qs('.menu-toggle');
        const navUl = qs('nav ul');
        if (menuToggle && navUl) {
            menuToggle.addEventListener('click', () => {
                navUl.classList.toggle('active');
                // prevent background scroll when menu is open
                document.body.classList.toggle('menu-open');
            });
        }
    }

    // Inject a mobile "Accueil" button into the header on non-home pages
    function initHomeButton() {
        document.addEventListener('DOMContentLoaded', function () {
            try {
                const path = (window.location.pathname || '').split('/').pop();
                // treat index.html and empty as home
                if (!path || path.toLowerCase() === 'index.html') return;
                const headerContainer = qs('.header-container');
                if (!headerContainer) return;
                if (qs('.home-btn', headerContainer)) return; // already present
                const a = document.createElement('a');
                a.href = 'index.html';
                a.className = 'home-btn';
                a.textContent = 'Accueil';
                // insert before nav so it appears between logo and menu-toggle on mobile
                const menuToggleEl = qs('.menu-toggle', headerContainer);
                const nav = qs('nav', headerContainer);
                // prefer inserting before the menu toggle so the home button appears next to the logo
                if (menuToggleEl) headerContainer.insertBefore(a, menuToggleEl);
                else if (nav) headerContainer.insertBefore(a, nav);
                else headerContainer.appendChild(a);
            } catch (err) {
                console.warn('initHomeButton error', err);
            }
        });
    }

    // Smooth anchors (only for same-page anchors)
    function initSmoothAnchors() {
        qsa('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (!href || href === '#') return;
                const target = document.querySelector(href);
                if (!target) return; // allow normal navigation if element not on page
                e.preventDefault();
                const offset = Math.max(0, target.offsetTop - 80);
                window.scrollTo({ top: offset, behavior: 'smooth' });
                const navUl = qs('nav ul'); if (navUl) navUl.classList.remove('active');
            });
        });
    }

    // Simple animate on scroll for elements
    function initScrollAnimations() {
    const els = qsa('.service-card, .pricing-card, .metric-card, .testimonial-card, .about-image, .about-content, .step-card, .approach-steps');
        // ensure base styles
        els.forEach(el => {
            if (!el.style.opacity) el.style.opacity = 0;
            if (!el.style.transform) el.style.transform = 'translateY(50px)';
            if (!el.style.transition) el.style.transition = 'all 0.8s ease';
            // ensure no lingering transitionDelay unless explicitly set later
            if (!el.style.transitionDelay) el.style.transitionDelay = '0s';
        });

        // cache step-cards for staggered entrance
        const stepCards = qsa('.step-card');

        function animate() {
            els.forEach(el => {
                // skip if already animated
                if (el.dataset.animated === 'true') return;
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight / 1.2) {
                    // stagger only for step-cards
                    if (el.classList.contains('step-card')) {
                        const idx = stepCards.indexOf(el);
                        const delay = Math.max(0, idx) * 120; // ms
                        el.style.transitionDelay = delay + 'ms';
                    } else {
                        el.style.transitionDelay = '0s';
                    }
                    // trigger animation
                    el.style.opacity = 1;
                    el.style.transform = 'translateY(0)';
                    el.dataset.animated = 'true';
                }
            });
        }

        window.addEventListener('scroll', animate);
        window.addEventListener('load', animate);
        // also run on resize to handle orientation changes
        window.addEventListener('resize', animate);
        animate();
    }

    // Chart bars animation utility
    function initChartBars() {
        const bars = qsa('.chart-bar');
        bars.forEach(bar => {
            const stored = bar.getAttribute('data-h');
            if (!stored && bar.style.height) bar.setAttribute('data-h', bar.style.height);
            // collapse
            if (!bar.getAttribute('data-collapse-set')) {
                bar.style.height = '5%';
                bar.setAttribute('data-collapse-set', 'true');
            }
        });
        function animate() {
            bars.forEach(bar => {
                const rect = bar.getBoundingClientRect();
                if (rect.top < window.innerHeight / 1.3) {
                    const h = bar.getAttribute('data-h') || bar.style.height;
                    if (h) bar.style.height = h;
                }
            });
        }
        window.addEventListener('scroll', animate);
        window.addEventListener('load', animate);
        animate();
    }

    // Modal for placement cards
    function initPlacementModal() {
        // build modal
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true">
                <button class="modal-close" aria-label="Fermer">&times;</button>
                <div class="modal-header">
                    <div class="modal-logo-wrap">
                        <img src="" alt="" class="modal-logo">
                        <div class="modal-logo-fallback" aria-hidden="true"></div>
                    </div>
                    <div class="modal-header-text">
                        <div class="modal-title"></div>
                        <div class="modal-sub"></div>
                    </div>
                </div>
                <div class="modal-body"></div>
                <div class="modal-actions"><a class="btn modal-cta" href="#">Démarrer ce projet</a></div>
            </div>`;
        document.body.appendChild(overlay);

    const modalLogo = qs('.modal-logo', overlay);
    const modalLogoFallback = qs('.modal-logo-fallback', overlay);
        const modalTitle = qs('.modal-title', overlay);
        const modalSub = qs('.modal-sub', overlay);
    const modalBody = qs('.modal-body', overlay);
    const modalCta = qs('.modal-cta', overlay);
    const modalActions = qs('.modal-actions', overlay);
    const modalClose = qs('.modal-close', overlay);

        function open(data) {
            modalLogoFallback.style.display = 'none';
            modalLogo.style.display = 'none';
            modalLogo.alt = data.title || '';
            // For case studies we prefer a fictive icon instead of a real logo
            if (data.hideCta) {
                // force icon fallback (no external logo)
                modalLogo.src = '';
                modalLogo.style.display = 'none';
                modalLogoFallback.innerHTML = '<i class="fas fa-briefcase" aria-hidden="true"></i>';
                modalLogoFallback.style.display = 'flex';
            } else if (data.logo) {
                modalLogo.src = data.logo;
                // handle image load/fail
                modalLogo.onload = function () {
                    modalLogo.style.display = 'block';
                    modalLogoFallback.style.display = 'none';
                };
                modalLogo.onerror = function () {
                    modalLogo.style.display = 'none';
                    const initial = (data.title || 'S').trim().charAt(0).toUpperCase();
                    modalLogoFallback.textContent = initial;
                    modalLogoFallback.style.display = 'flex';
                };
            } else {
                // no logo - show fallback with initial
                modalLogo.src = '';
                const initial = (data.title || 'S').trim().charAt(0).toUpperCase();
                modalLogoFallback.textContent = initial;
                modalLogoFallback.style.display = 'flex';
            }
            modalTitle.textContent = data.title || '';
            modalSub.textContent = data.sub || '';
            modalBody.innerHTML = data.body || '';
            const serviceParam = encodeURIComponent(data.title || 'Service');
            modalCta.href = 'contact.html?service=' + serviceParam;
            // hide CTA for specific cards (case studies) when requested
            if (data.hideCta) {
                if (modalActions) modalActions.style.display = 'none';
            } else {
                if (modalActions) modalActions.style.display = '';
            }
            overlay.classList.add('active');
            modalClose.focus();
        }

        function close() {
            overlay.classList.remove('active');
        }

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay || e.target === modalClose) close();
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

        // wire cards
        const cards = qsa('[data-placement]');
        cards.forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', function () {
                const data = {
                    title: card.getAttribute('data-title') || (qs('.service-title', card) && qs('.service-title', card).textContent) || 'Service',
                    sub: card.getAttribute('data-sub') || '',
                    body: card.getAttribute('data-body') || (qs('.service-desc', card) && qs('.service-desc', card).innerHTML) || '',
                    logo: card.getAttribute('data-logo') || (qs('img', card) && qs('img', card).src) || '',
                    hideCta: (card.getAttribute('data-hide-cta') === 'true')
                };
                open(data);
            });
        });
    }

    // Prefill contact form from query string (service param)
    function prefillContactFromQuery() {
        try {
            const params = new URLSearchParams(window.location.search);
            const service = params.get('service');
            if (service) {
                const serviceSelect = qs('#service');
                if (serviceSelect) {
                    Array.from(serviceSelect.options).forEach(opt => {
                        if (opt.text && opt.text.includes(service)) opt.selected = true;
                    });
                }
                const form = qs('#contact-form');
                if (form) {
                    const note = document.createElement('div');
                    note.className = 'prefill-note';
                    note.innerHTML = `<i class="fas fa-info-circle"></i> Vous avez choisi: ${decodeURIComponent(service)}`;
                    form.insertBefore(note, form.firstChild);
                }
            }
        } catch (err) {
            console.warn('Prefill error', err);
        }
    }

    // Contact form -> WhatsApp redirection
    function initContactForm() {
        const form = qs('#contact-form');
        if (!form) return;

        function buildMessage() {
            const name = (qs('#name') && qs('#name').value) || 'Non renseigné';
            const service = (qs('#service') && qs('#service').value) || 'Non précisé';
            const budget = (qs('#budget') && qs('#budget').value) || 'Non renseigné';
            const currency = (qs('#currency') && qs('#currency').value) || '';
            const forfait = (qs('#forfait') && qs('#forfait').value) || '';
            const details = (qs('#details') && qs('#details').value) || 'Aucun détail spécifique fourni';

            const message = `🚀 *Nouvelle demande de service*\n\n👋 Bonjour Aroman, je suis *${name}* !\n\n💼 *Détails de ma demande:*\n▪️ Service souhaité: *${service}*\n▪️ Budget mensuel: *${budget} ${currency}*\n▪️ Forfait choisi: *${forfait}*\n\n📝 *Informations complémentaires:*\n${details}\n\n_Envoyé depuis aromanemetshu.com_`;
            return message;
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const message = buildMessage();
            const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
            window.location.href = url;
        });

        // ensure budget can't be negative (defensive)
        const budgetInput = qs('#budget');
        if (budgetInput) budgetInput.addEventListener('input', function () { if (this.value < 0) this.value = 0; });

        // provide a fallback for buttons that have .btn-whatsapp (in case someone added an anchor)
        qsa('.btn-whatsapp').forEach(btn => {
            btn.addEventListener('click', function (e) {
                // if it's a <button> inside the form, let submit handler handle it
                if (this.tagName.toLowerCase() === 'a') {
                    // link - go to contact form or start flow
                    const href = this.getAttribute('href');
                    if (href && href.startsWith('https://wa.me')) return; // already a wa link
                    // else let default
                }
            });
        });
    }

    // Chatbot toggles
    function initChatbot() {
        const toggle = qs('#chatbotToggle');
        const windowEl = qs('#chatbotWindow');
        const close = qs('#chatbotClose');
        if (!toggle || !windowEl) return;
        toggle.addEventListener('click', () => windowEl.classList.toggle('active'));
        if (close) close.addEventListener('click', () => windowEl.classList.remove('active'));
        document.addEventListener('click', (ev) => {
            if (!windowEl) return;
            const inside = windowEl.contains(ev.target) || toggle.contains(ev.target);
            if (!inside && windowEl.classList.contains('active')) windowEl.classList.remove('active');
        });
    }

    // Init everything on DOM ready
    document.addEventListener('DOMContentLoaded', function () {
        initMenu();
        initSmoothAnchors();
        initScrollAnimations();
        initChartBars();
        initPlacementModal();
        prefillContactFromQuery();
        initContactForm();
        initFAQ();
        initNewsletter();
        initChatbot();
        initHomeButton();
        // init ROAS calculator if present
        if (typeof initRoasCalculator === 'function') initRoasCalculator();
        initPrint();
    });

})();

// FAQ and Newsletter utilities (declared after IIFE to keep file organized)
function initFAQ() {
    // run immediately or on DOMContentLoaded if the document is still loading
    const run = function () {
        const items = Array.from(document.querySelectorAll('.faq-item'));
        if (!items.length) return;
        items.forEach(item => {
            const q = item.querySelector('.faq-question');
            const a = item.querySelector('.faq-answer');
            if (!q || !a) return;
            // accessibility
            q.setAttribute('role', 'button');
            q.setAttribute('tabindex', '0');
            q.setAttribute('aria-expanded', 'false');
            a.setAttribute('aria-hidden', 'true');
            // ensure collapsed
            a.style.maxHeight = '0px';

            function toggle() {
                const expanded = q.getAttribute('aria-expanded') === 'true';
                if (expanded) {
                    item.classList.remove('active');
                    q.setAttribute('aria-expanded', 'false');
                    a.setAttribute('aria-hidden', 'true');
                    a.style.maxHeight = '0px';
                } else {
                    item.classList.add('active');
                    q.setAttribute('aria-expanded', 'true');
                    a.setAttribute('aria-hidden', 'false');
                    // set exact height for smooth transition
                    a.style.maxHeight = a.scrollHeight + 'px';
                }
            }

            q.addEventListener('click', toggle);
            q.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
            });
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
}

function initNewsletter() {
    document.addEventListener('DOMContentLoaded', function () {
        const form = document.getElementById('newsletter-form');
        if (!form) return;
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = (this.querySelector('input[type="email"]') || {}).value || '';
            if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                alert('Veuillez entrer une adresse email valide.');
                return;
            }
            // TODO: wire to backend or newsletter service
            alert('Merci pour votre inscription ! Vous recevrez bientôt nos actualités.');
            this.reset();
        });
    });
}

// ROAS / ROI Calculator
function initRoasCalculator() {
    const run = function () {
        const form = document.getElementById('roas-form');
        if (!form) return;

        const presets = {
            'default': { aov: 50, cpa: 30 },
            'ecom': { aov: 60, cpa: 25 },
            'saas': { aov: 800, cpa: 120 },
            'local': { aov: 150, cpa: 40 },
            'apps': { aov: 10, cpa: 2 },
            'retail': { aov: 45, cpa: 20 }
        };

        const industry = qs('#industry', form);
        const spendEl = qs('#spend', form);
        const aovEl = qs('#aov', form);
        const cpaEl = qs('#cpa', form);
        const btn = qs('#calculate-roas', form);
        const contactBtn = qs('#contact-from-roas', form);

        const results = qs('#roas-results');
        const resConv = qs('#res-conv');
        const resRev = qs('#res-rev');
        const resRoas = qs('#res-roas');
        const resProfit = qs('#res-profit');
        const summary = qs('#result-summary');

        function formatCurrency(n) {
            try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n); }
            catch (e) { return '$' + Math.round(n); }
        }

        function applyPreset(key) {
            const p = presets[key] || presets['default'];
            if (aovEl && !aovEl.value) aovEl.placeholder = p.aov;
            if (cpaEl && !cpaEl.value) cpaEl.placeholder = p.cpa;
        }

        // guard critical elements and add logs for debugging
        if (!industry || !spendEl || !btn) {
            console.warn('ROAS calculator: missing elements', { industry: !!industry, spend: !!spendEl, button: !!btn });
            return;
        }

        // set initial
        applyPreset(industry.value || 'default');

        industry.addEventListener('change', function () { applyPreset(this.value); });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('ROAS calculate clicked');
            const spend = parseFloat(spendEl.value) || 0;
            const aov = parseFloat(aovEl.value) || parseFloat(aovEl.placeholder) || presets['default'].aov;
            const cpa = parseFloat(cpaEl.value) || parseFloat(cpaEl.placeholder) || presets['default'].cpa;

            if (!spend || spend <= 0) {
                alert('Veuillez entrer un budget publicitaire valide.');
                return;
            }

            const conversions = Math.floor(spend / cpa);
            const revenue = conversions * aov;
            const roas = spend > 0 ? (revenue / spend) : 0;
            const profit = revenue - spend;

            if (results) results.hidden = false;
            if (resConv) resConv.textContent = conversions.toString();
            if (resRev) resRev.textContent = formatCurrency(revenue);
            if (resRoas) resRoas.textContent = roas.toFixed(2) + 'x';
            if (resProfit) resProfit.textContent = formatCurrency(profit);
            if (summary) summary.textContent = `Basé sur le benchmark (${industry.options[industry.selectedIndex].text}): AOV ≈ ${aov} | CPA ≈ ${cpa}`;
        });

        if (contactBtn) contactBtn.addEventListener('click', function () {
            // open contact page with prefilled service param
            window.location.href = 'contact.html?service=Audit%20&%20Projection%20ROAS';
        });
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
}

function initPrint() {
    document.addEventListener('DOMContentLoaded', function () {
        const btn = document.getElementById('print-about');
        if (!btn) return;
        btn.addEventListener('click', function () {
            // small delay to allow visual change if needed
            window.print();
        });
    });
}
