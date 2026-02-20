# Notifications

Système de push notifications via Expo.

---

## Fichiers source

| Fichier | Rôle |
|---------|------|
| `src/services/notificationService.js` | Gestion notifications |
| `src/screens/NotificationSettingsScreen.js` | Paramètres utilisateur |
| `src/context/AppContext.js` | État notifications |

---

## Configuration Expo

### app.json
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#2196F3"
        }
      ]
    ]
  }
}
```

---

## Enregistrement du token

```javascript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    return null; // Simulateur non supporté
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Sauvegarder le token en base
  await saveTokenToDatabase(token);

  return token;
};
```

---

## Types de notifications

### 1. Alertes de proximité
Signalements à proximité de l'utilisateur.

```javascript
{
  title: 'Contrôleur signalé',
  body: 'À 200m - Station Châtelet, Ligne 1',
  data: {
    type: 'alert',
    reportId: 'uuid',
    stationId: 'chatelet'
  }
}
```

### 2. Rappels quotidiens
Rappels configurés par l'utilisateur.

```javascript
{
  title: 'Bon trajet !',
  body: 'Consultez l\'état du trafic avant de partir',
  data: {
    type: 'reminder'
  }
}
```

### 3. Actualités
Mises à jour de l'application.

```javascript
{
  title: 'Nouvelle fonctionnalité',
  body: 'Découvrez le partage de trajet en temps réel',
  data: {
    type: 'news',
    url: '/live-share'
  }
}
```

---

## Préférences utilisateur

```javascript
{
  enabled: true,           // Master toggle
  categories: {
    alerts: true,          // Alertes proximité
    reminders: true,       // Rappels quotidiens
    news: false            // Actualités
  },
  proximity_radius: 500,   // Rayon en mètres
  reminder_time: '08:00'   // Heure du rappel
}
```

---

## Gestion foreground

```javascript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

---

## Écoute des notifications

```javascript
useEffect(() => {
  // Notification reçue en foreground
  const subscription = Notifications.addNotificationReceivedListener(
    notification => {
      console.log('Notification received:', notification);
    }
  );

  // Notification cliquée
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    response => {
      const { data } = response.notification.request.content;
      if (data.type === 'alert' && data.reportId) {
        // Naviguer vers le signalement
        navigation.navigate('ReportDetail', { id: data.reportId });
      }
    }
  );

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}, []);
```

---

## Envoi de notification (backend)

Depuis le backend Supabase ou un serveur :

```javascript
const sendPushNotification = async (expoPushToken, title, body, data) => {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoPushToken,
      title,
      body,
      data,
      sound: 'default',
      badge: 1,
    }),
  });
};
```

---

## Notifications locales

Pour les rappels programmés :

```javascript
export const scheduleReminder = async (hour, minute) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Bon trajet !',
      body: 'Consultez l\'état du trafic avant de partir',
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
};
```

---

## Alertes de proximité

```javascript
export const checkProximityAlerts = async (userLocation, reports, radius) => {
  const nearbyReports = reports.filter(report => {
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      report.coordinates.latitude,
      report.coordinates.longitude
    );
    return distance <= radius;
  });

  for (const report of nearbyReports) {
    if (!wasAlreadyNotified(report.id)) {
      await sendLocalNotification(report);
      markAsNotified(report.id);
    }
  }
};
```

---

## Permissions

### iOS
Demande automatique au premier lancement.

### Android
Pas de permission requise pour Android < 13.
Android 13+ : permission `POST_NOTIFICATIONS` requise.

```javascript
if (Platform.OS === 'android' && Platform.Version >= 33) {
  const { status } = await Notifications.requestPermissionsAsync();
}
```
