import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Message() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: "Good morning! Maaari kayong mag-send...", sender: 'bot', time: 'Today 9:30pm' },
    { id: '2', text: "Goo day, ma'am/sir! May color pink po ba kayo...", sender: 'user', time: 'Today 9:30pm' },
    { id: '3', text: "Magandang umaga ulit! Opo, meron po kami. :)", sender: 'bot', time: 'Today 9:32pm' },
  ]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), text: message.trim(), sender: 'user', time: 'Now' },
      ]);
      setMessage('');
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.botMessage,
          isUser ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.messageTime}>{item.time}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Please write a message"
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#2ba310" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  messagesList: { padding: 10 },
  messageContainer: {
    maxWidth: '80%',
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
  },
  userMessage: {
    backgroundColor: '#e5e7eb', // light gray
  },
  botMessage: {
    backgroundColor: '#d1fae5', // light green
  },
  messageText: { fontSize: 14, color: '#111' },
  messageTime: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
  },
});
