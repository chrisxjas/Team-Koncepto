import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const messagesData = [
  {
    id: '1',
    sender: 'Koncepto',
    message: 'Good morning! maaari kayong magsend ng inyong mensahe sa pamamagitan ng messaging features ng Koncepto mobile application. Sabihin ang inyong nais at kami ay tutugon. Salamat!',
    time: 'Today 9:30pm',
    type: 'received',
  },
  {
    id: '2',
    sender: 'User',
    message: 'Good day, ma\'am/sir! May color pink po ba kayo ng Brother Printer L100? Yung may hello kitty sticker po sana at may hirono na palawit. Salamat po!',
    time: 'Today 9:32pm',
    type: 'sent',
  },
  {
    id: '3',
    sender: 'Koncepto',
    message: 'Magandang umaga ulit! Opo, meron po kami. :)',
    time: 'Today 9:32pm',
    type: 'received',
  },
  {
    id: '4',
    sender: 'User',
    message: 'Ok po, maraming salamat!',
    time: 'Now',
    type: 'sent',
  },
];

export default function MessageScreen() {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Message');
  const navigation = useNavigation();
  const route = useRoute();
  const user = route.params?.user;

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 16, color: 'red' }}>User not found. Please log in again.</Text>
      </View>
    );
  }

  const renderMessage = ({ item }) => {
    const isSent = item.type === 'sent';
    return (
      <View style={[styles.messageContainer, isSent ? styles.sent : styles.received]}>
        {!isSent && (
          <View style={styles.avatar}>
            <Ionicons name="person-circle-outline" size={30} color="gray" />
          </View>
        )}
        <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}>
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
          {isSent && item.time === 'Now' && (
            <Text style={styles.sentLabel}>Sent</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="menu" size={28} color="black" />
        <View style={styles.logoWrapper}>
          <Image source={require('./assets/logo.png')} style={styles.logo} />
        </View>
        <Ionicons name="settings-outline" size={24} color="black" />
      </View>

      {/* Chat Messages */}
      <FlatList
        data={messagesData}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatArea}
      />

      {/* Message Input */}
      <View style={styles.inputArea}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Please write a message"
          style={styles.input}
        />
        <TouchableOpacity style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
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
          }}
          style={[styles.navButton, activeTab === 'Message' && styles.activeButton]}
        >
          <Ionicons name="chatbubble" size={24} color="#fff" />
          <Text style={styles.navLabel}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('Carts');
            navigation.navigate('Carts', { user });
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21981fff',
    height: 100,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    position: 'relative',
  },
  logoWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logo: {
    height: 60,
    resizeMode: 'contain',
  },
  chatArea: {
    padding: 10,
    paddingBottom: 100,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  received: {
    justifyContent: 'flex-start',
  },
  sent: {
    justifyContent: 'flex-end',
  },
  avatar: {
    marginRight: 8,
  },
  bubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 15,
  },
  bubbleReceived: {
    backgroundColor: '#ffffff',
  },
  bubbleSent: {
    backgroundColor: '#d9d9d9',
  },
  messageText: {
    fontSize: 14,
  },
  timeText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'right',
    marginTop: 5,
  },
  sentLabel: {
    fontSize: 10,
    textAlign: 'right',
    color: '#777',
    fontStyle: 'italic',
  },
  inputArea: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  input: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#2ba310',
    marginLeft: 10,
    padding: 10,
    borderRadius: 20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#2ba310',
    width: '100%',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  navLabel: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
