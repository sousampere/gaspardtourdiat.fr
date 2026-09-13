/**
 * The catalogue of editable content fields.
 *
 * This list is what the admin panel renders, and every `path` here is a path
 * into the object built by `SiteContent.tsx`. Adding a field to this list is
 * all it takes to make it editable — the backend accepts any dotted path, and
 * the frontend only applies paths that already exist in the defaults.
 */

export type FieldKind = 'text' | 'textarea' | 'list' | 'json' | 'number';

export interface ContentField {
  /** Dotted path into the site content, e.g. `profile.tagline`. */
  path: string;
  label: string;
  group: string;
  kind: FieldKind;
  help?: string;
}

export const CONTENT_FIELDS: ContentField[] = [
  /* --- Identité ----------------------------------------------------------- */
  { path: 'profile.firstName', label: 'Prénom', group: 'Identité', kind: 'text' },
  { path: 'profile.lastName', label: 'Nom', group: 'Identité', kind: 'text' },
  { path: 'profile.fullName', label: 'Nom complet', group: 'Identité', kind: 'text' },
  { path: 'profile.handle', label: 'Pseudo GitHub', group: 'Identité', kind: 'text' },
  {
    path: 'profile.tagline',
    label: 'Catch-phrase',
    group: 'Identité',
    kind: 'textarea',
    help: "Affichée en gros sur l'accueil et tapée lettre à lettre.",
  },
  { path: 'profile.role', label: 'Statut / rôle', group: 'Identité', kind: 'text' },
  { path: 'profile.location', label: 'Localisation', group: 'Identité', kind: 'text' },
  { path: 'profile.email', label: 'E-mail public', group: 'Identité', kind: 'text' },
  {
    path: 'profile.avatarUrl',
    label: 'Photo de profil',
    group: 'Identité',
    kind: 'text',
    help: 'Chemin dans `frontend/public/` ou URL complète.',
  },

  /* --- Bandeau d'accueil --------------------------------------------------- */
  {
    path: 'profile.status',
    label: "Textes du bandeau d'accueil",
    group: "Bandeau d'accueil",
    kind: 'list',
    help: 'Chaque entrée devient un segment du bandeau défilant.',
  },

  /* --- Réseaux ------------------------------------------------------------- */
  {
    path: 'socials',
    label: 'Liens (GitHub, LinkedIn, CV, e-mail)',
    group: 'Réseaux',
    kind: 'json',
    help: 'Liste de { id, label, description, href, external }.',
  },

  /* --- Compétences --------------------------------------------------------- */
  {
    path: 'skillGroups',
    label: 'Langages, frameworks & outils',
    group: 'Compétences',
    kind: 'json',
    help: 'Liste de groupes { id, label, blurb, accent, items[] }.',
  },

  /* --- Page à propos ------------------------------------------------------- */
  { path: 'aboutIntro.city', label: 'Ville (page à propos)', group: 'Page à propos', kind: 'text' },
  { path: 'aboutIntro.cityNote', label: 'Note sur la ville', group: 'Page à propos', kind: 'text' },
  {
    path: 'aboutIntro.paragraphs',
    label: 'Présentation',
    group: 'Page à propos',
    kind: 'list',
    help: 'Un paragraphe par entrée.',
  },
  {
    path: 'education',
    label: 'Parcours scolaire',
    group: 'Page à propos',
    kind: 'json',
    help: 'Liste de { period, title, place, body, current? }.',
  },
  {
    path: 'passions',
    label: 'Passions',
    group: 'Page à propos',
    kind: 'json',
    help: 'Liste de { title, body, icon } — icon : build, network ou terminal.',
  },
  {
    path: 'notCoding.title',
    label: '« Si je ne codais pas » — titre',
    group: 'Page à propos',
    kind: 'text',
  },
  {
    path: 'notCoding.body',
    label: '« Si je ne codais pas » — texte',
    group: 'Page à propos',
    kind: 'textarea',
  },
  {
    path: 'notCoding.alternatives',
    label: '« Si je ne codais pas » — pistes',
    group: 'Page à propos',
    kind: 'list',
  },

  /* --- École 42 ------------------------------------------------------------ */
  { path: 'school42.title', label: 'Titre', group: 'École 42', kind: 'text' },
  { path: 'school42.intro', label: 'Introduction', group: 'École 42', kind: 'textarea' },
  {
    path: 'school42.pillars',
    label: 'Piliers de la pédagogie',
    group: 'École 42',
    kind: 'json',
    help: 'Liste de { title, body }.',
  },

  /* --- Langues ------------------------------------------------------------- */
  {
    path: 'languages',
    label: 'Langues parlées',
    group: 'Langues',
    kind: 'json',
    help: 'Liste de { name, level, ratio, note } — level : A1…C2, ratio : 0 à 1.',
  },

  /* --- Statistiques -------------------------------------------------------- */
  {
    path: 'fallbackStats.projects',
    label: 'Nombre de projets (secours)',
    group: 'Statistiques',
    kind: 'number',
    help: "Utilisé seulement si l'API est injoignable.",
  },
  {
    path: 'fallbackStats.commits',
    label: 'Nombre de commits (secours)',
    group: 'Statistiques',
    kind: 'number',
    help: "Utilisé seulement si l'API est injoignable.",
  },
];

/** Group names, in the order they first appear above. */
export const CONTENT_GROUPS: string[] = CONTENT_FIELDS.reduce<string[]>((groups, field) => {
  if (!groups.includes(field.group)) groups.push(field.group);
  return groups;
}, []);

export const CONTENT_FIELDS_BY_PATH = new Map(CONTENT_FIELDS.map((field) => [field.path, field]));
