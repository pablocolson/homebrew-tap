# HelmChart

Application de navigation marine open source pour iOS, Android et tablettes.

## Fonctionnalités

- **Carte nautique** - OpenStreetMap + OpenSeaMap (balises, bouées, chenaux, ports)
- **Waypoints** - Créer, éditer, supprimer des points d'intérêt sur la carte
- **Gestion de bateaux** - Profils multiples avec dimensions, motorisation, consommation
- **Estimation carburant** - Calcul automatique distance/temps/carburant par route
- **Traces GPS** - Enregistrement de la position en arrière-plan avec historique
- **Cartes hors ligne** - Téléchargement de zones pour naviguer sans réseau
- **Routes** - Planification d'itinéraires entre waypoints avec legs détaillés

## Stack technique

- React Native / Expo (SDK 52)
- TypeScript
- Zustand (state management)
- expo-sqlite (persistance locale)
- expo-location (GPS + background tracking)
- react-native-maps (cartographie)

## Sources de cartes (gratuites)

| Couche | Source | URL |
|--------|--------|-----|
| Fond de carte | OpenStreetMap | `tile.openstreetmap.org` |
| Balisage maritime | OpenSeaMap | `tiles.openseamap.org` |

## Installation

```bash
npm install
npx expo start
```

Scanner le QR code avec Expo Go (iOS/Android) ou lancer sur simulateur :

```bash
npx expo start --ios
npx expo start --android
```

## Build production

```bash
npx eas build --platform ios
npx eas build --platform android
```

## Architecture

```
HelmChart/
├── App.tsx                     # Point d'entrée
├── src/
│   ├── components/
│   │   └── MapView.tsx         # Carte nautique (OSM + SeaMarks)
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Navigation par onglets
│   ├── screens/
│   │   ├── ChartScreen.tsx     # Écran carte + route
│   │   ├── WaypointsScreen.tsx # Gestion des waypoints
│   │   ├── BoatsScreen.tsx     # Gestion des bateaux
│   │   ├── TracksScreen.tsx    # Gestion des traces GPS
│   │   └── OfflineScreen.tsx   # Téléchargement cartes offline
│   ├── stores/
│   │   ├── waypointStore.ts    # Store Zustand + SQLite
│   │   ├── boatStore.ts        # Store bateaux
│   │   ├── routeStore.ts       # Store routes + estimation
│   │   └── trackStore.ts       # Store traces GPS
│   ├── types/
│   │   └── index.ts            # Types TypeScript
│   └── utils/
│       ├── navigation.ts       # Haversine, cap, formatage
│       ├── tiles.ts            # Gestion tuiles offline
│       └── theme.ts            # Couleurs et styles
```

## Licence

MIT
