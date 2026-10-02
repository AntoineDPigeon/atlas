# Atlas — Croisières en Europe

Explorateur de croisières en Europe avec globe interactif, escales et prix en CAD.

## Organisation

- `dist/` : application et ressources du globe servies au navigateur.
- `tests/` : tests des données et des interactions.
- `worker.js`, `server/` et `wrangler.jsonc` : serveur Cloudflare et intégration Google Places.
- `package.json` et `serve.mjs` : commandes et serveur local à la racine.
- `docs/screenshots/` : captures historiques de validation de l’interface, non utilisées par l’application.

## Démarrer en local

```sh
npm start
```

Ouvrir http://127.0.0.1:4173.

## Images

Les photos des croisières et des escales sont chargées à distance depuis les URL fournies par les compagnies ou cruise.ca. Les images de l’interface utilisent le chargement différé (`loading="lazy"`). Elles ne proviennent pas des captures de `docs/screenshots/`.

Les contours géographiques, le favicon et Three.js restent des ressources locales dans `dist/`.

Voir [la documentation des sources](docs/data-sources.md) pour les sources de données.

## Cloudflare et avis Google

Le Worker sert `dist/` et la route `/api/google-reviews` sur le même domaine. Les avis Google se chargent uniquement à l’ouverture de « Avis Google » dans une fiche d’itinéraire. Les notes restent associées au terminal trouvé, avec son nom, son adresse et les auteurs des avis. Elles ne sont pas affichées sur le globe Three.js. Les avis des navires restent fournis par cruise.ca et les liens existants.

Configuration Cloudflare Workers Builds :

| Champ | Valeur |
| --- | --- |
| Root directory | Racine du dépôt (vide) |
| Build command | Vide |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler preview` |

Le nom `atlas` dans `wrangler.jsonc` doit correspondre au nom de votre Worker Cloudflare ; adaptez-le si nécessaire.

Dans **Settings → Variables and Secrets**, ajoutez `GOOGLE_PLACES_API_KEY` avec le type **Secret**, puis déployez. Activez **Places API (New)** et la facturation dans Google Cloud et limitez la clé à cette API. Ne placez jamais la clé dans Git, les commandes de build, le code du navigateur ou les captures d’écran.

Le déploiement exige désormais que ce secret soit lié au Worker. Si Atlas répond « Les avis Google ne sont pas encore activés », vérifiez la configuration **Production** du Worker `atlas`, et non **Previews Base** ni les secrets de la section **Builds**. L’existence du secret dans les réglages ne suffit pas si la version qui sert le trafic ne le reçoit pas : modifiez le secret dans les réglages de production et choisissez **Deploy**, puis vérifiez la version active dans **Deployments**.

La recherche de fiche demande uniquement son identifiant (`places.id`). La lecture de la fiche inclut les notes et les avis (`Place Details Enterprise + Atmosphere`). Les appels restent soumis aux quotas Google ; définissez vos quotas dans Google Cloud pour contrôler les dépenses. Les avis ne sont pas mis en cache sur le serveur ou dans le stockage du navigateur. Un port inconnu, un résultat éloigné ou une fiche sans terminal identifiable ne reçoit pas de note de remplacement.

`npm start` utilise aussi la route serveur locale et lit la variable d’environnement `GOOGLE_PLACES_API_KEY` si elle est déjà configurée. Sans clé, l’application reste utilisable et indique que les avis Google ne sont pas activés.

Pour utiliser les outils Cloudflare en local : `npm install`, puis `npm run dev:cloudflare`. Utiliser une version de Node compatible avec Wrangler (voir `package-lock.json`).
