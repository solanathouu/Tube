import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import * as usersService from '../services/usersService';

const EditProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, refreshUser } = useApp();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [username, setUsername] = useState(user?.username || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username || username.trim().length < 3) {
      Alert.alert('Erreur', "Le nom d'utilisateur doit contenir au moins 3 caractères");
      return;
    }

    if (phoneNumber && phoneNumber.trim()) {
      const phoneRegex = /^[\d\s\+\-\(\)]{8,}$/;
      if (!phoneRegex.test(phoneNumber.trim())) {
        Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide');
        return;
      }
    }

    setLoading(true);

    try {
      const result = await usersService.updateUser(user.uid, {
        username: username.trim(),
        phone_number: phoneNumber.trim() || null,
      });

      if (result.success) {
        await refreshUser();
        Alert.alert('Succès', 'Profil mis à jour', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de mettre à jour le profil');
      }
    } catch (error) {
      console.error('Erreur update profil:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom d'utilisateur *</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre pseudo"
              placeholderTextColor={theme.colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Doit être unique, 3 caractères minimum
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="+33 6 12 34 56 78"
              placeholderTextColor={theme.colors.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Permet à vos contacts de vous trouver facilement
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{user?.email}</Text>
            </View>
            <Text style={styles.hint}>
              L'email ne peut pas être modifié
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    form: {
      paddingTop: theme.spacing.md,
    },
    inputGroup: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.text,
    },
    readOnlyInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
    },
    readOnlyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    hint: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xl,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
  });

export default EditProfileScreen;

