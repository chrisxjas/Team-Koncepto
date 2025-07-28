import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  Alert, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  red: '#E53935',
  orange: '#FF9800',
  blue: '#2196F3',
  gold: '#FFD700',
};

const API = 'http://192.168.250.53/koncepto-app/api'; // Ensure your IP is correct

const ProductDetail = ({ route, navigation }) => {
  const { product, user } = route.params || {};
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, [product?.id]);

  const fetchFeedbacks = () => {
    if (product?.id) {
      fetch(`${API}/get-feedbacks.php?product_id=${product.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFeedbacks(data.data);
          }
        })
        .catch(err => {
          console.error('Fetch feedbacks error:', err);
          Alert.alert('Error', 'Failed to load feedbacks.');
        });
    }
  };

  const handleLikeToggle = (feedbackId, currentLikeCount, hasUserLiked) => {
    // Optimistically update UI
    setFeedbacks(prevFeedbacks =>
      prevFeedbacks.map(fb =>
        fb.id === feedbackId
          ? { ...fb, like: hasUserLiked ? Math.max(0, currentLikeCount - 1) : currentLikeCount + 1 }
          : fb
      )
    );

    // Send request to backend
    fetch(`${API}/toggle-feedback-like.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedback_id: feedbackId,
        user_id: user.id, // Pass user ID to track who liked
        action: hasUserLiked ? 'unlike' : 'like'
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          // Revert UI if backend fails (optional but good practice)
          setFeedbacks(prevFeedbacks =>
            prevFeedbacks.map(fb =>
              fb.id === feedbackId
                ? { ...fb, like: hasUserLiked ? currentLikeCount + 1 : Math.max(0, currentLikeCount - 1) } // Revert to original
                : fb
            )
          );
          Alert.alert('Error', data.message || 'Failed to update like status.');
        }
        // If success, UI is already updated, no need to re-fetch
      })
      .catch(error => {
        console.error('Toggle like error:', error);
        Alert.alert('Error', 'Network error while updating like status.');
        // Revert UI on network error
        setFeedbacks(prevFeedbacks =>
          prevFeedbacks.map(fb =>
            fb.id === feedbackId
              ? { ...fb, like: hasUserLiked ? currentLikeCount + 1 : Math.max(0, currentLikeCount - 1) }
              : fb
          )
        );
      });
  };

  const handleAddToCart = () => {
    if (!user?.id || !product?.id) {
      Alert.alert("Error", "Missing user or product info. Please log in again.");
      return;
    }

    const payload = {
      user_id: user.id,
      product_id: product.id,
      quantity: Number(quantity),
      replace: false
    };

    fetch(`${API}/add-to-cart.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShowModal(false);
          Alert.alert('Success', 'Item added to cart!');
          // You might want to navigate to cart or update cart count
          navigation.navigate('Carts', { user }); // Consider replace or just navigate
        } else {
          Alert.alert('Error', data.message || 'Failed to add to cart.');
        }
      })
      .catch(error => {
        console.error('Add to cart error:', error);
        Alert.alert('Error', 'Network error. Please try again.');
      });
  };

  const handleBuyNow = () => {
    if (!user?.id || !product?.id) {
      Alert.alert("Error", "Missing user or product info. Please log in again.");
      return;
    }
    navigation.navigate('PlaceRequest', {
      user,
      selectedItems: [{
        product_id: product.id,
        productName: product.productName,
        price: parseFloat(product.price), // Ensure price is numeric
        image: product.image,
        quantity,
      }],
      total: quantity * parseFloat(product.price) // Calculate total for selected items
    });
    setShowModal(false);
  };

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Product details not available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={{ width: 24 }} /> {/* To balance the space of the back icon */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Product Details Card */}
        <View style={styles.productDetailsCard}>
          <Image
            source={{ uri: `${API.replace('/api', '')}/assets/${product.image}` }}
            style={styles.image}
          />
          <Text style={styles.name}>{product.productName}</Text>
          <Text style={styles.brand}>{product.brandName}</Text>
          <Text style={styles.description}>{product.description || 'No description available.'}</Text>
          <Text style={styles.price}>₱ {parseFloat(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>

        {/* Ratings Section Card */}
        <View style={styles.ratingsSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.ratingsTitle}>Ratings & Feedback</Text>
            {feedbacks.length > 1 && (
              <TouchableOpacity onPress={() => setShowAllFeedbacks(!showAllFeedbacks)}>
                <Text style={styles.showMoreBtn}>
                  {showAllFeedbacks ? 'Show less' : 'Show more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.separator} />

          {feedbacks.length === 0 && (
            <Text style={styles.noFeedback}>No feedback yet for this product.</Text>
          )}

          {(showAllFeedbacks ? feedbacks : feedbacks.slice(0, 1)).map((fb, index) => (
            <View key={fb.id || index} style={[styles.feedbackItem, index === feedbacks.slice(0, 1).length - 1 && !showAllFeedbacks ? styles.feedbackItemLast : {}]}>
              <Text style={styles.feedbackName}>{fb.user_name}</Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Ionicons
                    key={i}
                    name={i <= fb.star ? 'star' : 'star-outline'}
                    size={14}
                    color={colors.gold}
                  />
                ))}
              </View>

              <Text style={styles.feedbackText}>{fb.feedback}</Text>

              {/* Assuming 'like' field indicates count and you'd need to track user's like status on backend */}
              <TouchableOpacity
                style={styles.likeRow}
                // Pass current count and whether the user has liked (if backend provides this info)
                // For now, assuming fb.like > 0 means the user can unlike, otherwise like
                onPress={() => handleLikeToggle(fb.id, fb.like || 0, fb.user_liked_this_feedback)} // user_liked_this_feedback needs to come from API
              >
                <Ionicons
                  // This icon logic requires backend to tell if current user liked it
                  name={fb.user_liked_this_feedback ? 'heart' : 'heart-outline'}
                  size={14}
                  color={colors.red}
                />
                <Text style={styles.likeCount}>{fb.like || 0}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Add to Cart / Buy Now Buttons */}
      <View style={styles.fixedButtons}>
        <TouchableOpacity style={styles.btnAdd} onPress={() => { setIsBuyNow(false); setShowModal(true); }}>
          <Text style={styles.btnText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnBuy} onPress={() => { setIsBuyNow(true); setShowModal(true); }}>
          <Text style={styles.btnText}>Buy Now</Text>
        </TouchableOpacity>
      </View>

      {/* Quantity Selection Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.closeBtnAbove} onPress={() => setShowModal(false)}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.modalFullWidthBar}>
            <View style={styles.qtyControls}>
              <TouchableOpacity style={styles.squareBtn} onPress={() => setQuantity(prev => Math.max(1, prev - 1))}>
                <Ionicons name="remove" size={18} color={colors.primaryGreen} />
              </TouchableOpacity>

              <Text style={styles.qty}>{quantity}</Text>

              <TouchableOpacity style={styles.squareBtn} onPress={() => setQuantity(prev => prev + 1)}>
                <Ionicons name="add" size={18} color={colors.primaryGreen} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => {
                isBuyNow ? handleBuyNow() : handleAddToCart();
              }}
            >
              <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 14 }}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ProductDetail;

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
  scrollViewContent: {
    paddingBottom: 100, // Ensure content isn't hidden by the fixed buttons
  },
  // Card styling for main product details
  productDetailsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 250, // Slightly taller image
    resizeMode: 'contain',
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: colors.lightGreyBackground, // Placeholder background
  },
  name: {
    fontSize: 24, // Larger title
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  brand: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20, // Improved readability
    marginBottom: 15,
  },
  price: {
    fontSize: 22, // Larger price
    fontWeight: 'bold',
    color: colors.darkerGreen, // Green for price
    marginBottom: 15,
  },

  // Card styling for ratings section
  ratingsSection: {
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
    marginBottom: 15, // Provide enough space from the bottom buttons
  },
  separator: {
    borderBottomWidth: 1,
    borderColor: colors.greyBorder,
    marginVertical: 10,
  },
  ratingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  noFeedback: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  feedbackItem: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.greyBorder,
  },
  feedbackItemLast: {
    borderBottomWidth: 0, // No border for the last item in the list
  },
  feedbackName: {
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 3,
    fontSize: 14,
  },
  showMoreBtn: {
    color: colors.primaryGreen,
    fontSize: 13,
    fontWeight: 'bold',
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 5,
    gap: 2,
  },
  feedbackText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  likeCount: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Fixed action buttons at the bottom
  fixedButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  btnAdd: {
    backgroundColor: colors.accentGreen, // Lighter green for Add to Cart
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBuy: {
    backgroundColor: colors.primaryGreen, // Primary green for Buy Now
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    textAlign: 'center',
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)', // Darker overlay
  },
  modalFullWidthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    borderTopLeftRadius: 20, // More rounded corners
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  closeBtnAbove: {
    position: 'absolute',
    right: 25,
    bottom: 90, // Positioned above the modal bar
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightGreyBackground,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensure it's clickable above the overlay
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  squareBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  confirmBtn: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  qty: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});