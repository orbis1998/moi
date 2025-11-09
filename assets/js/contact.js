// Structure des forfaits par service
const FORFAITS_PAR_SERVICE = {
    "Meta Ads": {
        "Essential": {
            prix: "50$/semaine",
            description: "Gestion basique des campagnes"
        },
        "Business": {
            prix: "85$/semaine",
            description: "Gestion avancée + Optimisation"
        },
        "Premium": {
            prix: "125$/semaine",
            description: "Stratégie complète + Support prioritaire"
        },
        "Entreprise": {
            prix: "Sur devis",
            description: "Solution sur mesure"
        }
    },
    "LinkedIn Ads": {
        "Essential": {
            prix: "55$/semaine",
            description: "Gestion basique des campagnes B2B"
        },
        "Business": {
            prix: "95$/semaine",
            description: "Gestion avancée + Lead Generation"
        },
        "Premium": {
            prix: "145$/semaine",
            description: "Stratégie complète + Automation"
        },
        "Entreprise": {
            prix: "Sur devis",
            description: "Solution sur mesure"
        }
    },
    "X Ads": {
        "Essential": {
            prix: "55$/semaine",
            description: "Gestion basique des campagnes"
        },
        "Business": {
            prix: "95$/semaine",
            description: "Gestion avancée + Engagement"
        },
        "Premium": {
            prix: "145$/semaine",
            description: "Stratégie complète + Analyse"
        },
        "Entreprise": {
            prix: "Sur devis",
            description: "Solution sur mesure"
        }
    },
    "TikTok": {
        "Essential": {
            prix: "65$/semaine",
            description: "Gestion basique des campagnes"
        },
        "Business": {
            prix: "105$/semaine",
            description: "Gestion avancée + Créatifs"
        },
        "Premium": {
            prix: "205$/semaine",
            description: "Stratégie complète + Contenu viral"
        },
        "Entreprise": {
            prix: "Sur devis",
            description: "Solution sur mesure"
        }
    },
    "Snapchat": {
        "Essential": {
            prix: "65$/semaine",
            description: "Gestion basique des campagnes"
        },
        "Business": {
            prix: "105$/semaine",
            description: "Gestion avancée + AR Lenses"
        },
        "Premium": {
            prix: "205$/semaine",
            description: "Stratégie complète + Innovation"
        },
        "Entreprise": {
            prix: "Sur devis",
            description: "Solution sur mesure"
        }
    },
    "Google Ads": {
        "Essential": {
            prix: "75$/semaine",
            description: "Gestion basique Search & Display"
        },
        "Business": {
            prix: "115$/semaine",
            description: "Gestion avancée + Shopping"
        },
        "Premium": {
            prix: "185$/semaine",
            description: "Stratégie complète + YouTube"
        },
        "Entreprise": {
            prix: "Sur devis",
            description: "Solution sur mesure"
        }
    },
    "TV": {
        "Essential": {
            prix: "95$/semaine",
            description: "Gestion basique des spots"
        },
        "Business": {
            prix: "155$/semaine",
            description: "Gestion avancée + Production"
        },
        "Premium": {
            prix: "245$/semaine",
            description: "Stratégie complète + Multi-canal"
        },
        "Entreprise": {
            prix: "Sur devis",
            description: "Solution sur mesure"
        }
    },
    "Radio": {
        "Essential": {
            prix: "65$/semaine",
            description: "Gestion basique des spots"
        },
        "Business": {
            prix: "105$/semaine",
            description: "Gestion avancée + Production"
        },
        "Premium": {
            prix: "185$/semaine",
            description: "Stratégie complète + Multi-station"
        },
        "Entreprise": {
            prix: "Sur devis",
            description: "Solution sur mesure"
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les éléments du formulaire
    const contactForm = document.getElementById('contact-form');
    const serviceSelect = document.getElementById('service');
    const forfaitSelect = document.getElementById('forfait');

    if (!serviceSelect || !forfaitSelect || !contactForm) return;

    // Vérifier si on arrive depuis la page services avec un service présélectionné
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedService = urlParams.get('service');
    
    if (preselectedService && serviceSelect) {
        // Trouver et sélectionner l'option correspondante
        Array.from(serviceSelect.options).forEach(option => {
            if (option.text.includes(preselectedService)) {
                option.selected = true;
                // Déclencher l'événement change pour mettre à jour les forfaits
                serviceSelect.dispatchEvent(new Event('change'));
            }
        });
        
        // Ajouter une note de présélection
        const note = document.createElement('div');
        note.className = 'prefill-note';
        note.innerHTML = `<i class="fas fa-info-circle"></i> Service présélectionné: ${preselectedService}`;
        contactForm.insertBefore(note, contactForm.firstChild);
    }

    // Mettre à jour les forfaits en fonction du service sélectionné
    serviceSelect.addEventListener('change', function() {
        const service = this.value;
        const forfaits = FORFAITS_PAR_SERVICE[service];

        // Vider le select des forfaits
        forfaitSelect.innerHTML = '<option value="">Sélectionnez un forfait</option>';

        if (forfaits) {
            // Ajouter les nouveaux forfaits
            Object.entries(forfaits).forEach(([nom, details]) => {
                const option = document.createElement('option');
                option.value = nom;
                option.textContent = `${nom} - ${details.prix} (${details.description})`;
                forfaitSelect.appendChild(option);
            });
            forfaitSelect.parentElement.style.display = 'block';
        } else {
            forfaitSelect.parentElement.style.display = 'none';
        }
    });

    // Gestionnaire de soumission du formulaire
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Récupérer les valeurs du formulaire
        const name = document.getElementById('name').value;
        const service = serviceSelect.value;
        const forfait = forfaitSelect.value;
        const budget = document.getElementById('budget').value;
        const currency = document.getElementById('currency').value;
        const details = document.getElementById('details').value;

        // Formatage du message WhatsApp
        const message = `🚀 *Nouvelle demande de service*\n\n` +
            `👋 Bonjour Aroman, je suis *${name}* !\n\n` +
            `💼 *Détails de ma demande:*\n` +
            `▪️ Service souhaité: *${service}*\n` +
            `▪️ Forfait choisi: *${forfait}*\n` +
            `▪️ Budget mensuel: *${budget} ${currency}*\n\n` +
            `📝 *Informations complémentaires:*\n` +
            `${details || "Aucun détail spécifique fourni"}\n\n` +
            `_Envoyé depuis aromanemetshu.com_`;

        // Redirection vers WhatsApp
        const whatsappUrl = `https://wa.me/242067458011?text=${encodeURIComponent(message)}`;
        window.location.href = whatsappUrl;
    });

    // Validation du budget (empêcher les valeurs négatives)
    const budgetInput = document.getElementById('budget');
    if (budgetInput) {
        budgetInput.addEventListener('input', function() {
            if (this.value < 0) this.value = 0;
        });
    }
});