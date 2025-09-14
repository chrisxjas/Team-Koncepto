import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback, Alert, ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BASE_URL } from './config';
import { Ionicons } from '@expo/vector-icons';

export default function AccountCredentials({ navigation, route }) {
  const { first_name, last_name, cp_no } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Verification state
  const [serverCode, setServerCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('idle'); 
  // idle | codeSent | verifying | verified

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => {
    // At least 8 chars, with numbers, letters, and symbols
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(password);
  };

  // Send verification code
  const handleSendCode = async () => {
    if (!email.trim() || !validateEmail(email)) {
      setEmailError('Enter valid email first');
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/send-verification.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (result.success) {
        setServerCode(result.code.toString());
        setVerificationStatus('codeSent');
        Alert.alert('Verification Sent', 'Check your email for the code.');
      } else {
        Alert.alert('Error', result.message || 'Failed to send code.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Server error. Try again later.');
    }
  };

  // Verify code
  const handleVerifyCode = async () => {
    if (!userCode.trim()) {
      setEmailError('Enter the code sent to your email');
      return;
    }
    setVerificationStatus('verifying');
    setTimeout(() => {
      if (userCode === serverCode) {
        setVerificationStatus('verified');
        setEmailError('');
      } else {
        setVerificationStatus('codeSent');
        setEmailError('Invalid verification code');
      }
    }, 1500); // simulate loading
  };

  // Register only when verified
  const handleRegister = async () => {
    setPasswordError('');
    if (!password.trim()) {
      setPasswordError('Required');
      return;
    } else if (!validatePassword(password)) {
      setPasswordError('Min 8 chars, must include letters, numbers, and symbols');
      return;
    }

    const formData = new FormData();
    formData.append('first_name', first_name);
    formData.append('last_name', last_name);
    formData.append('cp_no', cp_no);
    formData.append('email', email);
    formData.append('password', password);

    try {
      const response = await fetch(`${BASE_URL}/register.php`, {
        method: 'POST',
        body: formData,
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
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Server error. Try again later.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>Set Email and Password</Text>

          {/* Email + Send/Verify Button */}
          <View style={styles.emailRow}>
            <TextInput
              style={[styles.input, emailError && styles.inputError, { flex: 1 }]}
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setUserCode('');
                setEmailError('');
                if (verificationStatus === 'verified') {
                  setVerificationStatus('idle');
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {verificationStatus === 'idle' || verificationStatus === 'codeSent' ? (
              <TouchableOpacity onPress={verificationStatus === 'idle' ? handleSendCode : handleVerifyCode}>
                <Text style={styles.actionText}>
                  {verificationStatus === 'idle' ? 'Send Code' : 'Verify'}
                </Text>
              </TouchableOpacity>
            ) : verificationStatus === 'verifying' ? (
              <ActivityIndicator size="small" color="#28a745" />
            ) : (
              <Ionicons name="checkmark-circle" size={24} color="green" />
            )}
          </View>
          {verificationStatus === 'codeSent' && (
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
              placeholder="Enter verification code"
              value={userCode}
              onChangeText={setUserCode}
              keyboardType="number-pad"
            />
          )}
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          {/* Password */}
          <TextInput
            style={[styles.input, passwordError && styles.inputError]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              verificationStatus !== 'verified' && { backgroundColor: '#ccc' },
            ]}
            onPress={handleRegister}
            disabled={verificationStatus !== 'verified'}
          >
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
  emailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  actionText: { color: '#28a745', marginLeft: 10, fontWeight: 'bold' },
  input: {
    height: 45,
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputError: { borderBottomColor: 'red' },
  registerButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: { color: '#fff', fontWeight: 'bold' },
});
