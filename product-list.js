import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TextInput, StyleSheet,
  FlatList, TouchableOpacity, ActivityIndicator,
  Dimensions, Modal, ScrollView, Platform
} from 'react-native';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from './config';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

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

const ProductList = ({ route }) => {
  const navigation = useNavigation();
  const { user } = route.params;
  const [activeTab, setActiveTab] = useState('Home');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (text) => {
    setSearchQuery(text);
    const lowercased = text.toLowerCase();
    let filtered = products.filter(product =>
      product.productName.toLowerCase().includes(lowercased)
    );
    if (selectedCategory !== null) {
      filtered = filtered.filter(p => p.category_id === selectedCategory.toString());
    }
    setFilteredProducts(filtered);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = () => {
    fetch(`${BASE_URL}/get-products.php`)
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
    fetch(`${BASE_URL}/get-categories.php`)
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

    const lowercasedQuery = searchQuery.toLowerCase();
    let filtered = products;

    if (categoryId !== null) {
      filtered = filtered.filter(p => p.category_id === categoryId.toString());
    }

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(p =>
        p.productName.toLowerCase().includes(lowercasedQuery)
      );
    }

    setFilteredProducts(filtered);
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.cardWrapper}
      onPress={() => navigation.navigate('ProductDetail', { product: item, user })}
    >
      <View style={styles.card}>
        <Image
          source={{ uri: `${BASE_URL.replace('/api', '/assets')}/${item.image}` }}
          style={styles.image}
        />
        <Text style={styles.name} numberOfLines={2}>{item.productName}</Text>
        <Text style={styles.price}>₱ {parseFloat(item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('./assets/logo.png')} style={styles.logo} />
      </View>

      {/* Search + Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity onPress={() => setShowFilter(true)} style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilter(false)}>
          <View style={styles.filterBox}>
            <Text style={styles.filterTitle}>Select Category</Text>
            <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.5 }}>
              {categories.map(cat => (
                <TouchableOpacity key={cat.id ?? 'all'} onPress={() => applyFilter(cat.id)} style={styles.filterOptionButton}>
                  <Text style={[
                    styles.filterOptionText,
                    selectedCategory === cat.id && styles.selectedFilterOption
                  ]}>
                    {cat.categoryName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowFilter(false)} style={styles.closeFilterButton}>
                <Text style={styles.closeFilterButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Products */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primaryGreen} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>No products found matching your criteria.</Text>
            </View>
          )}
        />
      )}

      {/* Floating Action Button for Custom Order */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('CustomOrder', { user })}
      >
        <Ionicons name="add" size={30} color={colors.white} />
        {/* Removed the Text component for "Custom Order" */}
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => { setActiveTab('Home'); }}
          style={styles.navButton}
        >
          <Ionicons name="home" size={24} color={activeTab === 'Home' ? colors.white : '#B0E0A0'} />
          <Text style={[styles.navLabel, activeTab === 'Home' && styles.activeNavLabel]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('Message');
            navigation.navigate('Message', { user });
          }}
          style={styles.navButton}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color={activeTab === 'Message' ? colors.white : '#B0E0A0'} />
          <Text style={[styles.navLabel, activeTab === 'Message' && styles.activeNavLabel]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('Carts');
            navigation.navigate('Carts', { user });
          }}
          style={styles.navButton}
        >
          <Ionicons name="cart" size={24} color={activeTab === 'Carts' ? colors.white : '#B0E0A0'} />
          <Text style={[styles.navLabel, activeTab === 'Carts' && styles.activeNavLabel]}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('Profile');
            navigation.navigate('Profile', { user });
          }}
          style={styles.navButton}
        >
          <Ionicons name="person" size={24} color={activeTab === 'Profile' ? colors.white : '#B0E0A0'} />
          <Text style={[styles.navLabel, activeTab === 'Profile' && styles.activeNavLabel]}>Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGreyBackground,
  },
  header: {
    backgroundColor: colors.primaryGreen,
    paddingTop: Platform.OS === 'android' ? 30 : 50,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  logo: {
    width: 150,
    height: 50,
    resizeMode: 'contain',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 10,
    marginTop: -20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGreyBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.textPrimary,
  },
  filterButton: {
    backgroundColor: colors.primaryGreen,
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    margin: 8,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 5,
    color: colors.textPrimary,
  },
  price: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.errorRed,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.darkerGreen,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  navButton: {
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  navLabel: {
    color: '#B0E0A0',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  activeNavLabel: {
    color: colors.white,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  filterBox: {
    backgroundColor: colors.white,
    marginHorizontal: 30,
    borderRadius: 15,
    padding: 25,
    elevation: 10,
    width: '80%',
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  filterOptionButton: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyBorder,
  },
  filterOptionText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  selectedFilterOption: {
    fontWeight: 'bold',
    color: colors.primaryGreen,
  },
  closeFilterButton: {
    marginTop: 20,
    backgroundColor: colors.primaryGreen,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeFilterButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  fabButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: colors.primaryGreen,
    width: 60, // Set width and height to be equal
    height: 60,
    borderRadius: 30, // Half of width/height for a perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10,
    // Removed flexDirection and marginLeft from here as text is removed
  },
  // Removed fabButtonText style as the text is removed from the button
});
