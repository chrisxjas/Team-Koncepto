import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SectionList, // Using SectionList for grouping by date
  Alert,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment'; // For date formatting and grouping

// You might need to install moment: npm install moment

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
  errorRed: '#e53935', // For errors or special alerts
  gold: '#FFD700', // For icons
  statusPending: '#FFC107', // Amber for pending
  statusApproved: '#4CAF50', // Green for approved
  statusRejected: '#F44336', // Red for rejected
  statusCompleted: '#2196F3', // Blue for completed (if applicable)
};

export default function ViewCustomOrder() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = route.params; // Get user object from navigation params

  const [customOrders, setCustomOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomOrders = useCallback(async () => {
    if (!user || !user.id) {
      setError("User ID not available. Cannot fetch custom orders.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}api/get-custom-orders.php?user_id=${user.id}`);
      const resJson = await response.json();

      if (resJson.success) {
        // Process data to group by date for SectionList
        const groupedOrders = groupOrdersByDate(resJson.custom_orders || []);
        setCustomOrders(groupedOrders);
      } else {
        setError(resJson.message || 'Failed to fetch custom orders.');
      }
    } catch (err) {
      console.error('Error fetching custom orders:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomOrders();
    // Refresh data when screen is focused
    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchCustomOrders();
    });
    return unsubscribeFocus;
  }, [fetchCustomOrders, navigation]);

  // Helper function to group orders by date
  const groupOrdersByDate = (orders) => {
    const sectionsMap = new Map();

    orders.forEach(order => {
      const date = moment(order.created_at).format('YYYY-MM-DD');
      const displayDate = moment(order.created_at).calendar(null, {
        sameDay: '[Today]',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        lastDay: '[Yesterday]',
        lastWeek: '[Last] dddd',
        sameElse: 'MMM Do, YYYY'
      });

      if (!sectionsMap.has(date)) {
        sectionsMap.set(date, {
          title: displayDate,
          data: [],
        });
      }
      sectionsMap.get(date).data.push(order);
    });

    // Convert Map values to an array for SectionList
    return Array.from(sectionsMap.values());
  };

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { color: colors.statusPending };
      case 'approved':
        return { color: colors.statusApproved };
      case 'rejected':
        return { color: colors.statusRejected };
      case 'completed':
        return { color: colors.statusCompleted };
      default:
        return { color: colors.textSecondary };
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>{item.productName || 'N/A'}</Text>
        <Text style={[styles.statusText, getStatusStyle(item.status || 'N/A')]}>
          {item.status || 'N/A'}
        </Text>
      </View>
      <View style={styles.cardDetailRow}>
        <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.detailText}>Brand: {item.brandName || 'N/A'}</Text>
      </View>
      <View style={styles.cardDetailRow}>
        <Ionicons name="apps-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.detailText}>Category ID: {item.category_id || 'N/A'}</Text>
      </View>
      <View style={styles.cardDetailRow}>
        <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.detailText}>Unit: {item.unit || 'N/A'}</Text>
      </View>
      <View style={styles.cardDetailRow}>
        <Ionicons name="layers-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.detailText}>Quantity: {item.quantity || 'N/A'}</Text>
      </View>
      <View style={styles.cardDetailRow}>
        <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.detailText}>Notes: {item.notes || 'N/A'}</Text>
      </View>
      <View style={styles.cardDetailRow}>
        <Ionicons name="barcode-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.detailText}>Code: {item.code || 'N/A'}</Text>
      </View>
      <View style={styles.cardDetailRow}>
        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.detailText}>Requested: {moment(item.created_at).format('MMM Do, YYYY h:mm A')}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Custom Orders</Text>
          <View style={styles.headerRight} /> {/* Placeholder for alignment */}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryGreen} />
            <Text style={styles.loadingText}>Loading custom orders...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={50} color={colors.errorRed} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchCustomOrders}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : customOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={80} color={colors.greyBorder} />
            <Text style={styles.emptyText}>You haven't made any custom order requests yet.</Text>
            <TouchableOpacity
              style={styles.createOrderButtonEmpty}
              onPress={() => navigation.navigate('CreateCustomOrder', { user })}
            >
              <Text style={styles.createOrderButtonTextEmpty}>Create New Order Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={customOrders}
            keyExtractor={(item, index) => item.code + index} // Use code + index for unique key
            renderItem={renderOrderItem}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
              </View>
            )}
            contentContainerStyle={styles.listContentContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Footer Buttons */}
        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity style={styles.footerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="person-outline" size={20} color={colors.white} />
            <Text style={styles.footerButtonText}>Back to Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => navigation.navigate('CustomOrder', { user })}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.white} />
            <Text style={styles.footerButtonText}>Create New Order</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.errorRed,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  createOrderButtonEmpty: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  createOrderButtonTextEmpty: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: 80, // Ensure space for footer
  },
  sectionHeader: {
    backgroundColor: colors.lightGreyBackground,
    paddingVertical: 8,
    paddingHorizontal: 5,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyBorder,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryGreen,
    flexShrink: 1, // Allow text to wrap
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
    flexShrink: 1,
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
    position: 'absolute', // Stick to bottom
    bottom: 0,
    width: '100%',
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