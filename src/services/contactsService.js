import * as Contacts from 'expo-contacts';
import * as friendsService from './friendsService';

/**
 * Service d'import des contacts téléphone
 */

/**
 * Demander la permission d'accès aux contacts
 */
export const requestContactsPermission = async () => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return { success: status === 'granted', status };
  } catch (error) {
    console.error('Erreur permission contacts:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Importer les contacts du téléphone
 */
export const importPhoneContacts = async () => {
  try {
    const { status } = await Contacts.getPermissionsAsync();
    if (status !== 'granted') {
      const request = await requestContactsPermission();
      if (!request.success) {
        return { success: false, error: 'Permission refusée', contacts: [] };
      }
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
    });

    if (!data || data.length === 0) {
      return { success: true, contacts: [], matches: [] };
    }

    // Extraire les numéros de téléphone et emails
    const contactInfo = [];
    data.forEach(contact => {
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        contact.phoneNumbers.forEach(phone => {
          const normalized = normalizePhoneNumber(phone.number);
          if (normalized) {
            contactInfo.push({
              name: contact.name,
              phone: normalized,
              original: phone.number
            });
          }
        });
      }
      if (contact.emails && contact.emails.length > 0) {
        contact.emails.forEach(email => {
          contactInfo.push({
            name: contact.name,
            email: email.email
          });
        });
      }
    });

    return { success: true, contacts: contactInfo, matches: [] };
  } catch (error) {
    console.error('Erreur import contacts:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'import',
      contacts: []
    };
  }
};

/**
 * Trouver des utilisateurs app dans les contacts téléphone
 */
export const findFriendsInContacts = async () => {
  try {
    const { success, contacts, error } = await importPhoneContacts();
    if (!success) {
      return { success: false, error, matches: [] };
    }

    // Rechercher chaque contact dans la base
    const matches = [];
    const searchPromises = [];

    // Limiter à 50 recherches pour éviter de surcharger
    const contactsToSearch = contacts.slice(0, 50);

    for (const contact of contactsToSearch) {
      if (contact.phone) {
        searchPromises.push(
          friendsService.searchUsers(contact.phone).then(result => {
            if (result.success && result.users && result.users.length > 0) {
              result.users.forEach(user => {
                matches.push({
                  ...user,
                  contactName: contact.name,
                  matchedBy: 'phone'
                });
              });
            }
          })
        );
      }
      if (contact.email) {
        searchPromises.push(
          friendsService.searchUsers(contact.email).then(result => {
            if (result.success && result.users && result.users.length > 0) {
              result.users.forEach(user => {
                // Éviter les doublons
                if (!matches.find(m => m.user_id === user.user_id)) {
                  matches.push({
                    ...user,
                    contactName: contact.name,
                    matchedBy: 'email'
                  });
                }
              });
            }
          })
        );
      }
    }

    await Promise.all(searchPromises);

    return { success: true, matches };
  } catch (error) {
    console.error('Erreur findFriendsInContacts:', error);
    return {
      success: false,
      error: error.message,
      matches: []
    };
  }
};

/**
 * Normaliser un numéro de téléphone
 */
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  // Enlever tous les caractères non numériques sauf le +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Minimum 8 chiffres
  return cleaned.length >= 8 ? cleaned : null;
};

export default {
  requestContactsPermission,
  importPhoneContacts,
  findFriendsInContacts
};

