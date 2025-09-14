import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
  Animated,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { name as appName } from './app.json';
import { BASE_URL } from './config'

// Screens
import ProductList from './product-list';
import PersonalDetails from './create-account';
import AccountCredentials from './accountcredentials';
import Message from './message';
import Profile from './profile';
import ProductDetail from './product-detail';
import Carts from './carts';
import ToPay from './to-pay';
import ToConfirm from './to-confirm';
import ToReceive from './to-receive';
import ToRate from './to-rate';
import PlaceRequest from './place-request';
import OrderHistory from './order-history';
import MyProfile from './myprofile';
import ChatBot from './chatbot';
import AccountOptions from './account-options';
import Receipt from './receipt';
import CustomOrder from './custom-order';
import Points from './points';
import ViewCustomOrder from './view-custom-order';
import ViewOrderDetails from './view-order-details';

const Stack = createNativeStackNavigator();

const colors = {
  primaryGreen: '#4CAF50',
  darkerGreen: '#388E3C',
  lightGreen: '#F0F8F0',
  accentGreen: '#8BC34A',
  textPrimary: '#333333',
  textSecondary: '#666666',
  white: '#FFFFFF',
  greyBorder: '#DDDDDD',
  lightGreyBackground: '#FAFAFA',
};

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [secureText, setSecureText] = useState(true);

  // Animated shift
  const shift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(shift, {
        toValue: -100, // move form up
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(shift, {
        toValue: 0, // back to default
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [shift]);

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
      const response = await fetch(`${BASE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        }),
      });

      const result = await response.json();
      console.log("Server result:", result);

      if (result.success && result.user) {
        navigation.navigate('ProductList', { user: result.user });
      } else {
        console.log("Login failed reason:", result.message);
        if (result.message === 'Incorrect password') {
          setPasswordError('Incorrect password');
        } else if (
          result.message.toLowerCase().includes('email not found') ||
          result.message.toLowerCase().includes('not found')
        ) {
          Alert.alert(
            'Account Not Found',
            "Haven't got an account yet?",
            [
              { text: 'Create Account', onPress: () => navigation.navigate('PersonalDetails') },
              { text: 'OK' },
            ]
          );
        } else {
          Alert.alert('Login Failed', result.message || 'Something went wrong.');
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
        <Animated.View style={[styles.innerContainer, { transform: [{ translateY: shift }] }]}>
          <View style={styles.topSection}>
            <Image source={require('./assets/logo.png')} style={styles.logo} />
          </View>

          <View style={styles.loginSection}>
            <Text style={styles.welcomeText}>Welcome Back 👋</Text>

            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, passwordError ? styles.inputError : null]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                <Ionicons name={secureText ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.rememberContainer}>
              <Checkbox value={rememberMe} onValueChange={setRememberMe} color={rememberMe ? colors.primaryGreen : colors.greyBorder} />
              <Text style={styles.rememberText}>Remember me</Text>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.buttonText}>LOGIN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.createAccountButton} onPress={() => navigation.navigate('PersonalDetails')}>
              <Text style={styles.createAccountText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <StatusBar style="auto" />
        </Animated.View>
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
        <Stack.Screen name="ProductDetail" component={ProductDetail} options={{ headerShown: false }} />
        <Stack.Screen name="Carts" component={Carts} options={{ headerShown: false }} />
        <Stack.Screen name="ToPay" component={ToPay} options={{ headerShown: false }} />
        <Stack.Screen name="ToConfirm" component={ToConfirm} options={{ headerShown: false }} />
        <Stack.Screen name="ToReceive" component={ToReceive} options={{ headerShown: false }} />
        <Stack.Screen name="ToRate" component={ToRate} options={{ headerShown: false }} />
        <Stack.Screen name="PlaceRequest" component={PlaceRequest} options={{ headerShown: false }} />
        <Stack.Screen name="OrderHistory" component={OrderHistory} options={{ headerShown: false }} />
        <Stack.Screen name="MyProfile" component={MyProfile} options={{ headerShown: false }} />
        <Stack.Screen name="ChatBot" component={ChatBot} options={{ headerShown: false }} />
        <Stack.Screen name="AccountOptions" component={AccountOptions} options={{ headerShown: false }} />
        <Stack.Screen name="Receipt" component={Receipt} options={{ headerShown: false }} />
        <Stack.Screen name="CustomOrder" component={CustomOrder} options={{ headerShown: false }} />
        <Stack.Screen name="Points" component={Points} options={{ headerShown: false }} />
        <Stack.Screen name="ViewCustomOrder" component={ViewCustomOrder} options={{ headerShown: false }} />
        <Stack.Screen name="ViewOrderDetails" component={ViewOrderDetails} options={{ headerShown: false }} />
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
    backgroundColor: colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { width: 160, height: 100, resizeMode: 'contain' },
  loginSection: {
    flex: 2,
    backgroundColor: colors.white,
    padding: 30,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: 12,
    color: 'red',
    marginBottom: 5,
    marginLeft: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.greyBorder,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    color: colors.textPrimary,
  },
  inputError: { borderColor: 'red' },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  rememberText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  createAccountButton: {
    marginTop: 15,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderColor: colors.primaryGreen,
    borderWidth: 1,
    backgroundColor: colors.white,
  },
  createAccountText: {
    color: colors.primaryGreen,
    fontWeight: 'bold',
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
});
