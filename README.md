# GaspardTourdiat.fr

Portfolio personnel — React + TypeScript côté navigateur, Node/Express + MariaDB côté serveur, le tout dans une stack Docker lancée par une seule commande.

Le site reprend les codes du terminal et de macOS : fenêtres flottantes, curseur qui suit la souris, bannière défilante, police monospace.

---

## Démarrage rapide

```bash
git clone <ce-dépôt> && cd gaspartourdiat.fr
cp .env.example .env      # puis remplir les valeurs (voir « Configuration »)
make run
```

`make run` construit les images et démarre les trois conteneurs. Le site est ensuite disponible sur :

| URL | Contenu |
| --- | --- |
| http://localhost:8080 | Le site public |
| http://localhost:8080/admin | Le panneau d'administration |
| http://localhost:8080/api/health | Sonde de santé de l'API |

`HTTP_PORT` dans `.env` permet de changer le port publié.

### Prérequis

- Docker avec le plugin Compose (`docker compose version`)
- GNU Make
- ~~Node.js~~ — **pas nécessaire** : tout est compilé dans les images

---

## Configuration

Toutes les variables vivent dans `.env`, à la racine, et `.env` n'est **jamais** versionné.

| Variable | Rôle |
| --- | --- |
| `HTTP_PORT` | Port hôte publié par nginx (défaut `8080`) |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Base MariaDB applicative |
| `DB_ROOT_PASSWORD` | Mot de passe root — ne sert qu'à initialiser le volume au premier démarrage |
| `JWT_SECRET` | Signature des cookies de session admin. `openssl rand -hex 32` |
| `ADMIN_USER`, `ADMIN_PASSWORD` | Identifiants du panneau `/admin` |
| `GITHUB_USERNAME` | Compte dont on affiche les dépôts (défaut `sousampere`) |
| `GITHUB_TOKEN` | Optionnel mais recommandé — voir ci-dessous |
| `SYNC_INTERVAL_HOURS` | Durée de fraîcheur du cache GitHub avant re-synchronisation |
| `DNS_PRIMARY`, `DNS_SECONDARY` | Résolveurs utilisés par les conteneurs (voir « Réseaux restreints ») |

En production (`NODE_ENV=production`), l'API refuse de démarrer si `JWT_SECRET` ou `ADMIN_PASSWORD` n'est pas défini, plutôt que de retomber silencieusement sur une valeur de développement.

### Le jeton GitHub

Sans `GITHUB_TOKEN`, l'API interroge GitHub en anonyme : 60 requêtes par heure, et **le nombre total de commits ne peut pas être calculé** (il s'affiche alors `——`). Le reste du site fonctionne normalement.

Le jeton n'a besoin d'aucun scope pour des données publiques. À créer sur <https://github.com/settings/tokens>. Un jeton *fine-grained* en lecture seule sur les dépôts publics suffit.

---

## Architecture

Trois conteneurs sur un réseau Compose interne :

```
navigateur ──▶ web (nginx :80) ──┬──▶ fichiers statiques React (dist/)
                                 └──▶ /api/ ──▶ api (Express :3000) ──▶ db (MariaDB 11.4)
```

- **`web`** — sert le build Vite et joue le rôle de reverse proxy vers l'API. Toute route inconnue retombe sur `index.html` pour laisser le routeur client décider. Les fichiers de `/assets/` sont fingerprintés par Vite et donc mis en cache un an ; `index.html` ne l'est jamais, sans quoi un déploiement continuerait de servir les anciens hashs.
- **`api`** — API REST, cache GitHub et authentification admin. Ne publie aucun port : on n'y accède que via nginx.
- **`db`** — MariaDB sur un volume nommé `db_data`. Persiste entre les `make stop` / `make run`.

L'API tourne sous l'utilisateur `node` (non privilégié) et n'est jamais exposée directement : elle n'est joignable que depuis nginx. Le conteneur `web` conserve le comportement standard de l'image nginx — un processus maître root qui ouvre le port 80, des processus de travail non privilégiés — puisque c'est la seule façon d'écouter sur un port privilégié.

### Cache GitHub et réglages admin

Les dépôts sont copiés en base par une synchronisation GraphQL (pagination, projets épinglés, total de contributions sur plusieurs années). Les colonnes modifiables depuis l'administration — `pinned`, `hidden`, `sort_order`, `display_name`, `custom_description` — sont **volontairement exclues** de la clause `ON DUPLICATE KEY UPDATE`. Une re-synchronisation ne peut donc jamais écraser ce qui a été réglé à la main.

Le classement appliqué à l'affichage : épinglés d'abord, puis `sort_order`, puis étoiles. Un projet masqué disparaît du site public instantanément mais reste en cache et dans l'administration — le masquage n'est pas une suppression.

Le contenu éditable suit la même logique : la table `settings` ne contient que les substitutions, jamais les valeurs par défaut. Les chemins sont validés à l'écriture (format pointé, 64 caractères, 32 000 par valeur) et les segments `__proto__`, `constructor` et `prototype` sont refusés des deux côtés — côté API comme côté navigateur, où une substitution n'est appliquée que si le champ existe déjà dans les valeurs compilées.

### Routes de l'API

| Méthode | Route | Accès |
| --- | --- | --- |
| `GET` | `/api/health` | public |
| `GET` | `/api/projects` | public |
| `GET` | `/api/stats` | public |
| `GET` | `/api/settings` | public |
| `POST` | `/api/auth/login` | public (limité à 8 tentatives / 15 min) |
| `POST` | `/api/auth/logout` | public |
| `GET` | `/api/auth/me` | public |
| `GET` | `/api/admin/projects` | session requise |
| `PATCH` | `/api/admin/projects/:id` | session requise |
| `POST` | `/api/admin/projects/reorder` | session requise |
| `POST` | `/api/admin/sync` | session requise |
| `GET` | `/api/admin/settings` | session requise |
| `PUT` | `/api/admin/settings` | session requise |
| `DELETE` | `/api/admin/settings/:key` | session requise |

La session est un JWT dans un cookie `HttpOnly` + `SameSite=Lax`, jamais exposé au JavaScript de la page.

---

## Commandes

```
make help     # la liste complète
make run      # build + démarrage en arrière-plan
make stop     # arrêt des conteneurs
make restart  # redémarrage
make logs     # logs en suivi
make ps       # état des conteneurs
make sync     # force une re-synchronisation GitHub
make build    # rebuild des images
make re       # clean + build + run
make clean    # supprime les conteneurs
make fclean   # supprime conteneurs + volumes (⚠ efface la base)
```

### Développement

```bash
make install   # installe les dépendances des deux projets
make dev-api   # API seule, en rechargement automatique
make dev-web   # serveur de développement Vite (proxy vers l'API)
```

En développement, `dev-web` sert le front sur son propre port avec rechargement à chaud, et relaie `/api` vers l'API locale.

---

## Personnaliser le contenu

Tout le texte du site se modifie **depuis l'onglet « Contenu » du panneau `/admin`** : localisation, catch-phrase, textes du bandeau défilant, réseaux, compétences, parcours, école 42, langues, statistiques de secours. Les champs sont regroupés par section ; « réinitialiser » sur un champ le renvoie à sa valeur d'origine.

Les valeurs par défaut vivent dans le code, en français, dans deux fichiers :

- [`frontend/src/content/profile.ts`](frontend/src/content/profile.ts) — identité, accroche, réseaux, compétences, statistiques de secours
- [`frontend/src/content/about.ts`](frontend/src/content/about.ts) — parcours, baccalauréat, GEA, école 42, passions, langues

Ces fichiers restent la référence : **seules les valeurs modifiées depuis l'admin sont stockées en base**, sous forme de chemins (`profile.tagline`, `aboutIntro.city`, …). Une clé absente retombe sur la valeur compilée, donc vider la table `settings` restitue le site d'origine à l'identique. Modifier un défaut dans le code met à jour tous les champs que l'admin n'a pas explicitement remplacés.

Pour rendre un nouveau champ éditable, il suffit de l'ajouter à [`frontend/src/content/fields.ts`](frontend/src/content/fields.ts) : le back-end accepte n'importe quel chemin pointé, et le front n'applique que les chemins qui existent déjà dans les valeurs par défaut.

Les valeurs encore à compléter dans le code sont signalées par des `TODO` et un en-tête `À PERSONNALISER`. Les fichiers sont typés : une rubrique oubliée fait échouer le build plutôt que de laisser un trou dans la page.

Deux fichiers sont à remplacer par les vrais (leur chemin est éditable depuis l'admin) :

- [`frontend/public/avatar.png`](frontend/public/avatar.png) — l'avatar affiché à côté de l'accroche (512 × 512)
- [`frontend/public/cv.pdf`](frontend/public/cv.pdf) — le PDF servi par le lien « CV » (actuellement un gabarit d'une page)

### Le fond réactif

Le dégradé qui suit la souris est piloté par deux variables CSS mises à jour dans une boucle `requestAnimationFrame`, avec une couche de traînée qui interpole en `transition`. Tout le mouvement est désactivé sous `prefers-reduced-motion: reduce`, y compris la bannière défilante et les animations d'apparition.

---

## Réseaux restreints

Sur certains réseaux d'école ou d'entreprise, le DNS de la machine est injoignable depuis l'intérieur de Docker : les `npm install` des builds se figent et les conteneurs ne résolvent plus rien. D'où l'ancre `x-dns` de `docker-compose.yml`, qui force des résolveurs publics pour tous les services, et `build.network: host`, qui fait hériter les builds du DNS de l'hôte.

Ailleurs, ces réglages sont sans effet — les valeurs par défaut pointent sur Cloudflare et Google. Pour utiliser d'autres résolveurs, il suffit de changer `DNS_PRIMARY` / `DNS_SECONDARY` dans `.env`.

---

## Mise en production

Le site est prévu pour être servi derrière un reverse proxy qui termine le TLS (Caddy, Traefik, un nginx hôte). Le cookie de session bascule automatiquement en `Secure` dès que la requête arrive en HTTPS, mais l'application ne gère pas les certificats elle-même : elle écoute en HTTP sur `HTTP_PORT`.

Points à ne pas oublier avant d'ouvrir au public :

1. Générer de vrais secrets — `openssl rand -hex 32` pour `JWT_SECRET`, et un mot de passe admin solide.
2. Retirer `GITHUB_TOKEN` de tout fichier versionné ; il ne doit exister que dans `.env`.
3. Faire pointer `HTTP_PORT` sur le port attendu par le proxy, et non l'inverse.
4. Mettre à jour le domaine dans [`robots.txt`](frontend/public/robots.txt) et [`sitemap.xml`](frontend/public/sitemap.xml) s'il n'est pas `gaspardtourdiat.fr`.
