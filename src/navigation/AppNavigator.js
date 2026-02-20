import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

// Screens
import AuthScreen from '../screens/AuthScreen';
import MapScreen from '../screens/MapScreen';
import ReportListScreen from '../screens/ReportListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import FavoriteLinesScreen from '../screens/FavoriteLinesScreen';
import EmergencyConfirmScreen from '../screens/EmergencyConfirmScreen';
import EmergencyAlertSentScreen from '../screens/EmergencyAlertSentScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import FavoriteRoutesScreen from '../screens/FavoriteRoutesScreen';
import LiveShareScreen from '../screens/LiveShareScreen';
import FriendsScreen from '../screens/FriendsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack d'authentification (avant connexion)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Auth" component={AuthScreen} />
  </Stack.Navigator>
);

// Bottom Tabs (après connexion)
const MainTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          height: 85,
          paddingBottom: 20,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: theme.colors.text,
        },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Carte',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map" size={size} color={color} />
          ),
          headerTitle: 'Tube - Carte',
        }}
      />
      <Tab.Screen
        name="List"
        component={ReportListScreen}
        options={{
          tabBarLabel: 'Liste',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-bulleted" size={size} color={color} />
          ),
          headerTitle: 'Signalements',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
          headerTitle: 'Mon Profil',
        }}
      />
    </Tab.Navigator>
  );
};

// Stack principal avec les modals/screens additionnels
const MainStack = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FavoriteLines"
        component={FavoriteLinesScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EmergencyConfirm"
        component={EmergencyConfirmScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EmergencyAlertSent"
        component={EmergencyAlertSentScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FavoriteRoutes"
        component={FavoriteRoutesScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="LiveShare"
        component={LiveShareScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Navigation principale
const AppNavigator = () => {
  const { isAuthenticated } = useApp();
  const { theme, isDark } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.danger,
        },
      }}
    >
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
