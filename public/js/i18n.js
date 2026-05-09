export const TRANSLATIONS = {
    es: {
        badge:          'Disponible ahora',
        h1_line1:       '¿HOY QUÉ',
        h1_line2:       'HACEMOS?',
        tagline:        'Deja el scroll infinito. La plataforma definitiva de <span class="font-bold text-brand-cyan">Social Discovery</span> para crear, unirte y vivir experiencias reales en segundos.',
        stars_label:    'Social Discovery App',
        radar_label:    'Radar',
        radar_text:     'Eventos a 500m',
        trending_label: 'Trending',
        trending_text:  'Fiesta Rooftop',
        join_label:     'Únete',
        join_text:      'Sin esperas',
        chat_label:     'Chat',
        chat_text:      'Coordina YA',
        phone_title:    'Trekking al Atardecer 🏔️',
        phone_friends:  '+3 amigos van',
        phone_btn:      'Solicitar Unirme',
        section_label:  'Todo en una App',
        section_h2:     'Lo que necesitas para <br><span class="text-brand-cyan">socializar en serio.</span>',
        section_desc:   'Diseñado para experiencias reales. Sin ghosting, sin perfiles falsos, solo gente queriendo hacer planes.',
        card1_title:    'Mapa en Vivo',
        card1_desc:     'Encuentra qué está pasando a tu alrededor ahora mismo. Desde un trekking espontáneo hasta una fiesta exclusiva. Si está en el mapa, está sucediendo.',
        card2_title:    'Seguridad Pro',
        card2_desc:     'Usuarios verificados y reportes activos. Tu seguridad es prioridad.',
        card2_badge:    'Verificado',
        card3_title:    'Chat Grupal',
        card3_desc:     'Coordina los detalles, comparte ubicación y fotos sin salir de la app.',
        card4_title:    'Cero Fricción',
        card4_desc:     "Olvídate de chats eternos que no llegan a nada. Toca 'Unirme', recibe la aprobación y llega al lugar. Simple.",
        footer_copy:    '© 2026 Yoinn App. Hecho para conectar.',
        footer_safety:  'Seguridad Infantil (CSAE)',
        footer_privacy: 'Privacidad',
        footer_terms:   'Términos y Condiciones',
    },
    en: {
        badge:          'Available now',
        h1_line1:       'WHAT ARE WE',
        h1_line2:       'DOING TODAY?',
        tagline:        'Ditch the endless scroll. The ultimate <span class="font-bold text-brand-cyan">Social Discovery</span> platform to create, join and live real experiences in seconds.',
        stars_label:    'Social Discovery App',
        radar_label:    'Radar',
        radar_text:     'Events within 500m',
        trending_label: 'Trending',
        trending_text:  'Rooftop Party',
        join_label:     'Join',
        join_text:      'No waiting',
        chat_label:     'Chat',
        chat_text:      'Coordinate NOW',
        phone_title:    'Sunset Hike 🏔️',
        phone_friends:  '+3 friends going',
        phone_btn:      'Request to Join',
        section_label:  'All in One App',
        section_h2:     'Everything you need to <br><span class="text-brand-cyan">socialize for real.</span>',
        section_desc:   'Designed for real experiences. No ghosting, no fake profiles, just people ready to make plans.',
        card1_title:    'Live Map',
        card1_desc:     "Find out what's happening around you right now. From a spontaneous hike to an exclusive party. If it's on the map, it's happening.",
        card2_title:    'Pro Safety',
        card2_desc:     'Verified users and active reports. Your safety is our priority.',
        card2_badge:    'Verified',
        card3_title:    'Group Chat',
        card3_desc:     'Coordinate details, share location and photos without leaving the app.',
        card4_title:    'Zero Friction',
        card4_desc:     "No more endless chats that go nowhere. Tap 'Join', get approval and show up. Simple.",
        footer_copy:    '© 2026 Yoinn App. Made to connect.',
        footer_safety:  'Child Safety (CSAE)',
        footer_privacy: 'Privacy',
        footer_terms:   'Terms & Conditions',
    },
};

export function detectLang() {
    return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function applyTranslations(t) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        if (t[el.dataset.i18n] !== undefined) el.textContent = t[el.dataset.i18n];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        if (t[el.dataset.i18nHtml] !== undefined) el.innerHTML = t[el.dataset.i18nHtml];
    });
}
