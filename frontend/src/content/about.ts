/**
 * ════════════════════════════════════════════════════════════════════════════
 *  À PERSONNALISER — contenu de la page /about
 *
 *  Les valeurs marquées « TODO » sont des espaces réservés : remplace-les par
 *  ta situation réelle. La structure, elle, n'a pas besoin de changer.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface TimelineEntry {
  period: string;
  title: string;
  place: string;
  body: string;
  /** Mis en avant visuellement — sert à repérer l'étape en cours. */
  current?: boolean;
}

export interface LanguageLevel {
  name: string;
  /** Niveau CECRL. */
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  /** 0 → 1, pour la barre de progression. */
  ratio: number;
  note: string;
}

export interface Passion {
  title: string;
  body: string;
  icon: 'build' | 'network' | 'terminal';
}

export interface AboutIntro {
  city: string;
  cityNote: string;
  paragraphs: string[];
}

export const aboutIntro: AboutIntro = {
  /** TODO — ta ville actuelle. */
  city: 'Paris',
  cityNote: 'Là où je vis et où j’ai posé mes serveurs.',
  /** TODO — deux ou trois phrases de présentation. */
  paragraphs: [
    "Je m'appelle Gaspard Tourdiat. J'ai commencé à écrire du code en voulant comprendre comment un jeu marchait — je n'ai jamais vraiment arrêté depuis. Ce qui me tient, c'est le moment où une abstraction cesse d'être magique et devient un mécanisme que je peux démonter.",
    "J'ai choisi la cybersécurité par goût du détail : c'est le domaine où comprendre *exactement* ce qui se passe entre deux machines est le cœur du métier. J'aime autant écrire un outil qu'auditer celui de quelqu'un d'autre, et les deux m'apprennent la même chose en sens inverse.",
  ],
};

export const passions: Passion[] = [
  {
    title: 'Construire des solutions',
    icon: 'build',
    body: "Un problème mal posé se résout en trois lignes de script. J'aime l'automatisation pour ce qu'elle enlève : les tâches répétitives, les erreurs humaines, le temps perdu. Voir un process de deux heures tomber à trente secondes reste, honnêtement, l'une des meilleures sensations du métier.",
  },
  {
    title: 'Réseaux et systèmes',
    icon: 'network',
    body: "Comprendre comment les paquets circulent, où ils s'arrêtent, qui les lit. C'est ce qui m'a amené à la sécurité : on ne protège correctement que ce qu'on a d'abord compris en entier.",
  },
  {
    title: 'Partager et documenter',
    icon: 'terminal',
    body: "Je documente ce que je fais, parce que la personne la plus utile à mon futur moi, c'est le moi qui a écrit le code six mois plus tôt et qui a tout oublié. Écrire un README clair fait partie du travail, pas de l'option.",
  },
];

export const education: TimelineEntry[] = [
  {
    period: '— 2021',
    title: 'Baccalauréat',
    place: 'TODO — lycée',
    body: "Fin du lycée, déjà plus occupé à faire tourner des serveurs de jeux chez moi qu'à réviser. C'est là que j'ai su que je voulais travailler dans l'informatique.",
  },
  {
    period: '2021 — 2024',
    title: 'BUT GEA — Gestion des Entreprises et des Administrations',
    place: 'TODO — IUT',
    body: "Trois ans de gestion, de comptabilité et de droit. Utile, mais un peu à côté de l'endroit où je passais mes soirées. J'y ai quand même pris ce qui me sert tous les jours : lire un bilan, comprendre une organisation, écrire à quelqu'un sans lui faire perdre son temps.",
  },
  {
    period: '2024 — aujourd’hui',
    title: 'École 42',
    place: 'TODO — campus',
    body: "J'ai choisi 42 pour la pédagogie, pas pour le diplôme : pas de cours magistral, des projets à rendre, et une communauté qui répond quand on pose une bonne question. Le rythme est dur et c'est exactement ce que je cherchais.",
    current: true,
  },
  {
    period: 'La suite',
    title: 'Alternance en cybersécurité',
    place: 'À construire',
    body: "TODO — ce que tu veux faire ensuite : pentest, SOC, développement sécurité, sécurité offensive ou défensive.",
  },
];

export interface School42Pillar {
  title: string;
  body: string;
}

export interface School42 {
  title: string;
  intro: string;
  pillars: School42Pillar[];
}

export const school42: School42 = {
  title: "L'école 42, concrètement",
  intro:
    "42 est une école sans professeurs, sans cours et sans horaires. On y apprend en faisant, en échouant, et en demandant aux autres. Ce format n'est pas confortable — c'est précisément ce qui le rend efficace.",
  pillars: [
    {
      title: 'Le peer-to-peer',
      body: "Pas de professeur : la correction se fait entre étudiants, sur une grille de critères publique. On apprend autant en évaluant le code de quelqu'un d'autre qu'en écrivant le sien, parce qu'il faut d'abord comprendre son raisonnement pour le juger.",
    },
    {
      title: 'Les deadlines',
      body: "Chaque projet a une date. La dépasser signifie qu'on ne pourra plus le valider. Ça force à découper le travail, à savoir s'arrêter sur une version qui tient debout, et à assumer un choix technique plutôt que de le repousser indéfiniment.",
    },
    {
      title: 'Gérer ses projets soi-même',
      body: "Personne ne vient vérifier où on en est. Le planning, les priorités, l'ordre des projets : tout est à décider. C'est la compétence la moins visible de la formation, et probablement la plus transférable en entreprise.",
    },
    {
      title: 'Les projets de groupe',
      body: "Certains projets se font à plusieurs, avec des équipes parfois imposées. Découper un travail, s'accorder sur une interface commune, relire le code des autres et gérer les désaccords : c'est là qu'on apprend à livrer quelque chose à plusieurs.",
    },
  ],
};

export const languages: LanguageLevel[] = [
  {
    name: 'Français',
    level: 'C2',
    ratio: 1,
    note: 'Langue maternelle.',
  },
  {
    name: 'Anglais',
    level: 'C1',
    ratio: 0.85,
    note:
      "TODO — adapte à ton niveau. Toute ma documentation technique et la totalité de mes recherches se font en anglais, c'est la langue dans laquelle je code.",
  },
  {
    name: 'TODO — autre langue',
    level: 'B1',
    ratio: 0.55,
    note: 'TODO — supprime cette entrée si elle ne te concerne pas.',
  },
];

export interface NotCoding {
  title: string;
  body: string;
  alternatives: string[];
}

export const notCoding: NotCoding = {
  title: "Si je ne codais pas",
  body: "TODO — qu'est-ce que tu ferais à la place ? Une phrase honnête vaut mieux qu'une réponse de candidature.",
  alternatives: [
    'TODO — une piste',
    'TODO — une autre',
    'TODO — une dernière',
  ],
};
