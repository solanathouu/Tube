/**
 * Service pour l'API PRIM Île-de-France Mobilités
 * Documentation: https://prim.iledefrance-mobilites.fr
 */

const API_KEY = process.env.EXPO_PUBLIC_IDFM_API_KEY;
const BASE_URL = 'https://prim.iledefrance-mobilites.fr/marketplace';

// Mapping des lignes de métro/RER vers les IDs IDFM
const LINE_IDS = {
  // Métro
  '1': 'IDFM:C01371',
  '2': 'IDFM:C01372',
  '3': 'IDFM:C01373',
  '3bis': 'IDFM:C01386',
  '4': 'IDFM:C01374',
  '5': 'IDFM:C01375',
  '6': 'IDFM:C01376',
  '7': 'IDFM:C01377',
  '7bis': 'IDFM:C01387',
  '8': 'IDFM:C01378',
  '9': 'IDFM:C01379',
  '10': 'IDFM:C01380',
  '11': 'IDFM:C01381',
  '12': 'IDFM:C01382',
  '13': 'IDFM:C01383',
  '14': 'IDFM:C01384',
  // RER
  'A': 'IDFM:C01742',
  'B': 'IDFM:C01743',
  'C': 'IDFM:C01727',
  'D': 'IDFM:C01728',
  'E': 'IDFM:C01729',
};

/**
 * Récupérer les messages info trafic pour toutes les lignes
 * Utilise l'endpoint v2/navitia/disruptions pour récupérer toutes les perturbations
 */
export const getTrafficInfo = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/v2/navitia/disruptions`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'apiKey': API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      disruptions: parseNavitiaDisruptionsV2(data),
    };
  } catch (error) {
    console.error('Erreur getTrafficInfo:', error);
    return {
      success: false,
      error: error.message,
      disruptions: [],
    };
  }
};

/**
 * Récupérer les perturbations pour une ligne spécifique
 */
export const getLineTrafficInfo = async (lineId) => {
  try {
    const idfmLineId = LINE_IDS[lineId] || lineId;

    const response = await fetch(
      `${BASE_URL}/v2/navitia/lines/${idfmLineId}/disruptions`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'apiKey': API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      disruptions: parseNavitiaDisruptions(data),
    };
  } catch (error) {
    console.error('Erreur getLineTrafficInfo:', error);
    return {
      success: false,
      error: error.message,
      disruptions: [],
    };
  }
};

/**
 * Récupérer les prochains passages à un arrêt
 */
export const getNextDepartures = async (stopId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/stop-monitoring?MonitoringRef=${stopId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'apiKey': API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      departures: parseNextDepartures(data),
    };
  } catch (error) {
    console.error('Erreur getNextDepartures:', error);
    return {
      success: false,
      error: error.message,
      departures: [],
    };
  }
};

/**
 * Parser les perturbations du format Navitia v2 (/v2/navitia/disruptions)
 * Format: { disruptions: [...], pagination: {...} }
 */
const parseNavitiaDisruptionsV2 = (data) => {
  try {
    const disruptions = [];
    const rawDisruptions = data?.disruptions || [];

    rawDisruptions.forEach((d, index) => {
      // Extraire les lignes affectées
      const lines = [];
      const impactedObjects = d.impacted_objects || [];

      impactedObjects.forEach(obj => {
        const ptObject = obj.pt_object;
        if (ptObject?.embedded_type === 'line' && ptObject?.line) {
          const lineCode = ptObject.line.code;
          if (lineCode) {
            lines.push(lineCode);
          }
        }
      });

      // Extraire le message principal
      const messages = d.messages || [];
      let mainMessage = '';
      let title = '';

      messages.forEach(msg => {
        if (msg.channel?.types?.includes('web')) {
          // Nettoyer le HTML
          mainMessage = msg.text?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
        }
        if (msg.channel?.types?.includes('title')) {
          title = msg.text || '';
        }
      });

      // Ne garder que les perturbations actives ou futures et qui concernent le métro/RER
      const status = d.status || 'active';
      const hasMetroLines = lines.some(l =>
        /^[0-9]+(bis)?$/.test(l) || /^[A-E]$/.test(l)
      );

      // Inclure toutes les perturbations avec des lignes
      if (lines.length > 0) {
        disruptions.push({
          id: d.id || d.disruption_id || `disruption-${Date.now()}-${index}`,
          type: mapNavitiaType(d.severity?.effect) || 'incident',
          severity: d.severity?.priority ?? 50,
          title: title || d.severity?.name || 'Perturbation',
          message: mainMessage || title || 'Information non disponible',
          lines: [...new Set(lines)],
          startTime: d.application_periods?.[0]?.begin ? parseNavitiaDate(d.application_periods[0].begin) : null,
          endTime: d.application_periods?.[0]?.end ? parseNavitiaDate(d.application_periods[0].end) : null,
          isOfficial: true,
          source: 'IDFM',
          cause: d.cause || '',
          status: status,
          category: d.category || '',
          color: d.severity?.color || '#FF0000',
          isMetroOrRER: hasMetroLines,
        });
      }
    });

    // Filtrer pour ne garder que les perturbations métro/RER
    // Ne pas filtrer par status car certaines perturbations actives ont un status différent
    const metroDisruptions = disruptions.filter(d => d.isMetroOrRER);

    // Trier par priorité (severity) - les plus graves d'abord
    metroDisruptions.sort((a, b) => a.severity - b.severity);

    return metroDisruptions;
  } catch (error) {
    console.error('Erreur parsing Navitia disruptions v2:', error);
    return [];
  }
};

/**
 * Parser une date au format Navitia (YYYYMMDDTHHMMSS)
 */
const parseNavitiaDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    // Format: 20251119T182611
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    const second = dateStr.substring(13, 15) || '00';
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  } catch {
    return null;
  }
};

/**
 * Parser les perturbations du format disruptions_bulk (legacy)
 * Ce format est différent du format SIRI standard
 */
const parseDisruptionsBulk = (data) => {
  try {
    const disruptions = [];

    // Le format peut être un tableau direct ou encapsulé
    const rawDisruptions = Array.isArray(data) ? data : (data?.disruptions || data?.Siri?.ServiceDelivery?.GeneralMessageDelivery || []);

    // Si c'est le format SIRI
    if (rawDisruptions[0]?.InfoMessage) {
      rawDisruptions.forEach(delivery => {
        const messages = delivery?.InfoMessage || [];
        messages.forEach(msg => {
          const content = msg?.Content?.Message?.[0]?.MessageText?.value || '';
          const lineRefs = msg?.Content?.LineRef || [];

          disruptions.push({
            id: msg?.ItemIdentifier || `disruption-${Date.now()}-${Math.random()}`,
            type: mapDisruptionType(msg?.InfoChannelRef?.value),
            severity: mapSeverity(msg?.InfoMessageVersion),
            title: extractTitle(content),
            message: content,
            lines: lineRefs.map(ref => extractLineNumber(ref?.value)),
            startTime: msg?.RecordedAtTime ? new Date(msg.RecordedAtTime) : null,
            endTime: msg?.ValidUntilTime ? new Date(msg.ValidUntilTime) : null,
            isOfficial: true,
            source: 'IDFM',
          });
        });
      });
    } else {
      // Format bulk avec disruptions directes
      rawDisruptions.forEach((d, index) => {
        // Extraire les lignes affectées
        const lines = [];
        if (d.impacted_objects) {
          d.impacted_objects.forEach(obj => {
            if (obj.pt_object?.embedded_type === 'line') {
              lines.push(extractLineNumber(obj.pt_object?.id));
            }
          });
        }
        if (d.lines) {
          d.lines.forEach(l => lines.push(extractLineNumber(l.id || l)));
        }

        const message = d.messages?.[0]?.text || d.message || d.title || '';

        disruptions.push({
          id: d.id || d.disruption_id || `disruption-${Date.now()}-${index}`,
          type: mapNavitiaType(d.severity?.effect) || mapDisruptionType(d.type),
          severity: d.severity?.priority || d.severity || 1,
          title: d.severity?.name || d.title || extractTitle(message),
          message: message,
          lines: [...new Set(lines.filter(Boolean))], // Unique lines
          startTime: d.application_periods?.[0]?.begin ? new Date(d.application_periods[0].begin) : null,
          endTime: d.application_periods?.[0]?.end ? new Date(d.application_periods[0].end) : null,
          isOfficial: true,
          source: 'IDFM',
          cause: d.cause || '',
          status: d.status || 'active',
        });
      });
    }

    return disruptions;
  } catch (error) {
    console.error('Erreur parsing disruptions bulk:', error);
    return [];
  }
};

/**
 * Parser les perturbations du format SIRI (legacy)
 */
const parseDisruptions = (data) => {
  try {
    const disruptions = [];
    const deliveries = data?.Siri?.ServiceDelivery?.GeneralMessageDelivery || [];

    deliveries.forEach(delivery => {
      const messages = delivery?.InfoMessage || [];
      messages.forEach(msg => {
        const content = msg?.Content?.Message?.[0]?.MessageText?.value || '';
        const lineRefs = msg?.Content?.LineRef || [];

        disruptions.push({
          id: msg?.ItemIdentifier || `disruption-${Date.now()}`,
          type: mapDisruptionType(msg?.InfoChannelRef?.value),
          severity: mapSeverity(msg?.InfoMessageVersion),
          title: extractTitle(content),
          message: content,
          lines: lineRefs.map(ref => extractLineNumber(ref?.value)),
          startTime: msg?.ValidUntilTime ? new Date(msg.ValidUntilTime) : null,
          endTime: msg?.ValidUntilTime ? new Date(msg.ValidUntilTime) : null,
          isOfficial: true,
          source: 'IDFM',
        });
      });
    });

    return disruptions;
  } catch (error) {
    console.error('Erreur parsing disruptions:', error);
    return [];
  }
};

/**
 * Parser les perturbations du format Navitia
 */
const parseNavitiaDisruptions = (data) => {
  try {
    const disruptions = [];
    const rawDisruptions = data?.disruptions || [];

    rawDisruptions.forEach(d => {
      const messages = d?.messages || [];
      const impactedLines = d?.impacted_objects?.filter(o => o.pt_object?.embedded_type === 'line') || [];

      disruptions.push({
        id: d?.id || `disruption-${Date.now()}`,
        type: mapNavitiaType(d?.severity?.effect),
        severity: d?.severity?.priority || 1,
        title: d?.severity?.name || 'Perturbation',
        message: messages[0]?.text || '',
        lines: impactedLines.map(l => extractLineNumber(l.pt_object?.id)),
        startTime: d?.application_periods?.[0]?.begin ? new Date(d.application_periods[0].begin) : null,
        endTime: d?.application_periods?.[0]?.end ? new Date(d.application_periods[0].end) : null,
        isOfficial: true,
        source: 'IDFM',
        cause: d?.cause || '',
        status: d?.status || 'active',
      });
    });

    return disruptions;
  } catch (error) {
    console.error('Erreur parsing Navitia disruptions:', error);
    return [];
  }
};

/**
 * Parser les prochains passages
 */
const parseNextDepartures = (data) => {
  try {
    const departures = [];
    const deliveries = data?.Siri?.ServiceDelivery?.StopMonitoringDelivery || [];

    deliveries.forEach(delivery => {
      const visits = delivery?.MonitoredStopVisit || [];
      visits.forEach(visit => {
        const journey = visit?.MonitoredVehicleJourney;
        const call = journey?.MonitoredCall;

        departures.push({
          lineId: extractLineNumber(journey?.LineRef?.value),
          lineName: journey?.PublishedLineName?.value,
          destination: journey?.DestinationName?.[0]?.value,
          expectedTime: call?.ExpectedDepartureTime ? new Date(call.ExpectedDepartureTime) : null,
          aimedTime: call?.AimedDepartureTime ? new Date(call.AimedDepartureTime) : null,
          status: call?.DepartureStatus,
          vehicleMode: journey?.VehicleMode?.[0],
        });
      });
    });

    // Trier par heure d'arrivée
    departures.sort((a, b) => (a.expectedTime || a.aimedTime) - (b.expectedTime || b.aimedTime));

    return departures;
  } catch (error) {
    console.error('Erreur parsing next departures:', error);
    return [];
  }
};

/**
 * Extraire le numéro de ligne depuis l'ID IDFM
 */
const extractLineNumber = (idfmId) => {
  if (!idfmId) return null;

  // Chercher dans le mapping inverse
  for (const [lineNum, id] of Object.entries(LINE_IDS)) {
    if (id === idfmId || idfmId.includes(id)) {
      return lineNum;
    }
  }

  // Extraire le numéro si format connu
  const match = idfmId.match(/C0137(\d+)/);
  if (match) {
    return match[1];
  }

  return idfmId;
};

/**
 * Mapper le type de perturbation SIRI
 */
const mapDisruptionType = (channelRef) => {
  const mapping = {
    'Information': 'info',
    'Perturbation': 'incident',
    'Commercial': 'info',
  };
  return mapping[channelRef] || 'incident';
};

/**
 * Mapper le type Navitia
 */
const mapNavitiaType = (effect) => {
  const mapping = {
    'NO_SERVICE': 'maintenance',
    'REDUCED_SERVICE': 'incident',
    'SIGNIFICANT_DELAYS': 'incident',
    'DETOUR': 'works',
    'ADDITIONAL_SERVICE': 'info',
    'MODIFIED_SERVICE': 'incident',
    'STOP_MOVED': 'works',
    'OTHER_EFFECT': 'incident',
    'UNKNOWN_EFFECT': 'info',
  };
  return mapping[effect] || 'incident';
};

/**
 * Mapper la sévérité
 */
const mapSeverity = (version) => {
  // Plus le numéro est élevé, plus c'est grave
  return version || 1;
};

/**
 * Extraire le titre du message
 */
const extractTitle = (content) => {
  if (!content) return 'Perturbation';
  // Prendre la première ligne ou les 50 premiers caractères
  const firstLine = content.split('\n')[0];
  return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
};

/**
 * Obtenir l'état global du réseau (toutes les lignes)
 */
export const getNetworkStatus = async () => {
  try {
    const result = await getTrafficInfo();

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Grouper par ligne
    const statusByLine = {};

    result.disruptions.forEach(d => {
      d.lines.forEach(line => {
        if (line) {
          if (!statusByLine[line]) {
            statusByLine[line] = {
              line,
              status: 'ok',
              disruptions: [],
            };
          }
          statusByLine[line].disruptions.push(d);
          statusByLine[line].status = d.type === 'maintenance' ? 'interrupted' : 'disrupted';
        }
      });
    });

    return {
      success: true,
      statusByLine,
      totalDisruptions: result.disruptions.length,
    };
  } catch (error) {
    console.error('Erreur getNetworkStatus:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculer un itinéraire avec Navitia
 * @param {Object} from - Point de départ { latitude, longitude } ou stopId
 * @param {Object} to - Point d'arrivée { latitude, longitude } ou stopId
 * @param {Date} datetime - Date/heure de départ (optionnel)
 */
export const calculateRoute = async (from, to, datetime = new Date()) => {
  try {
    // Construire les coordonnées
    const fromCoord = from.latitude && from.longitude
      ? `${from.longitude};${from.latitude}`
      : from.stopId || from;
    const toCoord = to.latitude && to.longitude
      ? `${to.longitude};${to.latitude}`
      : to.stopId || to;

    const datetimeStr = datetime.toISOString().replace(/[-:]/g, '').split('.')[0];

    const response = await fetch(
      `${BASE_URL}/v2/navitia/journeys?from=${fromCoord}&to=${toCoord}&datetime=${datetimeStr}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'apiKey': API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      journeys: parseJourneys(data),
    };
  } catch (error) {
    console.error('Erreur calculateRoute:', error);
    return {
      success: false,
      error: error.message,
      journeys: [],
    };
  }
};

/**
 * Parser les itinéraires Navitia
 */
const parseJourneys = (data) => {
  try {
    const journeys = [];
    const rawJourneys = data?.journeys || [];

    rawJourneys.forEach(journey => {
      const sections = journey?.sections || [];
      const parsedSections = sections.map(section => ({
        type: section.type, // 'public_transport', 'street_network', 'waiting', 'transfer'
        mode: section.mode || section.transfer_type,
        duration: section.duration,
        from: {
          name: section.from?.name || section.from?.stop_point?.name,
          coordinates: section.from?.stop_point?.coord,
          stopId: section.from?.stop_point?.id, // ID pour les prochains passages
        },
        to: {
          name: section.to?.name || section.to?.stop_point?.name,
          coordinates: section.to?.stop_point?.coord,
          stopId: section.to?.stop_point?.id,
        },
        departureTime: section.departure_date_time,
        arrivalTime: section.arrival_date_time,
        // Pour les transports publics
        line: section.display_informations?.code,
        lineColor: section.display_informations?.color ? `#${section.display_informations.color}` : null,
        direction: section.display_informations?.direction,
        network: section.display_informations?.network,
        stops: section.stop_date_times?.length || 0,
        // Géométrie pour affichage sur carte
        geojson: section.geojson,
      }));

      // Trouver la première section de transport public pour calculer le temps d'attente
      const firstTransitSection = parsedSections.find(s => s.type === 'public_transport');

      journeys.push({
        duration: journey.duration,
        departureTime: journey.departure_date_time,
        arrivalTime: journey.arrival_date_time,
        nbTransfers: journey.nb_transfers,
        walkingDuration: journey.durations?.walking || 0,
        waitingDuration: journey.durations?.waiting || 0,
        sections: parsedSections,
        co2Emission: journey.co2_emission?.value,
        type: journey.type, // 'rapid', 'comfort', 'non_pt'
        // Informations pour calculer le temps d'attente
        firstTransitStopId: firstTransitSection?.from?.stopId,
        firstTransitLine: firstTransitSection?.line,
        firstTransitDeparture: firstTransitSection?.departureTime,
      });
    });

    return journeys;
  } catch (error) {
    console.error('Erreur parsing journeys:', error);
    return [];
  }
};

/**
 * Rechercher des arrêts par nom ou coordonnées
 */
export const searchPlaces = async (query, coords = null) => {
  try {
    let url = `${BASE_URL}/v2/navitia/places?q=${encodeURIComponent(query)}&type[]=stop_area&type[]=stop_point`;

    if (coords) {
      url += `&from=${coords.longitude};${coords.latitude}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'apiKey': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      places: parsePlaces(data),
    };
  } catch (error) {
    console.error('Erreur searchPlaces:', error);
    return {
      success: false,
      error: error.message,
      places: [],
    };
  }
};

/**
 * Parser les lieux de recherche
 */
const parsePlaces = (data) => {
  try {
    const places = [];
    const rawPlaces = data?.places || [];

    rawPlaces.forEach(place => {
      places.push({
        id: place.id,
        name: place.name,
        type: place.embedded_type,
        coordinates: place.stop_area?.coord || place.stop_point?.coord,
        lines: place.stop_area?.lines?.map(l => ({
          id: l.id,
          code: l.code,
          name: l.name,
          color: l.color ? `#${l.color}` : null,
        })) || [],
      });
    });

    return places;
  } catch (error) {
    console.error('Erreur parsing places:', error);
    return [];
  }
};

export default {
  getTrafficInfo,
  getLineTrafficInfo,
  getNextDepartures,
  getNetworkStatus,
  calculateRoute,
  searchPlaces,
  LINE_IDS,
};
