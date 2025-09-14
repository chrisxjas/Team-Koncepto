import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  FlatList, Alert, ScrollView, SafeAreaView, Platform, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { BASE_URL } from './config';


const { height: screenHeight } = Dimensions.get('window');

const colors = {
  primaryGreen: '#4CAF50',
  darkerGreen: '#388E3C',
  lightGreen: '#F0F8F0',
  accentGreen: '#8BC344',
  textPrimary: '#333333',
  textSecondary: '#666666',
  white: '#FFFFFF',
  greyBorder: '#DDDDDD',
  lightGreyBackground: '#FAFAFA',
  errorRed: '#e53935',
};

const PlaceRequest = ({ route, navigation }) => {
  const { user, selectedItems, total, onCheckoutSuccess } = route.params;
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPaymentProof(result.assets[0].uri);
    }
  };

  const handlePlaceRequest = async () => {
    if (!selectedPayment) {
      Alert.alert('Error', 'Please select a payment method.');
      return;
    }

    if (selectedPayment === 'GCash' && !paymentProof) {
      Alert.alert('Error', 'Please upload your GCash payment proof.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('total_price', total);
      formData.append('payment_method', selectedPayment);
      formData.append('order_date', new Date().toISOString().split('T')[0]);
      formData.append('ship_date', '2025-07-25');

      formData.append('items', JSON.stringify(selectedItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }))));

      if (paymentProof) {
        const filename = paymentProof.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('payment_proof', {
          uri: paymentProof,
          name: filename,
          type: type,
        });
      }

      const response = await fetch(`${BASE_URL}/place-request.php`, {
        method: 'POST',
        body: formData,
      });

      const text = await response.text();
      console.log('RAW RESPONSE:', text);

      const result = JSON.parse(text);

      if (result.success) {
        Alert.alert('Success', 'Your request has been placed!');
        if (onCheckoutSuccess) onCheckoutSuccess();
        if (result.screen === 'to-confirm') {
          navigation.navigate('ToConfirm', { user });
        } else {
          navigation.navigate('ToPay', { user });
        }
      } else {
        Alert.alert('Error', result.message || 'Failed to place request.');
      }
    } catch (error) {
      console.error('Place Request Error:', error);
      Alert.alert('Error', 'Something went wrong while placing the request. Please try again.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Image
        source={{ uri: `${BASE_URL.replace('/api', '')}/assets/${item.image}` }}
        style={styles.productImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.productName}</Text>
        <Text style={styles.itemPrice}>₱ {parseFloat(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
      </View>
    </View>
  );
  // ******************************

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image source={require('../koncepto-app/assets/logo.png')} style={styles.logo} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={18} color={colors.primaryGreen} />
          <Text style={styles.sectionHeading}>Shipping Address</Text>
        </View>
        <Text style={styles.shippingTextBold}>{user.first_name} {user.last_name}</Text>
        <Text style={styles.shippingText}>{user.cp_no}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollableContent}>
        <View style={[styles.section, styles.orderSummarySection]}>
          <View style={styles.row}>
            <Ionicons name="cart-outline" size={18} color={colors.primaryGreen} />
            <Text style={styles.sectionHeading}>Order Summary</Text>
          </View>
          <FlatList
            data={selectedItems}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.emptyListText}>No items in your order.</Text>}
          />
        </View>
      </ScrollView>

      <View style={styles.fixedBottomContainer}>
        <View style={styles.fixedBottomContent}>
          <View style={styles.row}>
            <Ionicons name="wallet-outline" size={18} color={colors.primaryGreen} />
            <Text style={styles.paymentSectionHeading}>Select Payment Method</Text>
          </View>

          <TouchableOpacity
            style={[styles.paymentOption, selectedPayment === 'Cash' && styles.selected]}
            onPress={() => setSelectedPayment('Cash')}
          >
            <FontAwesome5 name="money-bill-wave" size={20} color={colors.darkerGreen} />
            <Text style={styles.paymentText}>Cash on Delivery</Text>
            <Ionicons name={selectedPayment === 'Cash' ? 'radio-button-on' : 'radio-button-off'} size={20} color={colors.darkerGreen} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, selectedPayment === 'GCash' && styles.selected]}
            onPress={() => setSelectedPayment('GCash')}
          >
            <FontAwesome5 name="google-wallet" size={20} color={colors.darkerGreen} />
            <Text style={styles.paymentText}>GCash</Text>
            <Ionicons name={selectedPayment === 'GCash' ? 'radio-button-on' : 'radio-button-off'} size={20} color={colors.darkerGreen} />
          </TouchableOpacity>

          {selectedPayment === 'GCash' && (
            <View style={styles.gcashUploadContainer}>
              <Text style={styles.gcashInstructions}>
                Please send your payment to: {'\n'}
                <Text style={{ fontWeight: 'bold' }}>GCash Name: Juan Dela Cruz</Text>{'\n'}
                <Text style={{ fontWeight: 'bold' }}>GCash Number: 0917XXXXXXX</Text>
              </Text>
              <TouchableOpacity onPress={pickImage} style={styles.uploadBtn}>
                <Ionicons name="cloud-upload-outline" size={20} color={colors.primaryGreen} />
                <Text style={styles.uploadBtnText}>
                  {paymentProof ? 'Change Payment Proof' : 'Upload GCash Payment Proof'}
                </Text>
              </TouchableOpacity>
              {paymentProof && (
                <Image
                  source={{ uri: paymentProof }}
                  style={styles.paymentProofImage}
                />
              )}
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Order Total:</Text>
            <Text style={styles.totalText}>₱ {parseFloat(total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <TouchableOpacity style={styles.placeButton} onPress={handlePlaceRequest}>
            <Text style={styles.placeButtonText}>PLACE REQUEST</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PlaceRequest;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.lightGreen,
  },
  header: {
    backgroundColor: colors.primaryGreen,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 30,
  },
  logo: {
    width: 120,
    height: 50,
    resizeMode: 'contain',
  },
  section: {
    backgroundColor: colors.white,
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  orderSummarySection: {
    // This section is now explicitly part of the scrollable content
  },
  scrollableContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontWeight: 'bold',
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  paymentSectionHeading: {
    fontWeight: 'bold',
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
    marginBottom: 0,
  },
  shippingTextBold: {
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  shippingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGreyBackground,
    marginBottom: 8,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.greyBorder,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.greyBorder,
    backgroundColor: '#eee',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  itemPrice: {
    color: colors.errorRed,
    marginTop: 4,
    fontSize: 13,
    fontWeight: 'bold',
  },
  itemQty: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyListText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    fontSize: 14,
  },
  fixedBottomContainer: {
    backgroundColor: colors.lightGreen,
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  fixedBottomContent: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryGreen,
  },
  placeButton: {
    backgroundColor: colors.darkerGreen,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.greyBorder,
  },
  selected: {
    borderColor: colors.primaryGreen,
    borderWidth: 2,
  },
  paymentText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  gcashUploadContainer: {
    backgroundColor: colors.lightGreyBackground,
    padding: 15,
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: colors.greyBorder,
    marginBottom: 10,
  },
  gcashInstructions: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
    lineHeight: 20,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    marginTop: 5,
  },
  uploadBtnText: {
    color: colors.primaryGreen,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 13,
  },
  paymentProofImage: {
    width: '100%',
    height: 200,
    marginTop: 15,
    borderRadius: 8,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: colors.greyBorder,
  },
});