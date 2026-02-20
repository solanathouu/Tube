/**
 * Calculateur d'itinéraire métro
 */

/**
 * Calcule la distance entre deux coordonnées (formule de Haversine)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // en km
};

/**
 * Trouve la station la plus proche d'une position
 */
export const findNearestStation = (userLat, userLon, stations) => {
  let nearestStation = null;
  let minDistance = Infinity;

  stations.forEach(station => {
    const distance = calculateDistance(
      userLat,
      userLon,
      station.coordinates.latitude,
      station.coordinates.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = { ...station, distance };
    }
  });

  return nearestStation;
};

/**
 * Estime le temps de trajet en métro
 * - Temps moyen entre stations : 2 minutes
 * - Temps de correspondance : 5 minutes
 */
export const estimateTravelTime = (numberOfStations, numberOfTransfers) => {
  const stationTime = numberOfStations * 2; // 2 min par station
  const transferTime = numberOfTransfers * 5; // 5 min par correspondance
  return stationTime + transferTime;
};

/**
 * Trouve toutes les correspondances possibles entre deux lignes
 */
const findTransferStations = (allStations) => {
  const transfers = {};

  // Grouper les stations par nom
  const stationsByName = {};
  allStations.forEach(station => {
    if (!stationsByName[station.name]) {
      stationsByName[station.name] = [];
    }
    stationsByName[station.name].push(station);
  });

  // Trouver les correspondances (stations avec le même nom sur plusieurs lignes)
  Object.keys(stationsByName).forEach(name => {
    const stationsAtLocation = stationsByName[name];
    if (stationsAtLocation.length > 1) {
      stationsAtLocation.forEach(s1 => {
        stationsAtLocation.forEach(s2 => {
          if (s1.line !== s2.line) {
            const key = `${s1.line}-${s2.line}`;
            if (!transfers[key]) {
              transfers[key] = [];
            }
            transfers[key].push({ name, fromStation: s1, toStation: s2 });
          }
        });
      });
    }
  });

  return transfers;
};

/**
 * Récupère les stations intermédiaires entre deux stations sur la même ligne
 */
const getIntermediateStations = (fromStation, toStation, lineStations) => {
  const fromIndex = lineStations.findIndex(s => s.id === fromStation.id);
  const toIndex = lineStations.findIndex(s => s.id === toStation.id);

  if (fromIndex === -1 || toIndex === -1) {
    return [fromStation, toStation];
  }

  const startIdx = Math.min(fromIndex, toIndex);
  const endIdx = Math.max(fromIndex, toIndex);
  const stations = lineStations.slice(startIdx, endIdx + 1);

  if (fromIndex > toIndex) {
    stations.reverse();
  }

  return stations;
};

/**
 * Calcule un itinéraire simple (direct ou avec 1-2 correspondances)
 */
export const calculateRoute = (fromStation, toStation, allStations) => {
  // Convertir les lignes en string pour la comparaison
  const fromLine = String(fromStation.line);
  const toLine = String(toStation.line);

  // Si même ligne : itinéraire direct
  if (fromLine === toLine) {
    const sameLineStations = allStations.filter(s => String(s.line) === fromLine);
    const intermediateStations = getIntermediateStations(fromStation, toStation, sameLineStations);
    const numberOfStations = Math.max(1, intermediateStations.length - 1);

    return {
      type: 'direct',
      steps: [{
        line: fromLine,
        from: fromStation.name,
        to: toStation.name,
        stations: numberOfStations,
        coordinates: intermediateStations.map(s => s.coordinates)
      }],
      totalStations: numberOfStations,
      transfers: 0,
      estimatedTime: estimateTravelTime(numberOfStations, 0)
    };
  }

  // Trouver une correspondance directe entre les deux lignes
  const fromLineStations = allStations.filter(s => String(s.line) === fromLine);
  const toLineStations = allStations.filter(s => String(s.line) === toLine);

  // Chercher des stations de correspondance (même nom sur les deux lignes)
  let bestTransfer = null;
  let minTotalStations = Infinity;

  fromLineStations.forEach(station1 => {
    toLineStations.forEach(station2 => {
      // Vérifier si c'est une correspondance (même nom ou très proche géographiquement)
      const isSameStation = station1.name === station2.name;
      const distance = calculateDistance(
        station1.coordinates.latitude,
        station1.coordinates.longitude,
        station2.coordinates.latitude,
        station2.coordinates.longitude
      );
      const isNearby = distance < 0.3; // Moins de 300m

      if (isSameStation || isNearby) {
        const fromIndex = fromLineStations.findIndex(s => s.id === fromStation.id);
        const station1Index = fromLineStations.findIndex(s => s.id === station1.id);
        const stationsToTransfer = Math.abs(station1Index - fromIndex);

        const toIndex = toLineStations.findIndex(s => s.id === toStation.id);
        const station2Index = toLineStations.findIndex(s => s.id === station2.id);
        const stationsFromTransfer = Math.abs(toIndex - station2Index);

        const totalStations = stationsToTransfer + stationsFromTransfer;

        if (totalStations < minTotalStations) {
          minTotalStations = totalStations;
          bestTransfer = {
            station: station1.name,
            station1,
            station2,
            stationsToTransfer,
            stationsFromTransfer
          };
        }
      }
    });
  });

  if (bestTransfer) {
    // Récupérer les stations intermédiaires pour chaque tronçon
    const segment1Stations = getIntermediateStations(fromStation, bestTransfer.station1, fromLineStations);
    const segment2Stations = getIntermediateStations(bestTransfer.station2, toStation, toLineStations);

    return {
      type: 'with-transfer',
      steps: [
        {
          line: fromLine,
          from: fromStation.name,
          to: bestTransfer.station,
          stations: bestTransfer.stationsToTransfer,
          coordinates: segment1Stations.map(s => s.coordinates)
        },
        {
          line: toLine,
          from: bestTransfer.station,
          to: toStation.name,
          stations: bestTransfer.stationsFromTransfer,
          coordinates: segment2Stations.map(s => s.coordinates)
        }
      ],
      totalStations: minTotalStations,
      transfers: 1,
      estimatedTime: estimateTravelTime(minTotalStations, 1)
    };
  }

  // Pas de correspondance directe - chercher une route avec 2 correspondances
  const route2Transfers = findRouteWith2Transfers(fromStation, toStation, fromLine, toLine, allStations);
  if (route2Transfers) {
    return route2Transfers;
  }

  // Si aucune route trouvée, retourner un itinéraire approximatif
  return createFallbackRoute(fromStation, toStation, allStations);
};

/**
 * Trouve un itinéraire avec 2 correspondances via une ligne intermédiaire
 */
const findRouteWith2Transfers = (fromStation, toStation, fromLine, toLine, allStations) => {
  const allLines = [...new Set(allStations.map(s => String(s.line)))];
  let bestRoute = null;
  let minTotalStations = Infinity;

  // Essayer chaque ligne comme intermédiaire
  allLines.forEach(midLine => {
    if (midLine === fromLine || midLine === toLine) return;

    const midLineStations = allStations.filter(s => String(s.line) === midLine);
    const fromLineStations = allStations.filter(s => String(s.line) === fromLine);
    const toLineStations = allStations.filter(s => String(s.line) === toLine);

    // Trouver correspondance fromLine -> midLine
    let transfer1 = null;
    fromLineStations.forEach(s1 => {
      midLineStations.forEach(s2 => {
        if (s1.name === s2.name) {
          const fromIndex = fromLineStations.findIndex(s => s.id === fromStation.id);
          const s1Index = fromLineStations.findIndex(s => s.id === s1.id);
          if (fromIndex !== -1 && s1Index !== -1) {
            const dist = Math.abs(s1Index - fromIndex);
            if (!transfer1 || dist < transfer1.stations) {
              transfer1 = { name: s1.name, station1: s1, station2: s2, stations: dist };
            }
          }
        }
      });
    });

    if (!transfer1) return;

    // Trouver correspondance midLine -> toLine
    let transfer2 = null;
    midLineStations.forEach(s1 => {
      toLineStations.forEach(s2 => {
        if (s1.name === s2.name) {
          const toIndex = toLineStations.findIndex(s => s.id === toStation.id);
          const s2Index = toLineStations.findIndex(s => s.id === s2.id);
          const midFromIndex = midLineStations.findIndex(s => s.id === transfer1.station2.id);
          const midToIndex = midLineStations.findIndex(s => s.id === s1.id);

          if (toIndex !== -1 && s2Index !== -1 && midFromIndex !== -1 && midToIndex !== -1) {
            const midDist = Math.abs(midToIndex - midFromIndex);
            const toDist = Math.abs(toIndex - s2Index);
            const totalMidAndTo = midDist + toDist;

            if (!transfer2 || totalMidAndTo < (transfer2.midStations + transfer2.toStations)) {
              transfer2 = {
                name: s1.name,
                station1: s1,
                station2: s2,
                midStations: midDist,
                toStations: toDist
              };
            }
          }
        }
      });
    });

    if (!transfer2) return;

    const totalStations = transfer1.stations + transfer2.midStations + transfer2.toStations;

    if (totalStations < minTotalStations) {
      minTotalStations = totalStations;

      // Récupérer les stations intermédiaires
      const segment1 = getIntermediateStations(fromStation, transfer1.station1, fromLineStations);
      const segment2 = getIntermediateStations(transfer1.station2, transfer2.station1, midLineStations);
      const segment3 = getIntermediateStations(transfer2.station2, toStation, toLineStations);

      bestRoute = {
        type: 'with-2-transfers',
        steps: [
          {
            line: fromLine,
            from: fromStation.name,
            to: transfer1.name,
            stations: transfer1.stations,
            coordinates: segment1.map(s => s.coordinates)
          },
          {
            line: midLine,
            from: transfer1.name,
            to: transfer2.name,
            stations: transfer2.midStations,
            coordinates: segment2.map(s => s.coordinates)
          },
          {
            line: toLine,
            from: transfer2.name,
            to: toStation.name,
            stations: transfer2.toStations,
            coordinates: segment3.map(s => s.coordinates)
          }
        ],
        totalStations: minTotalStations,
        transfers: 2,
        estimatedTime: estimateTravelTime(minTotalStations, 2)
      };
    }
  });

  return bestRoute;
};

/**
 * Crée un itinéraire de secours avec coordonnées directes
 */
const createFallbackRoute = (fromStation, toStation, allStations) => {
  // Essayer de trouver au moins les stations de la ligne de départ
  const fromLine = String(fromStation.line);
  const fromLineStations = allStations.filter(s => String(s.line) === fromLine);

  const directDistance = calculateDistance(
    fromStation.coordinates.latitude,
    fromStation.coordinates.longitude,
    toStation.coordinates.latitude,
    toStation.coordinates.longitude
  );
  const estimatedStations = Math.max(2, Math.ceil(directDistance / 0.5));

  // Trouver la station la plus proche de la destination sur la ligne de départ
  let closestOnFromLine = fromStation;
  let minDist = Infinity;

  fromLineStations.forEach(s => {
    const dist = calculateDistance(
      s.coordinates.latitude,
      s.coordinates.longitude,
      toStation.coordinates.latitude,
      toStation.coordinates.longitude
    );
    if (dist < minDist) {
      minDist = dist;
      closestOnFromLine = s;
    }
  });

  const segment1 = getIntermediateStations(fromStation, closestOnFromLine, fromLineStations);

  return {
    type: 'approximate',
    steps: [
      {
        line: fromLine,
        from: fromStation.name,
        to: closestOnFromLine.name,
        stations: Math.max(1, segment1.length - 1),
        coordinates: segment1.map(s => s.coordinates)
      },
      {
        line: String(toStation.line),
        from: closestOnFromLine.name,
        to: toStation.name,
        stations: Math.max(1, estimatedStations - segment1.length),
        coordinates: [
          closestOnFromLine.coordinates,
          toStation.coordinates
        ]
      }
    ],
    totalStations: estimatedStations,
    transfers: 1,
    estimatedTime: estimateTravelTime(estimatedStations, 1)
  };
};
