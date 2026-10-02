# Atlas — Croisières en Europe

Site en français avec globe Three.js, départs réels Norwegian, Celebrity et Costa, prix CAD, filtres dates de séjour / budget / durée / région / port, itinéraires et photos des escales. Couverture limitée à Norwegian, Celebrity et Costa (via cruise.ca) ; aucune réservation dans Atlas.

## Démarrer

`npm start` puis ouvrir http://127.0.0.1:4173. Aucun paquet à installer : Three.js 0.180.0 est livré dans dist/assets.

## Connexion aux données

Le module dist/ncl.js interroge directement le moteur public canadien https://www.ncl.com/ca/en/ : api/v2/vacations/search, api/vacations/sailings/{code} et api/vacations/events/{code}/package/{id}. Les en-têtes CORS permettent actuellement la lecture sans clé dans le navigateur. Ce n'est pas une API contractuelle : disponibilité et format peuvent changer. Pour une couverture durable de plusieurs compagnies, prévoir un flux fournisseur autorisé.

Chargement automatique de tous les itinéraires par pages de 12, avec indicateur central de progression. Les filtres portent sur les départs correspondant à la période. Changer les dates lance une recherche. La période maximale est de 25 mois. Cache en mémoire de cinq minutes. Aucune donnée fictive ne remplace une erreur.

Atlas retient par départ le plus bas prix positif parmi les cabines AVAILABLE en CAD. Les offres SOLD_OUT, SOLO_GUEST_ONLY et les autres devises sont exclues. Aucune conversion monétaire. Le séjour complet doit entrer dans la période choisie. Le prix par personne, l'occupation, les taxes, frais et promotions doivent être confirmés sur le lien du départ officiel.

Escales et URL des photos fournies par Norwegian. Coordonnées approximatives ; les escales inconnues restent dans la liste mais ne sont pas tracées. Les lignes ne sont pas des routes maritimes. Les textes conservent la langue de la source.

## Sources visuelles

Contours Natural Earth (domaine public), 110m au chargement puis 10m. Texture 8192×4096 sur ordinateur, 4096×2048 sur mobile selon le GPU ; zoom maximal 8. Three.js sous licence MIT livrée dans les assets. Photos distantes attribuées à NCL ; vérifier les droits avant diffusion commerciale.

Le WebMCP facultatif filter_cruises utilise les filtres de l’interface et retourne les départs réels chargés. Le site fonctionne sans cette API.

## Celebrity Cruises

Le module dist/celebrity.js lit le moteur public GraphQL /graph de Celebrity, avec Country CAN et Currency CAD, deux adultes, destination EUROP. Les prix sont ceux de lowestStateroomClassPrice par départ, arrondis au dollar supérieur comme le site officiel ; aucune catégorie précise n’est inventée. taxesAndFeesIncluded est conservé. Les escales suivent les jours fournis, hors journées en mer. Les images viennent des chemins de médias du fournisseur sur assets.dm.rccl.com. Une recherche charge toutes les pages de 12 itinéraires par compagnie ; la pagination est indépendante et une panne ne supprime pas les résultats de l’autre source. Pas de clé ni de contrat d’API : le moteur public peut changer.

## Costa via cruise.ca

Source publique CAD : catalogue de cruise.ca, site 58f45ef4-c253-43dd-b198-141872ed26be, /public-sites/api/site/{site}/search/results, cmp=2, destinations européennes 35,41,53,59,65,71,77,83, rs=12 et pagination pgn à partir de 0. Chaque fiche publique fournit les départs non complets et leurs prix individuels via ses données React Flight JSON. Le parseur lit uniquement JSON et ignore les enregistrements texte selon leur longueur UTF-8 ; aucun script de la source n’est exécuté. La durée du détail est en jours (nuits = jours - 1). Taxes séparées ajoutées au prix lorsque déclarées. Liens et photos attribués à cruise.ca, agence vendeuse, et non au site officiel Costa. Les données peuvent être mises en cache par la source avant notre lecture ; la date affichée est celle de la dernière lecture par Atlas, pas une garantie de disponibilité.
