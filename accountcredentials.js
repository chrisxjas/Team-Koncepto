import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function AccountCredentials({ navigation, route }) {
  const { first_Name, last_Name, cp_No, schoolId, credentialsFile = 'user' } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const remarks = 'active';

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 8;

  const handleRegister = async () => {
    setEmailError('');
    setPasswordError('');
    let valid = true;

    if (!email.trim()) {
      setEmailError('Required');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Invalid email');
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError('Required');
      valid = false;
    } else if (!validatePassword(password)) {
      setPasswordError('Min 8 characters');
      valid = false;
    }

    if (!valid) return;

    const formData = new FormData();
    formData.append('first_name', route.params.first_name);
    formData.append('last_name', route.params.last_name);
    formData.append('cp_no', route.params.cp_no);
    formData.append('school_id', route.params.school_id);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('credentials', {
      uri: route.params.credentialsFile.uri,
      name: route.params.credentialsFile.name,
      type: route.params.credentialsFile.mimeType || 'application/pdf',
});


    try {10
      const response = await fetch('http://192.168.250.53/koncepto-app/api/register.php', {
        method: 'POST',
        body: formData,
        // IMPORTANT: DO NOT set 'Content-Type' manually
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert('Success', 'Account created.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Account creation failed.');
      }
    } catch (error) {
      console.log('Fetch error:', error);
      Alert.alert('Error', 'Server error.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>Set Email and Password</Text>

          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError && <Text style={styles.errorText}>{emailError}</Text>}

          <TextInput
            style={[styles.input, passwordError && styles.inputError]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>

          <StatusBar style="auto" />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  errorText: { color: 'red', fontSize: 12, marginBottom: 5 },
  input: {
    height: 45,
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputError: { borderBottomColor: 'red' },
  registerButton: {
    backgroundColor: '#58B32D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: { color: '#fff', fontWeight: 'bold' },
});
