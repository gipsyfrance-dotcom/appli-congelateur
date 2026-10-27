# Mon garde-manger — appli web (Google Sheet + Apps Script + GitHub Pages)

Remplace la version AppSheet. Le Google Sheet « Inventaire Congélateur » reste la base de données ; le stock est toujours **recalculé** à partir de l'onglet Mouvements (rien à saisir à la main dans le Sheet).

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html`, `style.css`, `app.js` | L'appli (accueil, stock avec filtre « stock faible », mouvement, courses, dépenses et budget, synthèse, catégories, fiche aliment, historique) |
| `demo.js` | Mode démo (données fictives) tant que `config.js` est vide |
| `config.js` | Seul réglage : l'adresse du script Google (`API_URL`) |
| `apps-script/Code.gs` | L'API : lit et écrit dans le Sheet |
| `apps-script/appsscript.json` | Réglages du script (fuseau Paris, accès web) |
| `manifest.webmanifest`, `icon*.png/svg` | Installation sur l'écran d'accueil du téléphone (`icon-180.png` = icône iPhone, opaque ; `icon-192/512.png` = Android) |

Onglets du Google Sheet : `Emplacements`, `Categories`, `Aliments`, `Mouvements`, `Courses`, `Depenses` et `Unites` (créés automatiquement). Les colonnes `AutoCourses` et `SeuilCourses` d'Aliments sont ajoutées automatiquement.

**Tester sans rien brancher :** ouvrir `index.html` dans un navigateur → mode démo.

## Mise en ligne (à faire ensemble, étape par étape)

1. **Sheet / Apps Script** — compte propriétaire du Sheet : ouvrir le Sheet → Extensions → Apps Script → coller `Code.gs` et `appsscript.json` → lancer `verifierFeuilles` (il liste les colonnes reconnues).
2. Paramètres du projet → Propriétés du script → ajouter `ACCESS_CODE` = un code choisi par vous.
3. Déployer → Nouveau déploiement → Application Web → *Exécuter en tant que : moi* ; *Accès : tout le monde* → copier l'adresse en `/exec`.
4. **GitHub** — créer un dépôt, y mettre tous les fichiers sauf `apps-script/` (facultatif), coller l'adresse `/exec` dans `config.js`, activer Pages (Settings → Pages → branche `main`, dossier `/root`).
5. Sur chaque téléphone : ouvrir l'adresse Pages, saisir le code d'accès une fois, puis « Ajouter à l'écran d'accueil ».

**Mettre à jour une version plus tard :** coller le nouveau `Code.gs` dans Apps Script → Déployer → Gérer les déploiements → crayon → Version : *Nouvelle version* → Déployer (l'adresse `/exec` ne change pas). Côté site : remplacer les fichiers modifiés dans le dépôt GitHub (Add file → Upload files). Sur iPhone, supprimer puis rajouter le raccourci pour changer l'icône.

## Sécurité (honnêtement)

L'adresse de l'appli est publique, mais les données ne sortent qu'avec le **code d'accès**, qui n'est écrit nulle part dans le dépôt (il est saisi une fois sur chaque téléphone). Niveau de protection adapté à un inventaire de congélateur, pas à des données sensibles.

## Ce qui est fait par rapport à la liste AppSheet

- Contenu exact de chaque emplacement (nom + quantité), « Tout retirer » en un geste.
- Retrait impossible au-delà du stock disponible dans l'emplacement choisi.
- Nouvel aliment créé directement depuis le formulaire de mouvement, avec création d'une nouvelle catégorie si besoin.
- Écran « Emplacements » (menu Plus) : congélateur, frigo du garage, placards… ajouter, renommer (l'historique suit), supprimer si vide.
- Écran « Catégories » (menu Plus) : ajouter, renommer (les aliments suivent), supprimer si vide. Noms affichés avec accents.
- Écran « Unités » (menu Plus) : ajouter, renommer (les aliments suivent), supprimer si inutilisée.
- Ordre d'affichage des emplacements, catégories et unités : personnalisé (glisser-déposer) ou de A à Z / de Z à A.
- Fiche aliment : modifier le nom, la catégorie et l'unité (le nom suit dans l'historique et les courses) ; « Déplacer » d'un emplacement à un autre.
- Ajout automatique à la liste de courses quand le stock descend sous un seuil choisi par aliment.
- Après « Enregistrer », retour à la page d'où l'on vient ; emplacement « Coffre » proposé par défaut.
- Dépenses de courses ventilées Sara / Jordana, budget mensuel et synthèse par mois et par année.
- Alerte stock faible par aliment (interrupteur + seuil), pastille sur l'accueil.
- Liste de courses : ajout depuis un aliment, anti-doublon, cocher = disparaît (récupérable dans « déjà achetés »).
- Suppression d'un aliment seulement s'il est à zéro.

## Points à trancher

- **Unité** (portions, sachets, g…) : l'appli la lit dans la colonne `Unite` d'Aliments et la propose dans le formulaire. À valider avec Jordana.
- **Photos** : par défaut une icône par catégorie. Pour une vraie photo, ajouter une colonne `Photo` (lien d'image) dans Aliments.
- **Notifications** d'alerte : non incluses (nécessitent un déclencheur planifié Apps Script ou n8n) — étape suivante possible.


## Droits

© 2026 Sara Picaud — **Tous droits réservés.** Ce dépôt est visible publiquement pour l’hébergement (GitHub Pages) uniquement : aucune licence n’est accordée. Toute reproduction, copie, réutilisation ou redistribution, totale ou partielle, est interdite sans autorisation écrite. Voir [LICENSE](LICENSE). Contact : [formulaire](https://docs.google.com/forms/d/e/1FAIpQLSdG6pkvMpzdqr9CTvllLzUOKu6t7MiNjjyBHZeWPjTxmUlhZA/viewform).
