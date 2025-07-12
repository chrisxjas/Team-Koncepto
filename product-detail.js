import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProductDetail = ({ route, navigation }) => {
  const { product, user } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const handleAddToCart = () => {
    fetch('http://192.168.250.53/koncepto-app/api/add-to-cart.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        product_id: product.id,
        quantity: quantity
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          Alert.alert("Success", "Product added to cart!");
          setShowModal(false);
        } else {
          Alert.alert("Error", "Failed to add to cart.");
        }
      })
      .catch(err => {
        console.error("Add to cart error:", err);
        Alert.alert("Error", "Network error.");
      });
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: `http://192.168.250.53/koncepto-app/assets/${product.image}` }}
        style={styles.image}
      />
      <Text style={styles.name}>{product.productName}</Text>
      <Text style={styles.brand}>{product.brandName}</Text>
      <Text style={styles.description}>{product.description || 'No description available.'}</Text>
      <Text style={styles.price}>₱ {parseFloat(product.price).toLocaleString()}</Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btnAdd} onPress={() => setShowModal(true)}>
          <Text style={styles.btnText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnBuy}>
          <Text style={styles.btnText}>Buy Now</Text>
        </TouchableOpacity>
      </View>

      {/* Quantity Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                <Ionicons name="remove-circle-outline" size={36} color="#2ba310" />
              </TouchableOpacity>
              <Text style={styles.qty}>{quantity}</Text>
              <TouchableOpacity onPress={() => setQuantity(quantity + 1)}>
                <Ionicons name="add-circle-outline" size={36} color="#2ba310" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
              <Text style={styles.btnText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginTop: 10 }}>
              <Text style={{ textAlign: 'center', color: '#999' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProductDetail;

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  image: { width: '100%', height: 200, resizeMode: 'contain', marginBottom: 20 },
  name: { fontSize: 22, fontWeight: 'bold' },
  brand: { fontSize: 16, color: '#555', marginBottom: 10 },
  description: { fontSize: 14, color: '#333', marginBottom: 20 },
  price: { fontSize: 20, fontWeight: 'bold', color: '#e53935', marginBottom: 30 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnAdd: {
    backgroundColor: '#aaa',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10
  },
  btnBuy: {
    backgroundColor: '#2ba310',
    padding: 15,
    borderRadius: 10,
    flex: 1
  },
  btnText: { textAlign: 'center', color: '#fff', fontWeight: 'bold' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  qty: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20
  },
  addBtn: {
    backgroundColor: '#2ba310',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 10
  }
});
