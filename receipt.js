import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define a consistent color palette
const colors = {
  primaryGreen: '#4CAF50',
  darkerGreen: '#388E3C',
  lightGreen: '#F0F8F0',
  accentGreen: '#8BC34A',
  textPrimary: '#333333',
  textSecondary: '#666666',
  white: '#FFFFFF',
  greyBorder: '#DDDDDD',
  lightGreyBackground: '#FAFAFA',
  errorRed: '#e53935',
};

const API_BASE_URL = 'http://192.168.250.53/koncepto-app/';

const MyReceipt = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = route.params;

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReceiptId, setExpandedReceiptId] = useState(null); // State to manage expanded receipt

  // Function to format date and time for display
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Function to fetch receipts
  const fetchReceipts = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User ID not found. Cannot fetch receipts.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}api/get-receipt.php?user_id=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setReceipts(data.receipts);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch receipts.');
        setReceipts([]);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      Alert.alert('Network Error', 'Could not connect to the server to fetch receipts.');
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch receipts when the component mounts and when it comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchReceipts();
    }, [fetchReceipts])
  );

  // Toggle receipt expansion
  const toggleExpand = (receiptId) => {
    setExpandedReceiptId(expandedReceiptId === receiptId ? null : receiptId);
  };

  const renderReceiptItem = ({ item: receipt }) => (
    <View style={styles.receiptCard}>
      <TouchableOpacity onPress={() => toggleExpand(receipt.id)} style={styles.receiptSummary}>
        <View style={styles.receiptHeaderRow}>
          <Text style={styles.receiptId}>Receipt ID: {receipt.id}</Text>
          <Text style={styles.receiptDate}>{formatDateTime(receipt.receipt_date)}</Text>
        </View>
        <View style={styles.receiptHeaderRow}>
          <Text style={styles.receiptTotal}>Total: ₱{parseFloat(receipt.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          <Ionicons
            name={expandedReceiptId === receipt.id ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {expandedReceiptId === receipt.id && (
        <View style={styles.receiptDetails}>
          <Text style={styles.itemsHeader}>Items Purchased:</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 3 }]}>Product</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Price</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Subtotal</Text>
          </View>
          {receipt.items.length > 0 ? (
            receipt.items.map((item, index) => (
              <View key={item.item_id || index} style={styles.itemRow}>
                <View style={styles.itemProductCell}>
                  <Image
                    source={{ uri: `${API_BASE_URL}assets/${item.image}` }}
                    style={styles.itemImage}
                    onError={(e) => console.log('Image Load Error:', e.nativeEvent.error, 'for URI:', `${API_BASE_URL}assets/${item.image}`)}
                  />
                  <Text style={styles.itemName}>{item.productName}</Text>
                </View>
                <Text style={styles.itemQuantity}>{item.quantity}</Text>
                <Text style={styles.itemPrice}>₱{parseFloat(item.price_at_purchase).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                <Text style={styles.itemSubtotal}>₱{parseFloat(item.item_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>No items found for this receipt.</Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Receipts</Text>
        <View style={{ width: 28 }} />{/* Spacer */}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primaryGreen} style={styles.loadingIndicator} />
      ) : receipts.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="receipt-outline" size={80} color={colors.greyBorder} />
          <Text style={styles.emptyStateText}>No receipts found.</Text>
          <Text style={styles.emptyStateSubText}>Start shopping to see your purchase history here!</Text>
        </View>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReceiptItem}
          contentContainerStyle={styles.flatListContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGreyBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 16,
    paddingBottom: 15,
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  backButton: {
    paddingRight: 10,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 28, // Compensate for back button
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 15,
    fontWeight: 'bold',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 5,
  },
  flatListContent: {
    padding: 10,
    paddingBottom: 20, // Add some padding at the bottom
  },
  receiptCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden', // Ensures rounded corners clip content
  },
  receiptSummary: {
    padding: 15,
  },
  receiptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  receiptId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryGreen,
  },
  receiptDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  receiptTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.errorRed,
  },
  receiptDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.greyBorder,
    padding: 15,
    backgroundColor: colors.lightGreen, // Slightly different background for expanded details
  },
  itemsHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.darkerGreen,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkerGreen,
    marginBottom: 5,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontSize: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.greyBorder,
  },
  itemProductCell: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 30,
    height: 30,
    borderRadius: 5,
    marginRight: 8,
    backgroundColor: colors.white,
  },
  itemName: {
    fontSize: 12,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  itemQuantity: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  itemPrice: {
    flex: 1.5,
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  itemSubtotal: {
    flex: 1.5,
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  noItemsText: {
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
  },
});

export default MyReceipt;