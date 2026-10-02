# Atlas — Croisières en Europe

Explorateur de croisières en Europe avec globe interactif, escales et prix en CAD.

## Organisation

- `dist/` : application et ressources du globe servies au navigateur.
- `tests/` : tests des données et des interactions.
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
