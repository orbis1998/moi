# WhatsApp Button Integration

Add these two pieces to each HTML file:

1. Add this in the <head> section, after your other CSS links:
```html
<link rel="stylesheet" href="assets/css/whatsapp.css">
```

2. Add this just before the closing </body> tag:
```html
<!-- Floating WhatsApp Button -->
<a href="https://wa.me/242067458011" class="whatsapp-float" target="_blank" rel="noopener" aria-label="Contactez-moi sur WhatsApp">
    <i class="fab fa-whatsapp"></i>
</a>
```

Pages to update:
- index.html
- about.html
- services.html
- work.html
- contact.html

The button will appear fixed in the bottom-right corner of every page, just above the chatbot. It uses your WhatsApp number (242067458011) and has a smooth hover effect.