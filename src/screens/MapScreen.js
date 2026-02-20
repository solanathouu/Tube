import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  TextInput,
  Keyboard,
  Dimensions,
  ActivityIndicator,
  Text,
  ScrollView
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline, Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import ReportMarker from '../components/ReportMarker';
import ReportModal from '../components/ReportModal';
import ReportDetailModal from '../components/ReportDetailModal';
import FilterBar from '../components/FilterBar';
import { findNearestStation, calculateRoute, calculateDistance } from '../utils/routeCalculator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SEARCH_BUTTON_SIZE = 48;
const SEARCH_BAR_WIDTH = SCREEN_WIDTH - 80; // Leave space for toggle filter button

// Style de carte sombre pour Google Maps
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

const MapScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { getFilteredReports, activeFilter, setFilter, voteReport, stations } = useApp();

  // Styles dynamiques basés sur le thème
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [route, setRoute] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [navigationMode, setNavigationMode] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeDetailsExpanded, setRouteDetailsExpanded] = useState(false);
  const [showDestinationMarker, setShowDestinationMarker] = useState(false);
  const [navigationStepsExpanded, setNavigationStepsExpanded] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0 = marche vers station, 1+ = étapes métro

  const mapRef = useRef(null);
  const locationSubscription = useRef(null);
  const searchInputRef = useRef(null);
  const searchWidth = useRef(new Animated.Value(SEARCH_BUTTON_SIZE)).current;
  const searchOpacity = useRef(new Animated.Value(0)).current;
  const debounceTimeout = useRef(null);
  const suggestionsCache = useRef({});
  const abortControllerRef = useRef(null);

  const filteredReports = getFilteredReports();

  // Demander la permission de localisation au démarrage et centrer la carte
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(newLocation);

        // Centrer la carte sur la position de l'utilisateur
        mapRef.current?.animateToRegion({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 1000);
      }
    })();
  }, []);

  // Suivi de position en temps réel pendant la navigation
  useEffect(() => {
    if (navigationMode && route) {
      // Démarrer le suivi de position
      (async () => {
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000, // Toutes les 3 secondes
            distanceInterval: 10, // Ou tous les 10 mètres
          },
          (location) => {
            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setUserLocation(newLocation);

            // Calculer l'étape actuelle en fonction de la position
            updateCurrentStep(newLocation);
          }
        );
      })();
    } else {
      // Arrêter le suivi quand on quitte la navigation
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    }

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [navigationMode, route]);

  // Fonction pour déterminer l'étape actuelle basée sur la position
  const updateCurrentStep = (currentLocation) => {
    if (!route) return;

    // Distance jusqu'à la première station (marche)
    const distToFirstStation = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      route.fromStation.coordinates.latitude,
      route.fromStation.coordinates.longitude
    );

    // Si on est à moins de 50m de la station de départ, on passe à l'étape métro
    if (distToFirstStation < 0.05 && currentStepIndex === 0) {
      setCurrentStepIndex(1);
      return;
    }

    // Vérifier pour chaque étape métro
    for (let i = 0; i < route.steps.length; i++) {
      const step = route.steps[i];
      // Trouver la dernière station de cette étape
      const lastCoord = step.coordinates?.[step.coordinates.length - 1];
      if (lastCoord) {
        const distToEnd = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          lastCoord.latitude,
          lastCoord.longitude
        );

        // Si on est à moins de 100m de la fin de l'étape, passer à la suivante
        if (distToEnd < 0.1 && currentStepIndex === i + 1) {
          setCurrentStepIndex(i + 2);
          return;
        }
      }
    }

    // Vérifier si on est proche de la destination finale
    const distToDestination = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      route.destinationCoords.latitude,
      route.destinationCoords.longitude
    );

    if (distToDestination < 0.05) {
      // Arrivé à destination !
      setCurrentStepIndex(route.steps.length + 2);
    }
  };

  const handleReportSuccess = () => {
    Alert.alert('Succès', 'Signalement créé ! +10 XP', [{ text: 'OK' }]);
  };

  const handleVote = async (reportId, voteType) => {
    const result = await voteReport(reportId, voteType);
    if (result.success) {
      Alert.alert('Merci !', 'Vote enregistré ! +5 XP');
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de voter');
    }
  };

  const handleMarkerPress = (report) => {
    // Ouvrir le modal de détails
    setSelectedReport(report);
  };

  const handleMyLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(newLocation);

      mapRef.current?.animateToRegion({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer votre position');
    }
  };

  const expandSearchBar = () => {
    setSearchExpanded(true);
    Animated.parallel([
      Animated.spring(searchWidth, {
        toValue: SEARCH_BAR_WIDTH,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(searchOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      searchInputRef.current?.focus();
    });
  };

  const collapseSearchBar = () => {
    Keyboard.dismiss();
    setSearchExpanded(false);
    setSearchQuery('');
    setRoute(null);
    setSuggestions([]);
    setShowSuggestions(false);
    Animated.parallel([
      Animated.spring(searchWidth, {
        toValue: SEARCH_BUTTON_SIZE,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(searchOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Fonction pour extraire l'arrondissement d'une adresse
  const extractArrondissement = (address) => {
    // Chercher le code postal parisien (75001 à 75020)
    const match = address.match(/750(\d{2})/);
    if (match) {
      const arrNum = parseInt(match[1], 10);
      if (arrNum >= 1 && arrNum <= 20) {
        return `${arrNum}${arrNum === 1 ? 'er' : 'e'}`;
      }
    }
    return null;
  };

  // Fonction pour rechercher des suggestions d'adresses via Nominatim (OpenStreetMap)
  const fetchAddressSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }

    if (!userLocation) return;

    // Vérifier le cache
    const cacheKey = query.toLowerCase().trim();
    if (suggestionsCache.current[cacheKey]) {
      setSuggestions(suggestionsCache.current[cacheKey]);
      setShowSuggestions(true);
      setSuggestionsLoading(false);
      return;
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setSuggestionsLoading(true);

    try {
      // Utiliser l'API Nominatim pour l'autocomplétion d'adresses à Paris
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query + ', Paris, France')}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `countrycodes=fr&` +
        `viewbox=2.22,48.90,2.47,48.81&` +
        `bounded=1`,
        {
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'TubeApp/1.0'
          },
          signal: abortControllerRef.current.signal
        }
      );

      const results = await response.json();

      if (results.length > 0) {
        // Pour chaque résultat, calculer quelle ligne de métro utiliser
        const suggestionsWithLines = results.map((result) => {
          const coords = {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon)
          };

          // Trouver la station la plus proche de la destination
          const nearestToStation = findNearestStation(
            coords.latitude,
            coords.longitude,
            stations
          );

          // Trouver la station la plus proche de l'utilisateur
          const nearestFromStation = findNearestStation(
            userLocation.latitude,
            userLocation.longitude,
            stations
          );

          // Calculer l'itinéraire pour déterminer les lignes à prendre
          const calculatedRoute = calculateRoute(
            nearestFromStation,
            nearestToStation,
            stations
          );

          // Récupérer toutes les lignes utilisées dans l'itinéraire
          const allLines = calculatedRoute.steps.map(step => step.line);

          // Extraire l'arrondissement du code postal
          const postalCode = result.address?.postcode || '';
          const arrondissement = extractArrondissement(postalCode);

          // Construire le nom d'affichage de l'adresse
          const displayName = result.address?.road ||
                             result.address?.pedestrian ||
                             result.address?.suburb ||
                             result.display_name.split(',')[0];

          return {
            address: displayName,
            fullDisplayName: result.display_name,
            arrondissement: arrondissement,
            coordinates: coords,
            nearestStation: nearestToStation,
            lines: allLines.length > 0 ? allLines : [nearestFromStation.line],
            distance: nearestToStation.distance,
          };
        });

        // Mettre en cache
        suggestionsCache.current[cacheKey] = suggestionsWithLines;

        setSuggestions(suggestionsWithLines);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      // Ignorer les erreurs d'annulation
      if (error.name === 'AbortError') return;
      console.error('Erreur recherche suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Gérer les changements de texte avec debounce
  const handleSearchQueryChange = (text) => {
    setSearchQuery(text);

    // Annuler le timeout précédent
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Afficher le loading immédiatement si on tape assez de caractères
    if (text.length >= 3) {
      setSuggestionsLoading(true);
      setShowSuggestions(true);
    }

    // Créer un nouveau timeout avec délai réduit
    debounceTimeout.current = setTimeout(() => {
      fetchAddressSuggestions(text);
    }, 150); // Réduit à 150ms pour plus de réactivité
  };

  // Sélectionner une suggestion
  const handleSelectSuggestion = (suggestion) => {
    // Construire l'adresse complète avec arrondissement
    const fullAddress = suggestion.arrondissement
      ? `${suggestion.address} (${suggestion.arrondissement} arr.)`
      : suggestion.address;

    setSearchQuery(fullAddress);
    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();

    // Lancer la recherche immédiatement avec les coordonnées
    handleSearchWithCoords(suggestion.coordinates, fullAddress);
  };

  // Fonction pour rechercher avec des coordonnées déjà connues
  const handleSearchWithCoords = async (destCoords, addressName) => {
    if (!userLocation) {
      Alert.alert('Erreur', 'Position actuelle non disponible');
      return;
    }

    setSearchLoading(true);
    setShowSuggestions(false);
    Keyboard.dismiss();

    try {
      // Trouver la station la plus proche de la position actuelle
      const nearestFromStation = findNearestStation(
        userLocation.latitude,
        userLocation.longitude,
        stations
      );

      // Trouver la station la plus proche de la destination
      const nearestToStation = findNearestStation(
        destCoords.latitude,
        destCoords.longitude,
        stations
      );

      // Calculer l'itinéraire
      const calculatedRoute = calculateRoute(
        nearestFromStation,
        nearestToStation,
        stations
      );

      // Sauvegarder les coordonnées de destination
      setDestinationCoords(destCoords);

      // Ajouter les infos de distance à pied
      setRoute({
        ...calculatedRoute,
        walkToStation: Math.round(nearestFromStation.distance * 1000), // en mètres
        walkFromStation: Math.round(nearestToStation.distance * 1000), // en mètres
        fromStation: nearestFromStation,
        toStation: nearestToStation,
        destinationAddress: addressName,
        destinationCoords: destCoords
      });

      // Afficher le marqueur de destination et zoomer dessus
      setShowDestinationMarker(true);
      setRouteDetailsExpanded(false); // Commencer avec le mode compact

      // Zoomer sur la destination
      mapRef.current?.animateToRegion({
        latitude: destCoords.latitude,
        longitude: destCoords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);

      setSearchLoading(false);
    } catch (error) {
      console.error('Erreur recherche:', error);
      Alert.alert('Erreur', 'Impossible de calculer l\'itinéraire');
      setSearchLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse ou station');
      return;
    }

    if (!userLocation) {
      Alert.alert('Erreur', 'Position actuelle non disponible');
      return;
    }

    setSearchLoading(true);
    setShowSuggestions(false);
    Keyboard.dismiss();

    try {
      // Geocoder l'adresse de destination
      const geocoded = await Location.geocodeAsync(searchQuery + ', Paris, France');

      if (geocoded.length === 0) {
        Alert.alert('Erreur', 'Adresse non trouvée. Essayez avec une adresse plus précise.');
        setSearchLoading(false);
        return;
      }

      const destCoords = geocoded[0];
      await handleSearchWithCoords(destCoords, searchQuery);
    } catch (error) {
      console.error('Erreur recherche:', error);
      Alert.alert('Erreur', 'Impossible de calculer l\'itinéraire');
      setSearchLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins}`;
    }
    return `${mins} min`;
  };

  // Fonction pour démarrer la navigation
  const startNavigation = () => {
    if (!route || !userLocation) return;

    setNavigationMode(true);
    setCurrentStepIndex(0); // Réinitialiser la progression

    // Fermer la barre de recherche et les suggestions
    setSearchExpanded(false);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setShowDestinationMarker(false);
    setRouteDetailsExpanded(false);

    // Réinitialiser l'animation de la barre de recherche
    searchWidth.setValue(SEARCH_BUTTON_SIZE);
    searchOpacity.setValue(0);

    // Zoom sur l'ensemble du trajet
    const allCoords = [
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: route.fromStation.coordinates.latitude, longitude: route.fromStation.coordinates.longitude },
      { latitude: route.toStation.coordinates.latitude, longitude: route.toStation.coordinates.longitude },
      { latitude: route.destinationCoords.latitude, longitude: route.destinationCoords.longitude },
    ];

    mapRef.current?.fitToCoordinates(allCoords, {
      edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
      animated: true,
    });
  };

  // Fonction pour arrêter la navigation
  const stopNavigation = () => {
    setNavigationMode(false);
    setRoute(null);
    setDestinationCoords(null);
    setNavigationStepsExpanded(false);
    setCurrentStepIndex(0);
  };

  // Trouver les signalements sur les lignes du trajet
  const getAlertsOnRoute = () => {
    if (!route || !navigationMode) return [];

    const routeLines = route.steps.map(step => step.line);
    return filteredReports.filter(report => {
      // Vérifier si le signalement est sur une des lignes du trajet
      const reportStation = stations.find(s => s.name === report.station);
      if (reportStation) {
        return routeLines.includes(reportStation.line);
      }
      return false;
    });
  };

  const alertsOnRoute = getAlertsOnRoute();

  // Fonction pour obtenir la couleur d'une ligne de métro
  const getLineColor = (line) => {
    const colors = {
      '1': '#FFCD00',
      '2': '#003CA6',
      '3': '#837902',
      '3bis': '#6EC4E8',
      '4': '#BE418D',
      '5': '#FF7E2E',
      '6': '#6ECA97',
      '7': '#FA9ABA',
      '7bis': '#6ECA97',
      '8': '#E19BDF',
      '9': '#B6BD00',
      '10': '#C9910D',
      '11': '#704B1C',
      '12': '#007852',
      '13': '#6EC4E8',
      '14': '#62259D',
    };
    return colors[line] || '#A0006E';
  };

  return (
    <View style={styles.container}>
      {/* Carte */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation?.latitude || 48.8566,
          longitude: userLocation?.longitude || 2.3522,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        customMapStyle={isDark ? darkMapStyle : []}
      >
        {filteredReports.map(report => (
          <ReportMarker
            key={report.id}
            report={report}
            onPress={() => handleMarkerPress(report)}
          />
        ))}

        {/* Marqueur de destination (avant navigation) */}
        {showDestinationMarker && route && !navigationMode && (
          <Marker
            coordinate={{
              latitude: route.destinationCoords.latitude,
              longitude: route.destinationCoords.longitude,
            }}
            title="Destination"
            description={route.destinationAddress}
          >
            <View style={styles.destinationPinMarker}>
              <MaterialCommunityIcons name="map-marker" size={36} color="#E53935" />
            </View>
          </Marker>
        )}

        {/* Mode navigation - Polylines et Markers */}
        {navigationMode && route && userLocation && (
          <>
            {/* Ligne pointillée - Marche vers la station de départ */}
            <Polyline
              coordinates={[
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: route.fromStation.coordinates.latitude, longitude: route.fromStation.coordinates.longitude },
              ]}
              strokeColor="#2196F3"
              strokeWidth={4}
              lineDashPattern={[10, 5]}
            />

            {/* Lignes pleines - Trajet en métro par segment */}
            {route.steps.map((step, stepIndex) => {
              // Vérifier que les coordonnées existent et sont valides
              if (!step.coordinates || step.coordinates.length < 2) {
                // Fallback: ligne directe entre les stations si pas de coordonnées
                return (
                  <Polyline
                    key={`metro-${stepIndex}`}
                    coordinates={[
                      { latitude: route.fromStation.coordinates.latitude, longitude: route.fromStation.coordinates.longitude },
                      { latitude: route.toStation.coordinates.latitude, longitude: route.toStation.coordinates.longitude },
                    ]}
                    strokeColor={getLineColor(step.line)}
                    strokeWidth={6}
                  />
                );
              }

              return (
                <Polyline
                  key={`metro-${stepIndex}`}
                  coordinates={step.coordinates.map(coord => ({
                    latitude: coord.latitude,
                    longitude: coord.longitude,
                  }))}
                  strokeColor={getLineColor(step.line)}
                  strokeWidth={6}
                />
              );
            })}

            {/* Ligne pointillée - Marche vers la destination */}
            <Polyline
              coordinates={[
                { latitude: route.toStation.coordinates.latitude, longitude: route.toStation.coordinates.longitude },
                { latitude: route.destinationCoords.latitude, longitude: route.destinationCoords.longitude },
              ]}
              strokeColor="#2196F3"
              strokeWidth={4}
              lineDashPattern={[10, 5]}
            />

            {/* Marker station d'entrée */}
            <Marker
              coordinate={{
                latitude: route.fromStation.coordinates.latitude,
                longitude: route.fromStation.coordinates.longitude,
              }}
              title={`Entrée: ${route.fromStation.name}`}
              description={`Ligne ${route.steps[0]?.line || ''}`}
            >
              <View style={styles.stationMarker}>
                <MaterialCommunityIcons name="subway-variant" size={20} color="#FFFFFF" />
              </View>
            </Marker>

            {/* Marker station de sortie */}
            <Marker
              coordinate={{
                latitude: route.toStation.coordinates.latitude,
                longitude: route.toStation.coordinates.longitude,
              }}
              title={`Sortie: ${route.toStation.name}`}
              description={`Ligne ${route.steps[route.steps.length - 1]?.line || ''}`}
            >
              <View style={styles.stationMarker}>
                <MaterialCommunityIcons name="exit-run" size={20} color="#FFFFFF" />
              </View>
            </Marker>

            {/* Marker destination */}
            <Marker
              coordinate={{
                latitude: route.destinationCoords.latitude,
                longitude: route.destinationCoords.longitude,
              }}
              title="Destination"
              description={route.destinationAddress}
            >
              <View style={styles.destinationMarker}>
                <MaterialCommunityIcons name="flag-checkered" size={20} color="#FFFFFF" />
              </View>
            </Marker>

            {/* Markers pour les alertes sur le trajet */}
            {alertsOnRoute.map((alert, index) => (
              <Marker
                key={`alert-${index}`}
                coordinate={{
                  latitude: alert.coordinates.latitude,
                  longitude: alert.coordinates.longitude,
                }}
                title={alert.type === 'controller' ? 'Personnel RATP' : alert.type === 'incident' ? 'Incident' : 'Panne'}
                description={alert.station}
              >
                <View style={[styles.alertMarker, {
                  backgroundColor: alert.type === 'controller' ? '#FF9800' : '#F44336'
                }]}>
                  <MaterialCommunityIcons
                    name={alert.type === 'controller' ? 'account-alert' : 'alert-circle'}
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
              </Marker>
            ))}
          </>
        )}
      </MapView>

      {/* Barre de filtres */}
      {showFilters && (
        <View style={styles.filterBarContainer}>
          <FilterBar activeFilter={activeFilter} onFilterChange={setFilter} />
        </View>
      )}

      {/* Barre de recherche animée */}
      <Animated.View style={[styles.searchContainer, { width: searchWidth }]}>
        {!searchExpanded ? (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={expandSearchBar}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.searchBarExpanded}>
            <TouchableOpacity onPress={collapseSearchBar} style={styles.searchIconButton}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
            <Animated.View style={{ flex: 1, opacity: searchOpacity }}>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Adresse ou station..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearchQueryChange}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCapitalize="words"
              />
            </Animated.View>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
            {searchLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={styles.searchActionButton}
              />
            ) : (
              <TouchableOpacity
                onPress={handleSearch}
                style={styles.searchActionButton}
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>

      {/* Liste des suggestions d'adresses */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {suggestionsLoading && suggestions.length === 0 ? (
            <View style={styles.suggestionsLoadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.suggestionsLoadingText}>Recherche...</Text>
            </View>
          ) : suggestions.length > 0 ? (
          <ScrollView
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(suggestion)}
              >
                {/* Badges des lignes qui se chevauchent */}
                <View style={[styles.linesContainer, { width: 28 + (suggestion.lines.length - 1) * 18 }]}>
                  {suggestion.lines.map((line, lineIndex) => (
                    <View
                      key={lineIndex}
                      style={[
                        styles.lineIndicator,
                        {
                          backgroundColor: getLineColor(line),
                          left: lineIndex * 18,
                          zIndex: suggestion.lines.length - lineIndex,
                        },
                      ]}
                    >
                      <Text style={styles.lineIndicatorText}>{line}</Text>
                    </View>
                  ))}
                </View>

                {/* Informations de l'adresse */}
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionAddress} numberOfLines={1}>
                    {suggestion.address}
                    {suggestion.arrondissement && (
                      <Text style={styles.suggestionArrondissement}>
                        {' '}({suggestion.arrondissement} arr.)
                      </Text>
                    )}
                  </Text>
                  <Text style={styles.suggestionStation} numberOfLines={1}>
                    Station: {suggestion.nearestStation.name}
                  </Text>
                </View>

                {/* Icône flèche */}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          ) : null}
        </View>
      )}

      {/* Bouton toggle filtres */}
      <TouchableOpacity
        style={styles.toggleFilterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <MaterialCommunityIcons
          name={showFilters ? 'filter' : 'filter-outline'}
          size={24}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {/* Bouton Ma position */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={handleMyLocation}
      >
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={24}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {/* Bouton Partager trajet */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => navigation.navigate('LiveShare')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="share-variant" size={24} color={theme.colors.primary} />
      </TouchableOpacity>

      {/* Bouton Urgence */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => navigation.navigate('EmergencyConfirm')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="alert-octagon" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Bouton FAB Signaler */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setIsReportModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={32} color={theme.colors.surface} />
      </TouchableOpacity>

      {/* Résultat de l'itinéraire - Mode compact (bouton) */}
      {route && !navigationMode && !routeDetailsExpanded && (
        <TouchableOpacity
          style={styles.routeCompactButton}
          onPress={() => setRouteDetailsExpanded(true)}
          activeOpacity={0.9}
        >
          <View style={styles.routeCompactContent}>
            <MaterialCommunityIcons
              name="subway-variant"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.routeCompactDuration}>
              {formatDuration(route.estimatedTime + 10)}
            </Text>
            <View style={styles.routeCompactLines}>
              {route.steps.slice(0, 3).map((step, index) => (
                <View
                  key={index}
                  style={[
                    styles.routeCompactLineBadge,
                    { backgroundColor: getLineColor(step.line) },
                  ]}
                >
                  <Text style={styles.routeCompactLineText}>{step.line}</Text>
                </View>
              ))}
            </View>
            <MaterialCommunityIcons
              name="chevron-up"
              size={24}
              color={theme.colors.textSecondary}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setRoute(null);
              setShowDestinationMarker(false);
              setRouteDetailsExpanded(false);
            }}
            style={styles.routeCompactClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Résultat de l'itinéraire - Mode étendu */}
      {route && !navigationMode && routeDetailsExpanded && (
        <View style={styles.routeResultContainer}>
          <ScrollView
            style={styles.routeScrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <MaterialCommunityIcons
                  name="subway-variant"
                  size={32}
                  color={theme.colors.primary}
                />
                <View style={styles.routeSummary}>
                  <Text style={styles.routeDuration}>
                    {formatDuration(route.estimatedTime + 10)}
                  </Text>
                  <Text style={styles.routeSubtitle}>
                    {route.transfers === 0
                      ? 'Direct'
                      : `${route.transfers} correspondance${route.transfers > 1 ? 's' : ''}`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setRouteDetailsExpanded(false)}
                  style={styles.closeRouteButton}
                >
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Marche jusqu'à la station */}
              <View style={styles.step}>
                <View style={styles.stepIcon}>
                  <MaterialCommunityIcons
                    name="walk"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>
                    Marcher jusqu'à {route.fromStation.name}
                  </Text>
                  <Text style={styles.stepSubtitle}>
                    {route.walkToStation}m • ~{Math.ceil(route.walkToStation / 80)} min
                  </Text>
                </View>
              </View>

              {/* Étapes en métro */}
              {route.steps.map((step, index) => (
                <View key={index} style={styles.step}>
                  <View
                    style={[
                      styles.stepIcon,
                      { backgroundColor: getLineColor(step.line) },
                    ]}
                  >
                    <Text style={styles.lineNumber}>{step.line}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Ligne {step.line}</Text>
                    <Text style={styles.stepSubtitle}>
                      De {step.from} à {step.to}
                    </Text>
                    <Text style={styles.stepSubtitle}>
                      {step.stations} station{step.stations > 1 ? 's' : ''} •{' '}
                      {step.stations * 2} min
                    </Text>
                  </View>
                </View>
              ))}

              {/* Marche depuis la station */}
              <View style={[styles.step, { marginBottom: 0 }]}>
                <View style={styles.stepIcon}>
                  <MaterialCommunityIcons
                    name="walk"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Marcher jusqu'à destination</Text>
                  <Text style={styles.stepSubtitle}>
                    {route.walkFromStation}m • ~{Math.ceil(route.walkFromStation / 80)}{' '}
                    min
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bouton Y aller - Décroché en bas */}
          <TouchableOpacity
            style={styles.goButton}
            onPress={startNavigation}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="navigation" size={24} color="#FFFFFF" />
            <Text style={styles.goButtonText}>Y aller</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mode Navigation - Carte compacte en bas */}
      {navigationMode && route && (
        <View style={[styles.navigationCard, navigationStepsExpanded && styles.navigationCardExpanded]}>
          {/* Alertes sur le trajet */}
          {alertsOnRoute.length > 0 && (
            <View style={styles.alertsBanner}>
              <MaterialCommunityIcons name="alert" size={18} color="#FF9800" />
              <Text style={styles.alertsBannerText}>
                {alertsOnRoute.length} alerte{alertsOnRoute.length > 1 ? 's' : ''} sur votre trajet
              </Text>
            </View>
          )}

          <View style={styles.navigationHeader}>
            <View style={styles.navigationInfo}>
              <Text style={styles.navigationDuration}>
                {formatDuration(route.estimatedTime + 10)}
              </Text>
              <Text style={styles.navigationDestination} numberOfLines={1}>
                {route.destinationAddress}
              </Text>
            </View>

            {/* Badges des lignes */}
            <View style={styles.navigationLines}>
              {route.steps.slice(0, 3).map((step, index) => (
                <View
                  key={index}
                  style={[
                    styles.navigationLineBadge,
                    { backgroundColor: getLineColor(step.line) },
                  ]}
                >
                  <Text style={styles.navigationLineText}>{step.line}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={stopNavigation}
              style={styles.stopNavigationButton}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Prochaine étape avec chevron - Affichage dynamique selon la progression */}
          <TouchableOpacity
            style={styles.nextStepContainer}
            onPress={() => setNavigationStepsExpanded(!navigationStepsExpanded)}
            activeOpacity={0.7}
          >
            {currentStepIndex === 0 ? (
              // Étape 0: Marche vers la station
              <>
                <MaterialCommunityIcons name="walk" size={20} color={theme.colors.primary} />
                <Text style={styles.nextStepText}>
                  Marcher {route.walkToStation}m vers {route.fromStation.name}
                </Text>
              </>
            ) : currentStepIndex <= route.steps.length ? (
              // Étapes métro
              <>
                <View style={[styles.currentStepBadge, { backgroundColor: getLineColor(route.steps[currentStepIndex - 1]?.line) }]}>
                  <Text style={styles.currentStepBadgeText}>{route.steps[currentStepIndex - 1]?.line}</Text>
                </View>
                <Text style={styles.nextStepText}>
                  Ligne {route.steps[currentStepIndex - 1]?.line} → {route.steps[currentStepIndex - 1]?.to}
                </Text>
              </>
            ) : (
              // Dernière étape: Marche vers destination
              <>
                <MaterialCommunityIcons name="flag-checkered" size={20} color="#4CAF50" />
                <Text style={styles.nextStepText}>
                  Marcher {route.walkFromStation}m vers votre destination
                </Text>
              </>
            )}
            <MaterialCommunityIcons
              name={navigationStepsExpanded ? 'chevron-down' : 'chevron-up'}
              size={24}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Vue étendue avec les étapes restantes */}
          {navigationStepsExpanded && (
            <ScrollView style={styles.navigationStepsContainer} showsVerticalScrollIndicator={false}>
              {/* Marche jusqu'à la station - Masquer si complétée */}
              {currentStepIndex === 0 && (
                <View style={styles.navigationStep}>
                  <View style={[styles.navigationStepIcon, styles.navigationStepIconActive]}>
                    <MaterialCommunityIcons name="walk" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.navigationStepLine} />
                  <View style={styles.navigationStepContent}>
                    <Text style={styles.navigationStepTitle}>
                      Marcher jusqu'à {route.fromStation.name}
                    </Text>
                    <Text style={styles.navigationStepSubtitle}>
                      {route.walkToStation}m • ~{Math.ceil(route.walkToStation / 80)} min
                    </Text>
                  </View>
                </View>
              )}

              {/* Étapes en métro - Afficher seulement les non complétées */}
              {route.steps.map((step, index) => {
                // index + 1 car l'étape 0 est la marche initiale
                const stepIndex = index + 1;
                if (stepIndex < currentStepIndex) return null; // Masquer les étapes complétées

                const isCurrentStep = stepIndex === currentStepIndex;

                return (
                  <View key={index} style={styles.navigationStep}>
                    <View
                      style={[
                        styles.navigationStepIcon,
                        { backgroundColor: getLineColor(step.line) },
                        isCurrentStep && styles.navigationStepIconActive,
                      ]}
                    >
                      <Text style={styles.navigationStepLineNumber}>{step.line}</Text>
                    </View>
                    {(index < route.steps.length - 1 || route.walkFromStation > 0) && stepIndex >= currentStepIndex ? (
                      <View style={[styles.navigationStepLine, { backgroundColor: getLineColor(step.line) }]} />
                    ) : null}
                    <View style={styles.navigationStepContent}>
                      <Text style={[styles.navigationStepTitle, isCurrentStep && styles.navigationStepTitleActive]}>
                        Ligne {step.line}
                      </Text>
                      <Text style={styles.navigationStepSubtitle}>
                        De {step.from} à {step.to}
                      </Text>
                      <Text style={styles.navigationStepSubtitle}>
                        {step.stations} station{step.stations > 1 ? 's' : ''} • {step.stations * 2} min
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* Marche vers destination - Toujours afficher sauf si arrivé */}
              {currentStepIndex <= route.steps.length + 1 && (
                <View style={[styles.navigationStep, { marginBottom: theme.spacing.sm }]}>
                  <View style={[
                    styles.navigationStepIcon,
                    currentStepIndex === route.steps.length + 1 && styles.navigationStepIconActive,
                    { backgroundColor: currentStepIndex === route.steps.length + 1 ? '#4CAF50' : theme.colors.background }
                  ]}>
                    <MaterialCommunityIcons
                      name="flag-checkered"
                      size={18}
                      color={currentStepIndex === route.steps.length + 1 ? '#FFFFFF' : '#4CAF50'}
                    />
                  </View>
                  <View style={styles.navigationStepContent}>
                    <Text style={[
                      styles.navigationStepTitle,
                      currentStepIndex === route.steps.length + 1 && styles.navigationStepTitleActive
                    ]}>
                      Arrivée à destination
                    </Text>
                    <Text style={styles.navigationStepSubtitle}>
                      {route.walkFromStation}m • ~{Math.ceil(route.walkFromStation / 80)} min de marche
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* Modal de signalement */}
      <ReportModal
        visible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        onSuccess={handleReportSuccess}
      />

      {/* Modal de détails du signalement */}
      <ReportDetailModal
        visible={!!selectedReport}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </View>
  );
};

// Styles dynamiques basés sur le thème
const getStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    flex: 1,
  },
  filterBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.md,
    height: SEARCH_BUTTON_SIZE,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    elevation: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  searchButton: {
    width: SEARCH_BUTTON_SIZE,
    height: SEARCH_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarExpanded: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  searchIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 0,
    paddingHorizontal: theme.spacing.sm,
  },
  clearButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xs,
  },
  searchActionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 120,
    left: theme.spacing.md,
    right: theme.spacing.md,
    maxHeight: 300,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    elevation: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  suggestionsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  suggestionsLoadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  linesContainer: {
    height: 28,
    marginRight: theme.spacing.md,
    position: 'relative',
  },
  lineIndicator: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  lineIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  suggestionContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  suggestionAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  suggestionArrondissement: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  suggestionStation: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  toggleFilterButton: {
    position: 'absolute',
    top: 60,
    right: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  myLocationButton: {
    position: 'absolute',
    top: 120,
    right: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabButton: {
    position: 'absolute',
    bottom: 90,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  shareButton: {
    position: 'absolute',
    bottom: 170,
    left: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  emergencyButton: {
    position: 'absolute',
    bottom: 90,
    left: theme.spacing.md,
    backgroundColor: '#D32F2F',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  destinationPinMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCompactButton: {
    position: 'absolute',
    bottom: 90,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  routeCompactContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeCompactDuration: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  routeCompactLines: {
    flexDirection: 'row',
    flex: 1,
  },
  routeCompactLineBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  routeCompactLineText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  routeCompactClose: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  routeResultContainer: {
    position: 'absolute',
    bottom: 90,
    left: theme.spacing.md,
    right: theme.spacing.md,
    maxHeight: '50%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    elevation: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  routeScrollView: {
    maxHeight: '100%',
  },
  routeCard: {
    padding: theme.spacing.md,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  routeSummary: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  routeDuration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  routeSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeRouteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    marginRight: theme.spacing.md,
  },
  lineNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  goButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  stationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  destinationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  alertMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  navigationCard: {
    position: 'absolute',
    bottom: 90,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    elevation: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  alertsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.dark ? '#3E2723' : '#FFF3E0',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  alertsBannerText: {
    marginLeft: theme.spacing.sm,
    color: theme.dark ? '#FFB74D' : '#E65100',
    fontSize: 14,
    fontWeight: '600',
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  navigationInfo: {
    flex: 1,
  },
  navigationDuration: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  navigationDestination: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  navigationLines: {
    flexDirection: 'row',
    marginRight: theme.spacing.md,
  },
  navigationLineBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  navigationLineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stopNavigationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  nextStepText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  navigationCardExpanded: {
    maxHeight: '60%',
  },
  navigationStepsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    maxHeight: 300,
  },
  navigationStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  navigationStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    zIndex: 2,
  },
  navigationStepLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: 40,
    backgroundColor: theme.colors.border,
    zIndex: 1,
  },
  navigationStepContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
    paddingTop: 2,
  },
  navigationStepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  navigationStepSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  navigationStepLineNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  navigationStepIconActive: {
    backgroundColor: theme.colors.primary,
    transform: [{ scale: 1.1 }],
  },
  navigationStepTitleActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  currentStepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentStepBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MapScreen;
