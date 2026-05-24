# HelmChart - Guide de développement

## Présentation

Application de navigation marine open source (type Navionics) pour iOS, Android et tablettes.
Cartes nautiques gratuites (OpenStreetMap + OpenSeaMap), aucune clé API requise.

## Stack technique

- **Framework** : React Native / Expo SDK 52 (managed workflow)
- **Langage** : TypeScript (strict mode)
- **State management** : Zustand
- **Base de données** : expo-sqlite (SQLite local, fichier `helmchart.db`)
- **Cartographie** : react-native-maps avec UrlTile custom (OSM + OpenSeaMap)
- **GPS** : expo-location + expo-task-manager (background tracking)
- **Navigation** : React Navigation (bottom tabs)
- **Icônes** : @expo/vector-icons (Ionicons)

## Commandes

```bash
npm install          # Installer les dépendances
npx expo start       # Lancer le dev server
npx expo start --ios # Simulateur iOS
npx expo start --android # Émulateur Android
npx eas build --platform ios     # Build production iOS
npx eas build --platform android # Build production Android
```

## Architecture

```
App.tsx                          # Point d'entrée, init des stores
src/
├── components/
│   └── MapView.tsx              # Carte nautique (tuiles OSM + SeaMark, markers, polylines, traces)
├── navigation/
│   └── AppNavigator.tsx         # 5 onglets : Carte, Waypoints, Traces, Bateaux, Hors ligne
├── screens/
│   ├── ChartScreen.tsx          # Carte + panneau route (distance/temps/carburant)
│   ├── WaypointsScreen.tsx      # CRUD waypoints, choix icône/couleur, modal édition
│   ├── BoatsScreen.tsx          # CRUD bateaux, specs complètes, sélection bateau actif
│   ├── TracksScreen.tsx         # Liste traces GPS, bouton REC, stats par trace
│   └── OfflineScreen.tsx        # Téléchargement tuiles par région prédéfinie
├── stores/
│   ├── waypointStore.ts         # Zustand + SQLite, table `waypoints`
│   ├── boatStore.ts             # Zustand + SQLite, table `boats`
│   ├── routeStore.ts            # Zustand (in-memory), calcul d'estimation
│   └── trackStore.ts            # Zustand + SQLite, tables `tracks` + `track_points`, TaskManager
├── types/
│   └── index.ts                 # Interfaces : Coordinates, Waypoint, Boat, Route, RouteEstimation, RouteLeg, TileRegion
└── utils/
    ├── navigation.ts            # Haversine (km/NM), cap, estimation carburant, formatage coords/distance/durée
    ├── tiles.ts                 # Téléchargement/cache tuiles, calcul grille, gestion stockage offline
    └── theme.ts                 # Palette couleurs (thème sombre marine), spacing, fontSize, borderRadius
```

## Sources de cartes

| Couche | URL | Licence |
|--------|-----|--------|
| Fond de carte | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | ODbL |
| Balisage maritime | `https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png` | CC-BY-SA |

## Modèle de données (SQLite)

### Table `waypoints`
`id TEXT PK, name TEXT, latitude REAL, longitude REAL, icon TEXT, color TEXT, notes TEXT, createdAt INTEGER`

### Table `boats`
`id TEXT PK, name TEXT, type TEXT, lengthMeters REAL, beamMeters REAL, draftMeters REAL, engineType TEXT, enginePowerHp REAL, fuelTankLiters REAL, cruisingSpeedKnots REAL, maxSpeedKnots REAL, consumptionLitersPerHour REAL, photo TEXT, isDefault INTEGER`

### Table `tracks`
`id TEXT PK, name TEXT, color TEXT, startedAt INTEGER, endedAt INTEGER, pointCount INTEGER, distanceNm REAL, isRecording INTEGER`

### Table `track_points`
`id INTEGER PK AUTOINCREMENT, trackId TEXT FK, latitude REAL, longitude REAL, timestamp INTEGER, speed REAL, heading REAL`

## Conventions

- Interface en français (labels, messages, alertes)
- Unités marines : distances en NM (milles nautiques), vitesse en noeuds (kn), cap en degrés
- Coordonnées affichées en DMS (degrés/minutes/secondes) avec N/S/E/W
- Thème sombre marine (#0A1628 background, #1B6EF3 primary, #FF6B35 accent)
- Stores Zustand avec persistance SQLite (pas d'AsyncStorage)
- Chaque store a sa propre connexion `getDb()` avec lazy init + migration CREATE TABLE IF NOT EXISTS

## Fonctionnalités implémentées

- [x] Carte nautique OSM + OpenSeaMap avec toggle balisage
- [x] Position GPS + compas + centrage
- [x] Création waypoint par appui long sur la carte
- [x] CRUD waypoints (nom, icône, couleur, notes, coordonnées)
- [x] CRUD bateaux (type, dimensions, moteur, conso, réservoir)
- [x] Sélection du bateau actif pour les estimations
- [x] Construction de route (ajout waypoints depuis carte ou liste)
- [x] Estimation route : distance, durée, carburant, % réservoir, legs détaillés
- [x] Enregistrement traces GPS en arrière-plan (TaskManager)
- [x] Affichage trace active sur la carte en temps réel
- [x] Gestion des traces (liste, stats, renommer, supprimer)
- [x] Téléchargement cartes offline par région (6 régions prédéfinies)
- [x] Indicateur de progression téléchargement + gestion stockage

## Fonctionnalités à développer

- [ ] Export/import waypoints et traces (GPX, KML)
- [ ] Affichage des traces passées sur la carte (sélection depuis la liste)
- [ ] Téléchargement offline de zone personnalisée (sélection sur la carte)
- [ ] Météo marine (via API open source type Open-Meteo)
- [ ] Marées (données SHOM ou équivalent open source)
- [ ] Alarme de mouillage (alerte si le bateau dérive hors d'un rayon)
- [ ] Partage de waypoints/traces entre utilisateurs
- [ ] Mode nuit renforcé pour navigation nocturne
- [ ] Widget Apple Watch (position, cap, vitesse, waypoint suivant)
- [ ] AIS (réception des positions des bateaux environnants)
- [ ] Calcul de route avec courants et vent
- [ ] Multi-langue (EN, ES, IT, DE)
