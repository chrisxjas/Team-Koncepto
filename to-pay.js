import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API = 'http://192.168.250.53/koncepto-app/api';

// Define colors in a shared object for consistency
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
  red: '#E53935',    // For 'To Pay' status
  orange: '#FF9800', // For 'To Confirm' status
  blue: '#2196F3',   // For 'To Rate' status
};

const ToPay = ({ route, navigation }) => {
  const { user } = route.params;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to clean and parse price strings
  const parsePrice = (priceString) => {
    if (typeof priceString !== 'string') {
      return 0; // Return 0 if it's not a string
    }
    // Remove non-numeric characters except for the dot
    const cleanedPrice = priceString.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleanedPrice);
    return isNaN(parsed) ? 0 : parsed; // Return 0 if parsing results in NaN
  };

  const fetchToPayOrders = async () => {
    try {
      const res = await fetch(`${API}/get-to-pay-orders.php?user_id=${user.id}`);
      const data = await res.json();
      if (data.success) {
        // Frontend no longer needs to calculate order total,
        // it's provided by the backend.
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Fetch To Pay error:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setLoading(true);
      fetchToPayOrders();
    });

    return unsubscribe;
  }, [navigation]);

  const handleCancelItem = async (order_id, product_id) => {
    Alert.alert(
      "Cancel Item",
      "Are you sure you want to cancel this item from your order?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const formData = new FormData();
              formData.append('order_id', order_id);
              formData.append('product_id', product_id);

              const res = await fetch(`${API}/cancel-order-item.php`, {
                method: 'POST',
                body: formData,
              });

              const data = await res.json();

              if (data.success) {
                Alert.alert('Success', 'Item cancelled successfully!');
                setOrders(prevOrders =>
                  prevOrders
                    .map(order => {
                      if (order.order_id === order_id) {
                        const filteredItems = order.items.filter(item => item.product_id !== product_id);
                        // Recalculate total_price for the order after item removal on frontend
                        // This ensures the frontend immediately reflects the change
                        const newTotalPrice = filteredItems.reduce((sum, item) => {
                          const itemPrice = parsePrice(item.price);
                          const itemQuantity = parseInt(item.quantity, 10);
                          return sum + (itemPrice * itemQuantity);
                        }, 0);
                        return { ...order, items: filteredItems, total_price: newTotalPrice.toFixed(2) };
                      }
                      return order;
                    })
                    .filter(order => order.items.length > 0)
                );
              } else {
                Alert.alert('Error', data.message || 'Failed to cancel item.');
              }
            } catch (error) {
              console.error('Cancel item error:', error);
              Alert.alert('Error', 'Network error while canceling the item.');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'to pay':
        return styles.statusRed;
      case 'to confirm':
        return styles.statusOrange;
      case 'to receive':
        return styles.statusGreen;
      case 'to rate':
        return styles.statusBlue;
      default:
        return styles.statusDefault;
    }
  };

  const renderItem = ({ item }) => {
    const orderDate = new Date(item.Orderdate);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <View style={styles.orderCard}>
        <Text style={styles.orderInfo}>Order Date: {formattedDate}</Text>
        <View style={styles.itemsContainer}>
          {item.items.map((subItem, index) => {
            const itemPrice = parsePrice(subItem.price);
            const itemQuantity = parseInt(subItem.quantity, 10);
            // Calculate item subtotal (price * quantity) for display
            const itemSubtotal = itemPrice * itemQuantity;

            return (
              <View key={index} style={styles.itemRow}>
                <Image
                  source={{ uri: `${API.replace('/api', '')}/assets/${subItem.image}` }}
                  style={styles.image}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.productName}>{subItem.productName}</Text>
                  <Text style={styles.qty}>Qty: {subItem.quantity}</Text>
                  <View style={styles.priceCancelRow}>
                    {/* Display subtotal for each item */}
                    <Text style={styles.price}>₱ {itemSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    {item.status.toLowerCase() === 'to pay' && (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelItem(item.order_id, subItem.product_id)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[styles.status, getStatusColor(item.status)]}>{item.status}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.orderTotalContainer}>
          {/* Display the total_price provided by the backend */}
          <Text style={styles.orderTotalText}>Total: ₱ {parsePrice(item.total_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
      </View>
    );
  };

  // Calculate the grand total of all orders using the total_price from the backend
  const grandTotal = orders.reduce((sum, order) => sum + parsePrice(order.total_price), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { user })}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>To Pay</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, styles.activeTabButton]}>
          <Text style={[styles.tabText, styles.activeTabText]}>To Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => navigation.navigate('ToConfirm', { user })}
        >
          <Text style={styles.tabText}>To Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => navigation.navigate('ToReceive', { user })}
        >
          <Text style={styles.tabText}>To Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => navigation.navigate('ToRate', { user })}
        >
          <Text style={styles.tabText}>To Rate</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primaryGreen} style={styles.loadingIndicator} />
      ) : (
        <>
          {/* Display total number of orders and grand total amount */}
          <View style={styles.summaryContainer}>
            <Text style={styles.orderCountText}>Total Orders: {orders.length}</Text>
            {orders.length > 0 && (
                <Text style={styles.grandTotalText}>
                    Grand Total: ₱ {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
            )}
          </View>

          {orders.length === 0 ? (
            <Text style={styles.empty}>No orders to pay yet.</Text>
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(item) => item.order_id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.flatListContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductList', { user })}
          style={styles.navButton}
        >
          <Ionicons name="home" size={24} color={colors.white} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Message', { user })}
          style={styles.navButton}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color={colors.white} />
          <Text style={styles.navLabel}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Carts', { user })}
          style={styles.navButton}
        >
          <Ionicons name="cart" size={24} color={colors.white} />
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Profile', { user })}
          style={styles.navButton}
        >
          <Ionicons name="person" size={24} color={colors.white} />
          <Text style={styles.navLabel}>Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ToPay;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGreyBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyBorder,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: colors.primaryGreen,
    borderBottomWidth: 2,
    borderColor: colors.primaryGreen,
    paddingBottom: 2,
  },
  activeTabButton: {},

  summaryContainer: {
    backgroundColor: colors.white,
    marginHorizontal: 15,
    marginTop: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  grandTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.darkerGreen,
  },

  orderCard: {
    backgroundColor: colors.white,
    marginTop: 10,
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderInfo: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.textPrimary,
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.greyBorder,
    paddingTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.greyBorder,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 6,
    backgroundColor: colors.lightGreyBackground,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  qty: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  priceCancelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.darkerGreen,
  },
  cancelButton: {
    backgroundColor: colors.red,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'flex-end',
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
    alignSelf: 'flex-end',
  },
  statusRed: {
    color: colors.red,
  },
  statusOrange: {
    color: colors.orange,
  },
  statusGreen: {
    color: colors.primaryGreen,
  },
  statusBlue: {
    color: colors.blue,
  },
  statusDefault: {
    color: colors.textSecondary,
  },
  orderTotalContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.greyBorder,
    paddingTop: 10,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotalText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  loadingIndicator: {
    marginTop: 50,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  navLabel: {
    color: colors.white,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  navButton: {
    alignItems: 'center',
    padding: 5,
    borderRadius: 5,
  },
  flatListContent: {
    paddingBottom: 100,
  }
});