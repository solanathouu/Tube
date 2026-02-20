import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as friendsService from '../services/friendsService';
import * as contactsService from '../services/contactsService';

const FriendsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'search'
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [contactMatches, setContactMatches] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadFriends(),
      loadReceivedRequests(),
      loadSentRequests()
    ]);
    setLoading(false);
  };

  const loadFriends = async () => {
    const result = await friendsService.getFriendsWithStatus();
    if (result.success) {
      setFriends(result.friends);
    }
  };

  const loadReceivedRequests = async () => {
    const result = await friendsService.getReceivedRequests();
    if (result.success) {
      setReceivedRequests(result.requests);
    }
  };

  const loadSentRequests = async () => {
    const result = await friendsService.getSentRequests();
    if (result.success) {
      setSentRequests(result.requests);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = useCallback(
    async (query) => {
      setSearchQuery(query);
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      const result = await friendsService.searchUsers(query);
      if (result.success) {
        setSearchResults(result.users);
      }
      setSearchLoading(false);
    },
    []
  );

  const handleImportContacts = async () => {
    setLoadingContacts(true);
    const result = await contactsService.findFriendsInContacts();
    if (result.success) {
      setContactMatches(result.matches);
      Alert.alert(
        'Contacts importés',
        `${result.matches.length} ami(s) trouvé(s) dans vos contacts`
      );
    } else {
      Alert.alert('Erreur', result.error || 'Impossible d\'importer les contacts');
    }
    setLoadingContacts(false);
  };

  const handleSendRequest = async (userId, username) => {
    const result = await friendsService.sendFriendRequest(userId);
    if (result.success) {
      Alert.alert('Succès', `Demande envoyée à ${username}`);
      await loadSentRequests();
      handleSearch(searchQuery);
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    const result = await friendsService.acceptFriendRequest(requestId);
    if (result.success) {
      await Promise.all([loadFriends(), loadReceivedRequests()]);
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    const result = await friendsService.rejectFriendRequest(requestId);
    if (result.success) {
      await loadReceivedRequests();
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleCancelRequest = async (requestId) => {
    const result = await friendsService.cancelFriendRequest(requestId);
    if (result.success) {
      await loadSentRequests();
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleRemoveFriend = (friendId, username) => {
    Alert.alert(
      'Retirer ami',
      `Voulez-vous vraiment retirer ${username} de vos amis ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            const result = await friendsService.removeFriend(friendId);
            if (result.success) {
              await loadFriends();
            } else {
              Alert.alert('Erreur', result.error);
            }
          }
        }
      ]
    );
  };

  const renderFriendsList = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="account-multiple-outline"
            size={64}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>Aucun ami pour le moment</Text>
          <Text style={styles.emptySubtext}>
            Recherchez des utilisateurs pour les ajouter
          </Text>
        </View>
      ) : (
        friends.map((friend) => (
          <TouchableOpacity
            key={friend.friend_id}
            style={styles.friendCard}
            onPress={() => navigation.navigate('FriendDetails', { friendId: friend.friend_id })}
          >
            <View style={styles.friendAvatar}>
              <MaterialCommunityIcons
                name="account"
                size={32}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{friend.username}</Text>
              {friend.active_trip_destination && (
                <View style={styles.friendStatus}>
                  <MaterialCommunityIcons
                    name="navigation"
                    size={14}
                    color={theme.colors.success}
                  />
                  <Text style={styles.friendStatusText}>
                    En route vers {friend.active_trip_destination}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveFriend(friend.friend_id, friend.username)}
              style={styles.friendAction}
            >
              <MaterialCommunityIcons
                name="account-remove"
                size={20}
                color={theme.colors.danger}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderRequests = () => (
    <ScrollView style={styles.content}>
      {receivedRequests.length === 0 && sentRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="email-outline"
            size={64}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>Aucune demande</Text>
        </View>
      ) : (
        <>
          {receivedRequests.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Demandes reçues</Text>
              {receivedRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {request.sender.username}
                    </Text>
                    {request.message && (
                      <Text style={styles.requestMessage}>{request.message}</Text>
                    )}
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.acceptButton]}
                      onPress={() => handleAcceptRequest(request.id)}
                    >
                      <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.rejectButton]}
                      onPress={() => handleRejectRequest(request.id)}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {sentRequests.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Demandes envoyées</Text>
              {sentRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {request.recipient.username}
                    </Text>
                    <Text style={styles.requestStatus}>En attente...</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelRequest(request.id)}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderSearch = () => (
    <View style={styles.content}>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons
          name="magnify"
          size={24}
          color={theme.colors.textSecondary}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Pseudo, email ou tél..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={styles.importContactsButton}
        onPress={handleImportContacts}
        disabled={loadingContacts}
      >
        <MaterialCommunityIcons
          name="contacts"
          size={20}
          color={theme.colors.primary}
        />
        <Text style={styles.importContactsText}>
          {loadingContacts ? 'Import en cours...' : 'Importer mes contacts téléphone'}
        </Text>
      </TouchableOpacity>

      {contactMatches.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Dans vos contacts ({contactMatches.length})</Text>
          {contactMatches.map((user) => (
            <View key={user.user_id} style={styles.searchResultCard}>
              <View style={styles.friendAvatar}>
                <MaterialCommunityIcons
                  name="account"
                  size={32}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.searchResultInfo}>
                <Text style={styles.searchResultName}>{user.username}</Text>
                <Text style={styles.contactNameText}>
                  {user.contactName} • {user.matchedBy === 'phone' ? 'Tél' : 'Email'}
                </Text>
                {user.is_friend && (
                  <Text style={styles.alreadyFriendText}>✓ Déjà ami</Text>
                )}
              </View>
              {!user.is_friend && (
                user.has_pending_request ? (
                  <Text style={styles.pendingText}>En attente</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleSendRequest(user.user_id, user.username)}
                  >
                    <MaterialCommunityIcons name="account-plus" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )
              )}
            </View>
          ))}
        </>
      )}

      {searchQuery.length >= 2 && (
        <Text style={styles.sectionTitle}>Résultats de recherche</Text>
      )}

      <ScrollView style={styles.searchResults}>
        {searchLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>Aucun résultat</Text>
          </View>
        ) : (
          searchResults.map((user) => (
            <View key={user.user_id} style={styles.searchResultCard}>
              <View style={styles.friendAvatar}>
                <MaterialCommunityIcons
                  name="account"
                  size={32}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.searchResultInfo}>
                <Text style={styles.searchResultName}>{user.username}</Text>
                {user.is_friend && (
                  <Text style={styles.alreadyFriendText}>✓ Déjà ami</Text>
                )}
              </View>
              {!user.is_friend && (
                user.has_pending_request ? (
                  <Text style={styles.pendingText}>En attente</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleSendRequest(user.user_id, user.username)}
                  >
                    <MaterialCommunityIcons name="account-plus" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contacts</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Amis ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Demandes
            {receivedRequests.length > 0 && (
              <Text style={styles.badge}> {receivedRequests.length}</Text>
            )}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Rechercher
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <>
          {activeTab === 'friends' && renderFriendsList()}
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'search' && renderSearch()}
        </>
      )}
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
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    activeTabText: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    badge: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.danger,
    },
    content: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    friendCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    friendAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    friendInfo: {
      flex: 1,
    },
    friendName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    friendStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
      gap: theme.spacing.xs,
    },
    friendStatusText: {
      fontSize: 12,
      color: theme.colors.success,
    },
    friendAction: {
      padding: theme.spacing.sm,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    requestCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    requestInfo: {
      flex: 1,
    },
    requestName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    requestMessage: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    requestStatus: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    requestActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    requestButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    acceptButton: {
      backgroundColor: theme.colors.success,
    },
    rejectButton: {
      backgroundColor: theme.colors.danger,
    },
    cancelButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    },
    cancelButtonText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
    },
    searchResults: {
      flex: 1,
    },
    searchResultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchResultInfo: {
      flex: 1,
    },
    searchResultName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    alreadyFriendText: {
      fontSize: 12,
      color: theme.colors.success,
      marginTop: theme.spacing.xs,
    },
    pendingText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loader: {
      marginTop: theme.spacing.xl,
    },
    importContactsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      margin: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    importContactsText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    contactNameText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });

export default FriendsScreen;

