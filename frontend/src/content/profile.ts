/**
 * ════════════════════════════════════════════════════════════════════════════
 *  À PERSONNALISER
 *
 *  Tout ce qui parle de toi vit dans ce fichier et dans `./about.ts`.
 *  Les valeurs marquées « TODO » sont des espaces réservés : remplace-les.
 *  Rien d'autre dans le code n'a besoin d'être touché pour éditer le contenu.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface Skill {
  name: string;
  /** 1 → notions, 5 → à l'aise en autonomie sur un projet réel. */
  level: 1 | 2 | 3 | 4 | 5;
  detail: string;
}

export interface SkillGroup {
  id: string;
  label: string;
  /** Petite phrase affichée sous le titre du groupe. */
  blurb: string;
  accent: 'acid' | 'cyan' | 'amber' | 'violet';
  items: Skill[];
}

export interface SocialLink {
  id: 'github' | 'linkedin' | 'cv' | 'mail';
  label: string;
  description: string;
  href: string;
  /** `true` ouvre dans un nouvel onglet (liens externes). */
  external: boolean;
}

/** Année de départ, utilisée pour « années de code » si l'API est indisponible. */
export const CAREER_START_YEAR = 2021;

/**
 * These values are defaults: every field below can be overridden from the
 * admin panel, which is why the types are widened rather than `as const`.
 */
export interface Profile {
  firstName: string;
  lastName: string;
  fullName: string;
  handle: string;
  tagline: string;
  role: string;
  location: string;
  email: string;
  avatarUrl: string;
  /** Bandeau défilant : chaque entrée devient un segment. */
  status: string[];
}

export const profile: Profile = {
  firstName: 'Gaspard',
  lastName: 'Tourdiat',
  fullName: 'Gaspard Tourdiat',
  handle: 'sousampere',

  /** TODO — ta phrase de présentation, courte. Elle s'affiche en gros et se tape lettre à lettre. */
  tagline: "J'apprends en cassant des choses, puis en les réparant proprement.",

  role: "Étudiant à l'école 42 · Cybersécurité & Développement",

  /** TODO — ta ville. */
  location: 'Paris, France',

  /** TODO — ton adresse e-mail publique. */
  email: 'contact@gaspardtourdiat.fr',

  /** Photo de profil : remplace `frontend/public/avatar.png` par ta photo. */
  avatarUrl: '/avatar.png',

  /**
   * Bandeau défilant en haut de la page d'accueil : ce que tu cherches en ce moment.
   * Chaque entrée devient un segment du bandeau.
   */
  status: [
    'Alternance en cybersécurité',
    'Disponible pour la rentrée 2027',
    'Ouvert aux missions freelance',
    'Rythme : 3 semaines entreprise / 1 semaine école',
  ],
};

export const socials: SocialLink[] = [
  {
    id: 'github',
    label: 'GitHub',
    description: 'Le code de tous mes projets, publics par défaut.',
    href: 'https://github.com/sousampere',
    external: true,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    description: 'Mon parcours, mes expériences et mon réseau.',
    // TODO — remplace par l'URL exacte de ton profil LinkedIn.
    href: 'https://www.linkedin.com/in/gaspard-tourdiat',
    external: true,
  },
  {
    id: 'cv',
    label: 'CV',
    description: 'Une page, tout ce qu’il y a à savoir.',
    // TODO — dépose ton CV dans `frontend/public/cv.pdf`.
    href: '/cv.pdf',
    external: false,
  },
  {
    id: 'mail',
    label: 'E-mail',
    description: 'Pour discuter d’un stage, d’une alternance ou d’un projet.',
    href: 'mailto:contact@gaspardtourdiat.fr',
    external: false,
  },
];

export const skillGroups: SkillGroup[] = [
  {
    id: 'languages',
    label: 'Langages',
    blurb: 'Ce avec quoi j’écris au quotidien.',
    accent: 'acid',
    items: [
      { name: 'C', level: 4, detail: 'Le langage de la piscine 42, et celui de mes projets de bas niveau.' },
      { name: 'Python', level: 4, detail: 'Scripts d’automatisation, outillage sécurité, structuration de données.' },
      { name: 'TypeScript', level: 4, detail: 'Typage strict côté front comme côté back, mon défaut pour tout ce qui a une UI.' },
      { name: 'JavaScript', level: 4, detail: 'Le runtime du web, des scripts navigateur aux services Node.' },
      { name: 'SQL', level: 3, detail: 'Modélisation de schémas, jointures et requêtes d’analyse.' },
      { name: 'Bash', level: 3, detail: 'L’outil que j’ouvre avant tous les autres pour enchaîner les commandes.' },
      { name: 'Go', level: 2, detail: 'En apprentissage, pour les services réseau et la concurrence.' },
    ],
  },
  {
    id: 'frameworks',
    label: 'Frameworks & bibliothèques',
    blurb: 'Ce sur quoi je construis des choses complètes.',
    accent: 'cyan',
    items: [
      { name: 'React', level: 4, detail: 'Interfaces découpées en composants, état maîtrisé, pas de re-render inutile.' },
      { name: 'Node.js', level: 4, detail: 'APIs REST, authentification, accès base de données.' },
      { name: 'Tailwind CSS', level: 4, detail: 'Design system direct dans le markup, cohérent du premier au dernier écran.' },
      { name: 'Express', level: 3, detail: 'Serveurs HTTP minimalistes et middlewares ciblés.' },
      { name: 'Docker', level: 3, detail: 'Chaque projet que je livre est reproductible en une commande.' },
      { name: 'Nginx', level: 3, detail: 'Reverse proxy, service de fichiers statiques et terminaison TLS.' },
    ],
  },
  {
    id: 'tools',
    label: 'Outils',
    blurb: 'Ce qui m’entoure quand je travaille.',
    accent: 'violet',
    items: [
      { name: 'Linux', level: 4, detail: 'Mon système quotidien : Arch au bureau, Debian en serveur.' },
      { name: 'Git', level: 4, detail: 'Branches courtes, commits lisibles, rebase avant de pousser.' },
      { name: 'Wireshark', level: 3, detail: 'Lecture de trafic pour comprendre ce qui circule vraiment sur le réseau.' },
      { name: 'Burp Suite', level: 3, detail: 'Analyse d’applications web dans un cadre d’entraînement.' },
      { name: 'Nmap', level: 3, detail: 'Cartographie de réseau et reconnaissance de services.' },
      { name: 'MariaDB / MySQL', level: 3, detail: 'Schémas relationnels, index, sauvegardes.' },
      { name: 'Neovim', level: 3, detail: 'Configuré à la main, comme tout bon environnement de travail.' },
      { name: 'Figma', level: 2, detail: 'Maquettes avant de coder, pour éviter de refaire trois fois la même page.' },
    ],
  },
];

export interface FallbackStats {
  projects: number;
  commits: number;
  yearsOfCode: number;
}

/** Compteurs de secours si l'API n'est pas joignable (ex. GitHub indisponible). */
export const fallbackStats: FallbackStats = {
  projects: 12,
  commits: 2400,
  yearsOfCode: Math.max(1, new Date().getFullYear() - CAREER_START_YEAR),
};
