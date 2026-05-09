import { TRANSLATIONS, detectLang, applyTranslations } from './i18n.js';
import './firebase.js';

async function loadComponent(path) {
    const res = await fetch(path);
    return res.text();
}

async function init() {
    const [nav, hero, features, footer] = await Promise.all([
        loadComponent('components/nav.html'),
        loadComponent('components/hero.html'),
        loadComponent('components/features.html'),
        loadComponent('components/footer.html'),
    ]);

    document.getElementById('nav-root').innerHTML      = nav;
    document.getElementById('hero-root').innerHTML     = hero;
    document.getElementById('features-root').innerHTML = features;
    document.getElementById('footer-root').innerHTML   = footer;

    // i18n
    const lang = detectLang();
    document.documentElement.lang = lang;
    applyTranslations(TRANSLATIONS[lang]);

    // Imágenes
    const root = document.documentElement;
    document.querySelector('.bg-landscape').style.backgroundImage = "url('background.png')";
    root.style.setProperty('--bg-1', "url('1.png')");
    root.style.setProperty('--bg-2', "url('2.png')");
    root.style.setProperty('--bg-3', "url('3.png')");

    // Scroll reveal
    const revealOnScroll = () => {
        document.querySelectorAll('.reveal').forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight - 100) {
                el.classList.add('active');
            }
        });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();
}

init();
