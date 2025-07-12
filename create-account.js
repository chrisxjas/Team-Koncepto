import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function PersonalDetails({ navigation }) {
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [cpNo, setCpNo] = useState('');

  const [fNameError, setFNameError] = useState('');
  const [lNameError, setLNameError] = useState('');
  const [cpNoError, setCpNoError] = useState('');

  const formatCpNo = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    if (digits.length < 5) return digits;
    if (digits.length < 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  };

  const handleCpNoChange = (text) => {
    setCpNo(formatCpNo(text));
  };

  const handleNext = () => {
    let valid = true;

    setFNameError('');
    setLNameError('');
    setCpNoError('');

    if (!fName.trim()) {
      setFNameError('Fill this out');
      valid = false;
    }

    if (!lName.trim()) {
      setLNameError('Fill this out');
      valid = false;
    }

    const rawCpNo = cpNo.replace(/\D/g, '');
    if (!rawCpNo) {
      setCpNoError('Fill this out');
      valid = false;
    } else if (rawCpNo.length !== 11) {
      setCpNoError('Contact number must be exactly 11 digits');
      valid = false;
    }

    if (!valid) return;

    // Navigate with unformatted number (optional: store formatted version instead)
    navigation.navigate('AccountCredentials', {
      fName: fName.trim(),
      lName: lName.trim(),
      cpNo: rawCpNo,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>Enter Personal Details</Text>

          {fNameError ? <Text style={styles.errorText}>{fNameError}</Text> : null}
          <TextInput
            style={[styles.input, fNameError ? styles.inputError : null]}
            placeholder="First Name"
            value={fName}
            onChangeText={setFName}
          />

          {lNameError ? <Text style={styles.errorText}>{lNameError}</Text> : null}
          <TextInput
            style={[styles.input, lNameError ? styles.inputError : null]}
            placeholder="Last Name"
            value={lName}
            onChangeText={setLName}
          />

          {cpNoError ? <Text style={styles.errorText}>{cpNoError}</Text> : null}
          <TextInput
            style={[styles.input, cpNoError ? styles.inputError : null]}
            placeholder="Contact No. (11 digits)"
            value={cpNo}
            onChangeText={handleCpNoChange}
            keyboardType="number-pad"
            maxLength={13} // includes dashes
          />

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Back to Login</Text>
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
  nextButton: {
    backgroundColor: '#58B32D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  nextText: { color: '#fff', fontWeight: 'bold' },
  backLink: {
    marginTop: 15,
    textAlign: 'center',
    color: '#58B32D',
  },
});
