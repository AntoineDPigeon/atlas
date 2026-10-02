# Atlas — Croisières en Europe

Explorateur de croisières en Europe avec globe interactif, escales et prix en CAD.

## Organisation

- `atlas-cruises/` : application, ressources du globe et tests.
- `docs/screenshots/` : captures historiques de validation de l’interface, non utilisées par l’application.

## Démarrer en local

```sh
npm --prefix atlas-cruises start
```

Ouvrir http://127.0.0.1:4173.

## Images

Les photos des croisières et des escales sont chargées à distance depuis les URL fournies par les compagnies ou cruise.ca. Les images de l’interface utilisent le chargement différé (`loading="lazy"`). Elles ne proviennent pas des captures de `docs/screenshots/`.

Les contours géographiques, le favicon et Three.js restent des ressources locales dans `atlas-cruises/dist/`.

Voir [la documentation de l’application](atlas-cruises/README.md) pour les sources de données.
