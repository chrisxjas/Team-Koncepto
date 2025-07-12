import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TextInput, StyleSheet,
  FlatList, TouchableOpacity, ActivityIndicator,
  Dimensions, Modal, Pressable, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32) / 2;

const ProductList = ({ navigation, route }) => {
  const { user } = route.params;
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const API_BASE = 'http://192.168.250.53/koncepto-app/api';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = () => {
    fetch(`${API_BASE}/get-products.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.products);
          setFilteredProducts(data.products);
        }
      })
      .catch(err => console.error("Product fetch error:", err))
      .finally(() => setLoading(false));
  };

  const fetchCategories = () => {
    fetch(`${API_BASE}/get-categories.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories([{ id: null, categoryName: 'All' }, ...data.categories]);
        }
      })
      .catch(err => console.error("Category fetch error:", err));
  };

  const applyFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowFilter(false);
    if (categoryId === null) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p => p.category_id === categoryId.toString());
      setFilteredProducts(filtered);
    }
  };

  const renderProduct = ({ item }) => (
  <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { product: item })}>
    <View style={styles.card}>
      <Image
        source={{ uri: `http://192.168.250.53/koncepto-app/assets/${item.image}` }}
        style={styles.image}
      />
      <Text style={styles.name}>{item.productName}</Text>
      <Text style={styles.price}>₱ {parseFloat(item.price).toLocaleString()}</Text>
    </View>
  </TouchableOpacity>
);


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('./assets/logo.png')} style={styles.logo} />
      </View>

      {/* Search and Filter */}
      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="Search products..." />
        <TouchableOpacity onPress={() => setShowFilter(true)}>
          <Ionicons name="funnel-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilter} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilter(false)}>
          <View style={styles.filterBox}>
            <Text style={styles.filterTitle}>Select Category</Text>
            <ScrollView>
              {categories.map(cat => (
                <TouchableOpacity key={cat.id ?? 'all'} onPress={() => applyFilter(cat.id)}>
                  <Text style={[
                    styles.filterOption,
                    selectedCategory === cat.id && { fontWeight: 'bold', color: '#2ba310' }
                  ]}>
                    {cat.categoryName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Product Grid */}
      {loading ? (
        <ActivityIndicator size="large" color="#2ba310" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity>
          <Ionicons name="home" size={24} color="#fff" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Message')}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
          <Text style={styles.navLabel}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="cart" size={24} color="#fff" />
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { user })}>
          <Ionicons name="person" size={24} color="#fff" />
          <Text style={styles.navLabel}>Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductList;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: {
    backgroundColor: '#2ba310',
    paddingTop: 40,
    paddingBottom: 10,
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 60,
    resizeMode: 'contain',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  list: {
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  name: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  price: {
    fontWeight: 'bold',
    color: '#e53935',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#2ba310',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  navLabel: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  filterBox: {
    backgroundColor: '#fff',
    marginHorizontal: 40,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  filterOption: {
    fontSize: 16,
    paddingVertical: 8,
  },
});
