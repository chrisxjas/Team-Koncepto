import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API = 'http://192.168.1.13/koncepto-app/api';

const CustomCheckBox = ({ value, onValueChange }) => (
  <TouchableOpacity onPress={onValueChange} style={{ padding: 5 }}>
    <Ionicons
      name={value ? 'checkbox' : 'square-outline'}
      size={24}
      color={value ? '#2ba310' : '#aaa'}
    />
  </TouchableOpacity>
);

const Carts = ({ route, navigation }) => {
  const { user } = route.params;
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Carts');

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/get-cart-items.php?user_id=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setCartItems(data.items);
        const initialSelection = {};
        data.items.forEach(item => (initialSelection[item.id] = false));
        setSelectedItems(initialSelection);
      }
    } catch (error) {
      console.error('Fetch cart items error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const toggleSelectItem = (id) => {
    setSelectedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = () => {
    const newState = !selectAll;
    const newSelection = {};
    cartItems.forEach(item => (newSelection[item.id] = newState));
    setSelectAll(newState);
    setSelectedItems(newSelection);
  };

  const updateQuantity = async (itemId, currentQty, direction, product_id) => {
    const qty = parseInt(currentQty);
    const newQty = direction === 'inc' ? qty + 1 : Math.max(1, qty - 1);

    const updatedItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQty } : item
    );
    setCartItems(updatedItems);

    await fetch(`${API}/add-to-cart.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        product_id,
        quantity: newQty,
        replace: true
      })
    });
  };

  const removeCartItem = (product_id) => {
    Alert.alert(
      'Remove from Cart',
      'Are you sure you want to remove this from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            try {
              const res = await fetch(`${API}/remove-from-cart.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: user.id,
                  product_id,
                }),
              });
              const result = await res.json();
              if (result.success) {
                fetchCartItems(); // 👈 refresh cart after deletion
              }
            } catch (err) {
              console.log('Delete error:', err);
            }
          },
        },
      ]
    );
  };

  const calculateSubtotal = () => {
    return cartItems
      .filter(item => selectedItems[item.id])
      .reduce((total, item) => total + parseInt(item.quantity) * parseFloat(item.price), 0);
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <CustomCheckBox value={selectedItems[item.id]} onValueChange={() => toggleSelectItem(item.id)} />
      <Image
        source={{ uri: `${API.replace('/api', '')}/assets/${item.image}` }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.productName}</Text>
        <Text style={styles.price}>₱ {parseFloat(item.price).toLocaleString()}</Text>
      </View>
      <View style={styles.qtyBox}>
        <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity, 'dec', item.product_id)}>
          <Ionicons name="remove" size={22} color="#2ba310" />
        </TouchableOpacity>
        <Text style={styles.qty}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity, 'inc', item.product_id)}>
          <Ionicons name="add" size={22} color="#2ba310" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => removeCartItem(item.product_id)}
        style={{ marginLeft: 8 }}
      >
        <Ionicons name="trash" size={22} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cart" size={24} color="black" />
        <Text style={styles.headerTitle}>Cart</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2ba310" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 150 }}
        />
      )}

      <View style={styles.footer}>
        <View style={styles.selectAll}>
          <CustomCheckBox value={selectAll} onValueChange={toggleSelectAll} />
          <Text style={{ marginLeft: 6 }}>ALL</Text>
        </View>
        <Text style={styles.subtotal}>
          Subtotal:{' '}
          <Text style={{ fontWeight: 'bold', color: '#2ba310' }}>
            ₱ {calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
        </Text>
        <TouchableOpacity style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>Check Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => {
            setActiveTab('Home');
            navigation.navigate('ProductList', { user });
          }}
          style={[styles.navButton, activeTab === 'Home' && styles.activeButton]}
        >
          <Ionicons name="home" size={24} color="#fff" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('Message');
            navigation.navigate('Message', { user });
          }}
          style={[styles.navButton, activeTab === 'Message' && styles.activeButton]}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
          <Text style={styles.navLabel}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('Carts');
          }}
          style={[styles.navButton, activeTab === 'Carts' && styles.activeButton]}
        >
          <Ionicons name="cart" size={24} color="#fff" />
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('Profile');
            navigation.navigate('Profile', { user });
          }}
          style={[styles.navButton, activeTab === 'Profile' && styles.activeButton]}
        >
          <Ionicons name="person" size={24} color="#fff" />
          <Text style={styles.navLabel}>Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Carts;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 15, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#ddd',
  },
  headerTitle: { marginLeft: 10, fontSize: 18, fontWeight: 'bold' },
  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginBottom: 10,
    padding: 10, elevation: 1,
  },
  image: {
    width: 60, height: 60,
    resizeMode: 'contain',
    marginHorizontal: 10,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: 'bold' },
  price: { fontSize: 14, color: '#2ba310', marginTop: 5 },
  qtyBox: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, backgroundColor: '#f1f1f1',
    borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qty: { marginHorizontal: 5, fontWeight: 'bold', fontSize: 16 },
  footer: {
    position: 'absolute', bottom: 60,
    backgroundColor: '#fff', width: '100%',
    padding: 15, borderTopWidth: 1, borderColor: '#ddd',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  selectAll: { flexDirection: 'row', alignItems: 'center' },
  subtotal: { fontSize: 14 },
  checkoutBtn: {
    backgroundColor: '#2ba310',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 6,
  },
  checkoutText: { color: '#fff', fontWeight: 'bold' },
  bottomNav: {
    position: 'absolute', bottom: 0, width: '100%',
    backgroundColor: '#2ba310',
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 8,
  },
  navLabel: {
    color: '#fff', fontSize: 12, textAlign: 'center',
  },
  navButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
  },
  activeButton: {
    borderColor: '#fff',
    borderWidth: 2,
  },
});
