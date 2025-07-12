import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';

export default function Profile({ route, navigation }) {
  const userFromParams = route.params?.user || {};
  const [user, setUser] = useState(userFromParams);
  const [selected1, setSelected1] = useState(false);
  const [selected2, setSelected2] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access media library is required!');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets?.length > 0) {
        uploadImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);

    try {
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('photo', {
        uri,
        name: filename,
        type,
      });

      formData.append('user_id', user.id);

      const response = await fetch('http://192.168.250.53/koncepto-app/api/upload-profile-image.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const resJson = await response.json();

      if (resJson.success && resJson.image_url) {
        setUser((prev) => ({ ...prev, image_url: resJson.image_url }));
        Alert.alert('Success', 'Profile picture updated.');
      } else {
        Alert.alert('Upload failed', resJson.message || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Upload error', 'Failed to upload image.');
    } finally {
      setUploading(false);
      setModalVisible(false);
    }
  };

  const handleEditPicture = () => {
    setModalVisible(false);
    pickImage();
  };

  const handleDeletePicture = () => {
    setModalVisible(false);
    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `http://192.168.250.53/koncepto-app/api/delete-profile-image.php?user_id=${user.id}`,
              );
              const resJson = await response.json();
              if (resJson.success) {
                setUser((prev) => ({ ...prev, image_url: null }));
                Alert.alert('Deleted', 'Profile picture deleted.');
              } else {
                Alert.alert('Error', resJson.message || 'Could not delete profile picture.');
              }
            } catch {
              Alert.alert('Error', 'Failed to delete profile picture.');
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.profileIcon}>
            {user.image_url ? (
              <Image
                source={{ uri: `http://192.168.250.53/koncepto-app/uploads/${user.image_url}` }}
                style={styles.profileImage}
              />
            ) : (
              <Ionicons name="person-circle-outline" size={50} color="white" />
            )}
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.f_name ?? 'First Name'} {user.l_name ?? 'Last Name'}</Text>
            <Text style={styles.school}>{user.role ? `Role: ${user.role}` : 'Role: User'}</Text>
            <Text style={styles.email}>{user.email ?? 'email@example.com'}</Text>
          </View>
          <TouchableOpacity style={styles.settingsIcon}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Items</Text>
          <Text style={styles.description}>
            View a list of items you might want to buy, based on the items you frequently purchased each quarter.
          </Text>

          <View style={styles.recommendBox}>
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={24} />
              <Text style={styles.recommendText}>
                on every <Text style={styles.bold}>MARCH</Text> of two consecutive years you’ve purchased these
                items:
              </Text>
            </View>

            <View style={styles.itemRow}>
              <Checkbox value={selected1} onValueChange={setSelected1} color={selected1 ? '#4CAF50' : undefined} />
              <Text style={styles.itemText}>Bond Paper A4 - ₱531</Text>
            </View>

            <View style={styles.itemRow}>
              <Checkbox value={selected2} onValueChange={setSelected2} color={selected2 ? '#4CAF50' : undefined} />
              <Text style={styles.itemText}>Brother Printer - ₱14,800</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cartButton}>
                <Text style={styles.buttonText}>Add to Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buyButton}>
                <Text style={styles.buttonText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>My Purchases</Text>
            <TouchableOpacity>
              <Text style={styles.link}>View Purchase History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.purchaseRow}>
            <TouchableOpacity style={styles.purchaseItem}>
              <FontAwesome name="credit-card" size={24} />
              <Text>To Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.purchaseItem}>
              <Ionicons name="checkmark-circle-outline" size={24} />
              <Text>To Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.purchaseItem}>
              <Ionicons name="cube-outline" size={24} />
              <Text>To Receive</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.purchaseItem}>
              <MaterialIcons name="star-border" size={24} />
              <Text>To Rate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.supportItem}>
            <Ionicons name="help-circle-outline" size={22} />
            <Text style={styles.supportText}>Help Center</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportItem}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} />
            <Text style={styles.supportText}>Chat with Koncepto</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('ProductList', { user })}>
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

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalView}>
            {uploading ? (
              <ActivityIndicator size="large" color="#4CAF50" />
            ) : (
              <>
                <TouchableOpacity onPress={handleEditPicture} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Edit Profile Picture</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeletePicture} style={[styles.modalButton, { borderTopWidth: 1, borderTopColor: '#ccc' }]}>
                  <Text style={[styles.modalButtonText, { color: 'red' }]}>Delete Profile Picture</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, { borderTopWidth: 1, borderTopColor: '#ccc' }]}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f7f8fa', flex: 1 },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: { marginRight: 10 },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  name: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  school: { color: 'white', fontSize: 14 },
  email: { color: 'white', fontSize: 12 },
  settingsIcon: { marginLeft: 'auto' },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
  },
  recommendBox: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendText: {
    marginLeft: 8,
    flex: 1,
  },
  bold: { fontWeight: 'bold' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  itemText: { marginLeft: 10 },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  cartButton: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 5,
  },
  buyButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: { color: '#4CAF50', fontSize: 13 },
  purchaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  purchaseItem: { alignItems: 'center' },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  supportText: { marginLeft: 10, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: 'white',
    paddingBottom: 20,
  },
  modalButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
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
});
