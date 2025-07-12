import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import 'react-native-url-polyfill/auto';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  AppRegistry,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { name as appName } from './app.json';

// Screens
import ProductList from './product-list';
import PersonalDetails from './create-account';
import AccountCredentials from './accountcredentials';
import Message from './message';
import Profile from './profile';
import ProductDetail from './product-detail';

const Stack = createNativeStackNavigator();

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [secureText, setSecureText] = useState(true);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    let valid = true;
    if (!email) {
      setEmailError('Write an email');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please input correct email format');
      valid = false;
    }

    if (!password) {
      setPasswordError('Write a password');
      valid = false;
    }

    if (!valid) return;

    try {
      const response = await fetch('http://192.168.250.53/koncepto-app/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log("Server result:", result);

      if (result.success) {
        navigation.navigate('ProductList', { user: result.user });
      } else {
        console.log("Login failed reason:", result.message);
        if (result.message === 'Incorrect password') {
          setPasswordError('Incorrect password');
        } else if (result.message === 'Email not found') {
          Alert.alert(
            'Account Not Found',
            "Haven't got an account yet?",
            [
              { text: 'Create Account', onPress: () => navigation.navigate('PersonalDetails') },
              { text: 'OK' },
            ]
          );
        } else {
          Alert.alert('Login Failed', 'Something went wrong.');
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Unable to connect to server.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <View style={styles.topSection}>
            <Image source={require('./assets/logo.png')} style={styles.logo} />
          </View>

          <View style={styles.loginSection}>
            <Text style={styles.welcomeText}>Welcome Back</Text>

            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="👤 Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, passwordError ? styles.inputError : null]}
                placeholder="🔒 Password"
                placeholderTextColor="#999"
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                <Ionicons name={secureText ? 'eye-off' : 'eye'} size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.rememberContainer}>
              <Checkbox value={rememberMe} onValueChange={setRememberMe} color={rememberMe ? '#58B32D' : undefined} />
              <Text style={styles.rememberText}>Remember me</Text>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginText}>LOGIN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.createAccountButton} onPress={() => navigation.navigate('PersonalDetails')}>
              <Text style={styles.createAccountText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <StatusBar style="auto" />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProductList" component={ProductList} options={{ headerShown: false }} />
        <Stack.Screen name="PersonalDetails" component={PersonalDetails} options={{ headerShown: false }} />
        <Stack.Screen name="AccountCredentials" component={AccountCredentials} options={{ headerShown: false }} />
        <Stack.Screen name="Message" component={Message} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetail" component={ProductDetail} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

AppRegistry.registerComponent(appName, () => App);
export default App;

const styles = StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1 },
  innerContainer: { flex: 1 },
  topSection: {
    flex: 1,
    backgroundColor: '#2ba310',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { width: 160, height: 100, resizeMode: 'contain' },
  loginSection: {
    flex: 2,
    backgroundColor: '#fff',
    padding: 30,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: 'red',
    marginBottom: 5,
    marginLeft: 5,
  },
  input: {
    height: 45,
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  inputError: { borderBottomColor: 'red' },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  rememberText: {
    marginLeft: 8,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#58B32D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  createAccountButton: {
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderColor: '#58B32D',
    borderWidth: 1,
  },
  createAccountText: {
    color: '#58B32D',
    fontWeight: 'bold',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 12,
  },
});
