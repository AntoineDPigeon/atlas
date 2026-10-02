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

Les photos des croisières et des escales sont chargées à distance depuis les URL fournies par les compagnies ou cruise.ca. Chaque escale affiche sa propre photo avec sa source dans la fiche d’itinéraire. Si la source ne fournit pas d’image, Atlas cherche une photo du même port dans les offres déjà chargées. Une photo absente ou inaccessible est signalée sans utiliser celle d’une autre destination. Les images de l’interface utilisent le chargement différé (`loading="lazy"`). Elles ne proviennent pas des captures de `docs/screenshots/`.

Les contours géographiques, le favicon et Three.js restent des ressources locales dans `dist/`.

Voir [la documentation des sources](docs/data-sources.md) pour les sources de données.

## Cloudflare et notes Google

Le Worker sert `dist/` et la route `/api/google-reviews` sur le même domaine. La note Google sur 5 se charge à l’ouverture de « Note Google » dans une fiche d’itinéraire. Pour un port déjà consulté, cette section se rouvre automatiquement. Seul l’identifiant Google du lieu est mémorisé dans le navigateur pendant un an : les consultations suivantes demandent directement une note à jour sans refaire la recherche du lieu. Un identifiant périmé est effacé pour permettre une nouvelle recherche. Les notes restent associées au terminal trouvé, avec son nom et son adresse. Elles ne sont pas affichées sur le globe Three.js. Les avis des navires restent fournis par cruise.ca et les liens existants.

Configuration Cloudflare Workers Builds :

| Champ | Valeur |
| --- | --- |
| Root directory | Racine du dépôt (vide) |
| Build command | Vide |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler preview` |

Le nom `atlas` dans `wrangler.jsonc` doit correspondre au nom de votre Worker Cloudflare ; adaptez-le si nécessaire.

Dans **Settings → Variables and Secrets**, ajoutez `GOOGLE_PLACES_API_KEY` avec le type **Secret**, puis déployez. Activez **Places API (New)** et la facturation dans Google Cloud et limitez la clé à cette API. Ne placez jamais la clé dans Git, les commandes de build, le code du navigateur ou les captures d’écran.

Le déploiement exige désormais que ce secret soit lié au Worker. Si Atlas répond « Les notes Google ne sont pas encore activées », vérifiez la configuration **Production** du Worker `atlas`, et non **Previews Base** ni les secrets de la section **Builds**. L’existence du secret dans les réglages ne suffit pas si la version qui sert le trafic ne le reçoit pas : modifiez le secret dans les réglages de production et choisissez **Deploy**, puis vérifiez la version active dans **Deployments**.

La recherche de fiche demande uniquement son identifiant (`places.id`). La lecture de la fiche demande la note globale sur 5 (`Place Details Enterprise`), sans demander les avis écrits, leurs auteurs ou leurs photos. Les appels restent soumis aux quotas Google ; définissez vos quotas dans Google Cloud pour contrôler les dépenses. Les notes ne sont pas mises en cache sur le serveur ou dans le stockage du navigateur. Un port inconnu, un résultat éloigné ou une fiche sans terminal identifiable ne reçoit pas de note de remplacement.

`npm start` utilise aussi la route serveur locale et lit la variable d’environnement `GOOGLE_PLACES_API_KEY` si elle est déjà configurée. Sans clé, l’application reste utilisable et indique que les notes Google ne sont pas activées.

Pour utiliser les outils Cloudflare en local : `npm install`, puis `npm run dev:cloudflare`. Utiliser une version de Node compatible avec Wrangler (voir `package-lock.json`).

## Ports et filtres

Le filtre « Ports à visiter » propose une recherche et des cases à cocher. Il partage la sélection du globe et ne conserve que les croisières qui passent par tous les ports choisis. Les options proviennent des départs chargés correspondant aux autres filtres ; un port déjà sélectionné reste visible même sans résultat. Les changements de ports ne rechargent pas les catalogues.

Huit ports d’Afrique du Nord sont localisés : Agadir, Casablanca, Tanger, La Goulette/Tunis, Alger, Oran, Alexandrie et Port-Saïd. Les noms équivalents des fournisseurs sont rapprochés pour éviter les doublons. Leur présence dans le catalogue dépend des itinéraires disponibles pour les dates choisies.

## Vols depuis Montréal

La fiche de croisière propose les cinq aéroports commerciaux les plus proches dans un rayon de 300 km, à partir des données publiques OurAirports (https://ourairports.com/data/), snapshot du 2 octobre 2026. Les distances sont à vol d’oiseau. Le voyageur peut modifier les aéroports et dates. Le départ de YUL est proposé deux jours avant l’embarquement, le retour le lendemain du débarquement.

Les tarifs réels passent par SerpApi Google Flights (https://serpapi.com/google-flights-api). Créer un compte sur https://serpapi.com/users/sign_up, puis ajouter `SERPAPI_API_KEY` comme **Secret** de production dans Cloudflare pour le Worker `atlas` et déployer. Cette clé est distincte de `GOOGLE_PLACES_API_KEY` et reste uniquement côté serveur. Le forfait gratuit annonce 250 recherches par mois ; vérifier les conditions et quotas courants sur https://serpapi.com/pricing. Cette intégration reste facultative : sans clé, les autres fonctions restent utilisables.

La recherche `/api/flight-prices` utilise CAD, un adulte, la classe économique et au plus une correspondance. Elle se lance sur clic. La moyenne porte sur les offres distinctes retournées par la source, avec leur prix minimum, maximum, nombre et date de relevé. Elle ne constitue pas une moyenne exhaustive du marché. Un aller-retour avec deux ports différents utilise une recherche multi-destinations, avec retour vers YUL depuis le port de débarquement. Les dates passées, les aéroports non reconnus et les dates au-delà des 365 prochains jours ne déclenchent pas de recherche payante. Aucun prix de remplacement ou prix fictif n’est affiché.

Le tracé maritime conserve une largeur cible de 1,3 pixel CSS au zoom et au redimensionnement ; seules les sections des tubes sont ajustées, sans reconstruire les chemins. Les flèches conservent aussi une taille discrète à l’écran.
