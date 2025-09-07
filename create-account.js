import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from 'expo-status-bar';
import { BASE_URL } from './config'

export default function CreateAccount({ navigation }) {
  const [first_Name, setFirst_Name] = useState('');
  const [last_Name, setLast_Name] = useState('');
  const [cpNo, setCpNo] = useState('');
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch(`${BASE_URL}/get-schools.php`);
        const data = await response.json();
        setSchools(data.schools || []);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      }
    };
    fetchSchools();
  }, []);

  const formatCpNo = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    if (digits.length < 5) return digits;
    if (digits.length < 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  };

  const handleCpNoChange = (text) => {
    setCpNo(formatCpNo(text));
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
    });
    if (result.assets && result.assets.length > 0) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handleNext = () => {
    const rawCpNo = cpNo.replace(/\D/g, '');
    const newErrors = {};
    if (!first_Name.trim()) newErrors.first_Name = 'Required';
    if (!last_Name.trim()) newErrors.last_Name = 'Required';
    if (!rawCpNo || rawCpNo.length !== 11) newErrors.cpNo = 'Enter valid 11-digit number';
    if (!selectedSchool) newErrors.school = 'Select a school';
    if (!selectedFile) newErrors.file = 'Select a file';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      navigation.navigate('AccountCredentials', {
        first_name: first_Name.trim(),
        last_name: last_Name.trim(),
        cp_no: rawCpNo,
        school_id: selectedSchool,
        credentialsFile: selectedFile,
      });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            style={[styles.input, errors.first_Name && styles.inputError]}
            placeholder="First Name"
            value={first_Name}
            onChangeText={setFirst_Name}
          />
          {errors.first_Name && <Text style={styles.errorText}>{errors.first_Name}</Text>}

          <TextInput
            style={[styles.input, errors.last_Name && styles.inputError]}
            placeholder="Last Name"
            value={last_Name}
            onChangeText={setLast_Name}
          />
          {errors.last_Name && <Text style={styles.errorText}>{errors.last_Name}</Text>}

          <TextInput
            style={[styles.input, errors.cpNo && styles.inputError]}
            placeholder="Contact Number"
            value={cpNo}
            onChangeText={handleCpNoChange}
            keyboardType="number-pad"
            maxLength={13}
          />
          {errors.cpNo && <Text style={styles.errorText}>{errors.cpNo}</Text>}

          <View style={[styles.dropdown, errors.school && styles.inputError]}>
            <Picker
              selectedValue={selectedSchool}
              onValueChange={(value) => setSelectedSchool(value)}
            >
              <Picker.Item label="Select School" value="" />
              {schools.map((school) => (
                <Picker.Item key={school.id} label={school.school_name} value={school.id} />
              ))}
            </Picker>
          </View>
          {errors.school && <Text style={styles.errorText}>{errors.school}</Text>}

          <TouchableOpacity style={styles.filePicker} onPress={pickFile}>
            <Text>{selectedFile ? selectedFile.name : 'Select File'}</Text>
          </TouchableOpacity>
          {errors.file && <Text style={styles.errorText}>{errors.file}</Text>}

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>Next</Text>
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
  dropdown: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    marginBottom: 15,
  },
  filePicker: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#58B32D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontWeight: 'bold' },
});
