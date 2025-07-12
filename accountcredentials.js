import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function AccountCredentials({ navigation, route }) {
  const { fName, lName, cpNo, role = 'user' } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const remarks = 'active';

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[A-Za-z])(?=.*\d|.*[^A-Za-z\d])[\S]{8,}$/.test(password);

  const handleRegister = async () => {
    setEmailError('');
    setPasswordError('');

    let valid = true;

    if (!email.trim()) {
      setEmailError('Fill this out');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError('Fill this out');
      valid = false;
    } else if (!validatePassword(password)) {
      setPasswordError('Password must be at least 8 characters and contain letters + numbers or symbols');
      valid = false;
    }

    if (!valid) return;

    const body = {
      f_name: fName,
      l_name: lName,
      cp_no: cpNo,
      role,
      email,
      password,
      remarks,
    };

    try {
      const response = await fetch('http://192.168.250.53/koncepto-app/api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'Account created. Please login.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Account creation failed.');
      }
    } catch (error) {
      console.log('Fetch error:', error);
      Alert.alert('Error', 'Server connection failed.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>Set Email and Password</Text>

          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          <TextInput
            style={[styles.input, passwordError ? styles.inputError : null]}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Back to Personal Details</Text>
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
  errorText: { color: 'red', fontSize: 12, marginBottom: 5, marginLeft: 5 },
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
  backLink: {
    marginTop: 15,
    textAlign: 'center',
    color: '#58B32D',
  },
});
