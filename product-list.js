import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TextInput, StyleSheet,
  FlatList, TouchableOpacity, ActivityIndicator,
  Dimensions, Modal, Pressable, ScrollView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // Adjusted for more padding (24 padding on each side, so 48 total)

// Define colors in a shared object for consistency
const colors = {
  primaryGreen: '#4CAF50', // A vibrant green
  darkerGreen: '#388E3C', // A slightly darker green for active states/accents
  lightGreen: '#F0F8F0', // Very light green for backgrounds
  accentGreen: '#8BC34A', // Another shade of green if needed
  textPrimary: '#333333', // Dark text for readability
  textSecondary: '#666666', // Lighter text for secondary info
  white: '#FFFFFF',
  greyBorder: '#DDDDDD', // Light grey for borders and lines
  lightGreyBackground: '#FAFAFA', // General light background
  errorRed: '#e53935', // For prices and errors
};

const ProductList = ({ route }) => {
  const navigation = useNavigation(); // Initialize navigation hook
  const { user } = route.params;
  const [activeTab, setActiveTab] = useState('Home'); // ✅ ACTIVE TAB STATE
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // IMPORTANT: Replace this with your actual API base URL
  const API_BASE = 'http://192.168.250.53/koncepto-app/api';

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
          // Add 'All' category at the beginning
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
      style={styles.cardWrapper} // Added a wrapper for consistent spacing
      onPress={() => navigation.navigate('ProductDetail', { product: item, user })}
    >
      <View style={styles.card}>
        <Image
          source={{ uri: `${API_BASE.replace('/api', '/assets')}/${item.image}` }} // Corrected image path
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

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => {
          setActiveTab('CustomOrder'); // Optionally set active tab to message
          navigation.navigate('CustomOrder', { user }); // Navigate to the Message screen
        }}
      >
        <Ionicons name="create-outline" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => { setActiveTab('Home'); /* navigation.navigate('ProductList', { user }); // Already on ProductList */ }}
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
    backgroundColor: colors.lightGreyBackground, // Use light grey background
  },
  // Header Styles
  header: {
    backgroundColor: colors.primaryGreen,
    paddingTop: Platform.OS === 'android' ? 30 : 50, // Adjust for status bar
    paddingBottom: 15, // Increased padding
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 20, // Rounded bottom corners
    borderBottomRightRadius: 20,
    shadowColor: '#000', // Add shadow for depth
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  logo: {
    width: 150, // Slightly adjusted width
    height: 50, // Slightly adjusted height
    resizeMode: 'contain',
  },
  // Search & Filter Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, // Consistent padding
    paddingVertical: 10,
    backgroundColor: colors.white, // White background for search area
    marginHorizontal: 16,
    borderRadius: 10,
    marginTop: -20, // Overlap with header for a visually pleasing effect
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
    backgroundColor: colors.lightGreyBackground, // Lighter background for the input itself
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40, // Consistent height
    color: colors.textPrimary,
  },
  filterButton: {
    backgroundColor: colors.primaryGreen,
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Product List Styles
  list: {
    paddingHorizontal: 16, // Consistent padding
    paddingBottom: 100, // Make space for bottom nav
  },
  cardWrapper: {
    width: CARD_WIDTH,
    margin: 8, // Spacing between cards
  },
  card: {
    flex: 1, // Allow card to fill wrapper
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12, // Increased padding
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  image: {
    width: 100, // Slightly larger images
    height: 100, // Slightly larger images
    resizeMode: 'contain',
    marginBottom: 10,
  },
  name: {
    fontSize: 15, // Slightly larger font
    fontWeight: '500', // Medium weight for product names
    textAlign: 'center',
    marginBottom: 5,
    color: colors.textPrimary,
  },
  price: {
    fontWeight: 'bold',
    fontSize: 16, // Larger price font
    color: colors.errorRed, // Using a dedicated errorRed for prices for visibility
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
  // Bottom Navigation Styles
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.darkerGreen, // Darker green for a solid base
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10, // Increased padding
    borderTopLeftRadius: 20, // Rounded top corners
    borderTopRightRadius: 20,
    shadowColor: '#000', // Add shadow for depth
    shadowOffset: { width: 0, height: -3 }, // Shadow above
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8, // Higher elevation for bottom nav
  },
  navButton: {
    alignItems: 'center',
    paddingVertical: 5, // Keep small padding
    paddingHorizontal: 10,
    borderRadius: 10, // Slightly rounded corners
  },
  navLabel: {
    color: '#B0E0A0', // Lighter green for inactive labels
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  activeNavLabel: {
    color: colors.white, // White for active labels
    fontWeight: 'bold',
  },
  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Center the modal box
    backgroundColor: 'rgba(0,0,0,0.4)', // Slightly darker overlay
  },
  filterBox: {
    backgroundColor: colors.white,
    marginHorizontal: 30, // Less margin
    borderRadius: 15, // More rounded corners
    padding: 25, // Increased padding
    elevation: 10, // Stronger shadow
    width: '80%', // Make it take up a good portion of the width
  },
  filterTitle: {
    fontSize: 20, // Larger title
    fontWeight: 'bold',
    marginBottom: 15, // More space
    color: colors.textPrimary,
    textAlign: 'center', // Center align title
  },
  filterOptionButton: {
    paddingVertical: 12, // More padding for touch area
    paddingHorizontal: 10,
    borderBottomWidth: 1, // Add subtle dividers
    borderBottomColor: colors.greyBorder,
  },
  filterOptionText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  selectedFilterOption: {
    fontWeight: 'bold',
    color: colors.primaryGreen, // Primary green for selected option
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
  // FAB Styles
  fabButton: {
    position: 'absolute',
    bottom: 90, // Adjust based on bottom nav height + desired spacing
    right: 20,
    backgroundColor: colors.primaryGreen,
    width: 60,
    height: 60,
    borderRadius: 30, // Makes it a perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6, // Ensures it floats above other elements
    zIndex: 10, // Make sure it's on top
  },
});