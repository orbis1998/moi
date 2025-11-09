// forfaits.js
// Gère le pop-up WhatsApp et la redirection avec le nom du forfait

const WHATSAPP_NUMBER = '242067458011';
let selectedForfait = '';

document.addEventListener('DOMContentLoaded', function () {
    // Ouvre le pop-up au clic sur un bouton forfait
    const popupEl = document.getElementById('forfait-popup');
    if (!popupEl) return;

    document.querySelectorAll('.btn-forfait').forEach(btn => {
        btn.addEventListener('click', function () {
            selectedForfait = this.getAttribute('data-forfait') || '';
            // show the popup by removing hidden
            popupEl.hidden = false;
        });
    });

    // Ferme le pop-up via le bouton fermer, clic sur overlay ou Escape
    const popupClose = popupEl.querySelector('.popup-close');
    if (popupClose) popupClose.addEventListener('click', function () { popupEl.hidden = true; });

    // close when clicking outside the content
    popupEl.addEventListener('click', function (e) {
        if (e.target === popupEl) popupEl.hidden = true;
    });

    // close on Esc
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !popupEl.hidden) popupEl.hidden = true;
    });

    // Redirige vers WhatsApp avec le nom du forfait (if button exists)
    const goBtn = document.getElementById('go-whatsapp');
    if (goBtn) {
        goBtn.addEventListener('click', function () {
            const message = `Bonjour, je suis intéressé(e) par le forfait : ${selectedForfait}`;
            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        });
    }
});
