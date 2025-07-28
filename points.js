import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://192.168.250.53/koncepto-app/'; // Ensure this matches your API base URL

const screenWidth = Dimensions.get('window').width;

// Define a consistent color palette
const colors = {
  primaryGreen: '#4CAF50', // A vibrant green
  darkerGreen: '#388E3C', // A slightly darker green for active states/accents
  lightGreen: '#F0F8F0', // Very light green for backgrounds
  accentGreen: '#8BC34A', // Another shade of green
  textPrimary: '#333333', // Dark text for readability
  textSecondary: '#666666', // Lighter text for secondary info
  white: '#FFFFFF',
  greyBorder: '#DDDDDD', // Light grey for borders and lines
  lightGreyBackground: '#FAFAFA', // General light background
  errorRed: '#e53935', // For prices and errors
  gold: '#FFD700', // For the coin icon
};

export default function Points() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = route.params; // Get user object from navigation params

  const [balance, setBalance] = useState(0);
  const [earnedPointsHistory, setEarnedPointsHistory] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('earned'); // 'earned' or 'rewards'

  const fetchPointsData = useCallback(async () => {
    if (!user || !user.id) {
      console.warn("User object or user ID not available in Points screen.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}api/get-user-points.php?user_id=${user.id}`);
      const resJson = await response.json();

      if (resJson.success) {
        setBalance(resJson.balance || 0);
        setEarnedPointsHistory(resJson.earned_points || []);
      } else {
        Alert.alert('Error', resJson.message || 'Failed to fetch points data.');
      }
    } catch (error) {
      console.error('Error fetching points data:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}api/get-rewards.php`);
      const resJson = await response.json();

      if (resJson.success) {
        setRewards(resJson.rewards || []);
      } else {
        Alert.alert('Error', resJson.message || 'Failed to fetch rewards.');
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPointsData();
    fetchRewards(); // Fetch rewards on initial load
    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchPointsData(); // Refresh data when screen is focused
      fetchRewards();
    });

    return unsubscribeFocus;
  }, [fetchPointsData, fetchRewards, navigation]);

  const handleExchangeReward = async (rewardId, requiredPoints) => {
    if (balance < requiredPoints) {
      Alert.alert('Insufficient Points', 'You do not have enough points to claim this reward.');
      return;
    }

    Alert.alert(
      'Confirm Exchange',
      `Are you sure you want to exchange ${requiredPoints} points for this reward?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Exchange',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${API_BASE_URL}api/exchange-reward.php`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: user.id,
                  reward_id: rewardId,
                  required_points: requiredPoints,
                }),
              });
              const resJson = await response.json();

              if (resJson.success) {
                Alert.alert('Success', resJson.message || 'Reward exchanged successfully!');
                fetchPointsData(); // Refresh points balance
                fetchRewards(); // Refresh rewards list (stock might change)
              } else {
                Alert.alert('Error', resJson.message || 'Failed to exchange reward.');
              }
            } catch (error) {
              console.error('Error exchanging reward:', error);
              Alert.alert('Error', 'Network error. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderEarnedPointItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listIconContainer}>
        <Ionicons name="add-circle-outline" size={24} color={colors.primaryGreen} />
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>Points Earned from {item.product_name || 'Purchase'}</Text>
        <Text style={styles.listItemSubtitle}>{item.order_date}</Text>
      </View>
      <Text style={styles.pointsAmount}>+{item.points_earned}</Text>
    </View>
  );

  const renderRewardItem = ({ item }) => (
    <View style={styles.rewardItem}>
      <Image
        source={{ uri: `${API_BASE_URL}assets/${item.image}` }}
        style={styles.rewardImage}
        onError={(e) => console.log('Reward Image Load Error:', e.nativeEvent.error)}
      />
      <View style={styles.rewardDetails}>
        <Text style={styles.rewardName}>{item.reward_name}</Text>
        <Text style={styles.rewardDescription}>{item.description}</Text>
        <Text style={styles.rewardPoints}>
          <Ionicons name="medal" size={16} color={colors.gold} /> {item.required_points} Points
        </Text>
        <Text style={styles.rewardStock}>Stock: {item.stock}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.exchangeButton,
          (balance < item.required_points || item.stock <= 0) && styles.exchangeButtonDisabled,
        ]}
        onPress={() => handleExchangeReward(item.id, item.required_points)}
        disabled={balance < item.required_points || item.stock <= 0}
      >
        <Text style={styles.exchangeButtonText}>Exchange</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Points</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Current Points Balance:</Text>
          <View style={styles.balanceDisplay}>
            <Ionicons name="medal" size={30} color={colors.gold} style={styles.balanceIcon} />
            <Text style={styles.balanceAmount}>{balance}</Text>
          </View>
          <Text style={styles.balanceInfo}>Keep shopping to earn more points!</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'earned' && styles.activeTabButton]}
            onPress={() => setActiveTab('earned')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'earned' && styles.activeTabButtonText]}>
              Earned Points
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'rewards' && styles.activeTabButton]}
            onPress={() => setActiveTab('rewards')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'rewards' && styles.activeTabButtonText]}>
              Exchange Rewards
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryGreen} />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'earned' ? (
              earnedPointsHistory.length === 0 ? (
                <Text style={styles.emptyMessage}>No points earned yet. Start shopping!</Text>
              ) : (
                <FlatList
                  data={earnedPointsHistory}
                  renderItem={renderEarnedPointItem}
                  keyExtractor={(item, index) => item.transaction_id ? item.transaction_id.toString() : index.toString()}
                  scrollEnabled={false} // Disable inner scroll as parent ScrollView handles it
                  ListHeaderComponent={() => <Text style={styles.sectionTitle}>Points History</Text>}
                  ListHeaderComponentStyle={{ marginBottom: 10 }}
                />
              )
            ) : ( // activeTab === 'rewards'
              rewards.length === 0 ? (
                <Text style={styles.emptyMessage}>No rewards available at the moment.</Text>
              ) : (
                <FlatList
                  data={rewards}
                  renderItem={renderRewardItem}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false} // Disable inner scroll as parent ScrollView handles it
                  ListHeaderComponent={() => <Text style={styles.sectionTitle}>Available Rewards</Text>}
                  ListHeaderComponentStyle={{ marginBottom: 10 }}
                />
              )
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="person-outline" size={20} color={colors.white} />
          <Text style={styles.footerButtonText}>Back to Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate('ProductList', { user })}>
          <Ionicons name="basket-outline" size={20} color={colors.white} />
          <Text style={styles.footerButtonText}>Buy More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGreyBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 24, // To balance the back button
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 20, // Add some padding for the scrollable content
  },
  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
    fontWeight: '500',
  },
  balanceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  balanceIcon: {
    marginRight: 10,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: 'bold',
    color: colors.gold,
  },
  balanceInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: colors.primaryGreen,
    backgroundColor: colors.lightGreen,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabButtonText: {
    color: colors.primaryGreen,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 10,
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150, // Ensure it has some height even if content is empty
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1.5,
  },
  listIconContainer: {
    marginRight: 15,
    width: 30,
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pointsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryGreen,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1.5,
  },
  rewardImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: colors.lightGreyBackground,
  },
  rewardDetails: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  rewardPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardStock: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 5,
  },
  exchangeButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 10,
    justifyContent: 'center',
  },
  exchangeButtonDisabled: {
    backgroundColor: colors.greyBorder,
  },
  exchangeButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.darkerGreen,
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  footerButton: {
    alignItems: 'center',
    padding: 5,
  },
  footerButtonText: {
    color: colors.white,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});