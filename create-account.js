import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function CreateAccount({ navigation }) {
  const [f_name, setFName] = useState("");
  const [l_name, setLName] = useState("");
  const [cp_no, setCpNo] = useState("");
  const [errors, setErrors] = useState({});

  // ✅ Google Sign-In
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "653056599587-6eb8gn7he749jnul31218vcoj5dckdns.apps.googleusercontent.com", // Web client ID
    androidClientId: "653056599587-31s8bnpfakee3rdqa46pegslqukl1d7g.apps.googleusercontent.com", // Android client ID
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      Alert.alert("Google Sign-In Success", "Account created with Google!");
      // 👉 here you can send token to backend to create account automatically
      navigation.replace("Home"); // or navigate where you want after signup
    }
  }, [response]);

  // ✅ format 0912-345-6789 style
  const formatPhoneNumber = (text) => {
    const digits = text.replace(/\D/g, "").slice(0, 11); // max 11 digits
    if (digits.length <= 4) return digits;
    if (digits.length <= 7)
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (text) => {
    setCpNo(formatPhoneNumber(text));
  };

  const handleRegister = () => {
    const newErrors = {};

    if (!f_name.trim()) newErrors.f_name = "First Name is required";
    if (!l_name.trim()) newErrors.l_name = "Last Name is required";
    if (!cp_no || cp_no.replace(/\D/g, "").length !== 11)
      newErrors.cp_no = "Valid contact number is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    navigation.navigate("AccountCredentials", {
      f_name,
      l_name,
      cp_no: cp_no.replace(/\D/g, ""), // raw number
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Koncepto Logo */}
      <Image
        source={require("./assets/koncepto.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Create Account</Text>

      {/* First Name */}
      <TextInput
        style={[styles.input, errors.f_name && styles.inputError]}
        placeholder="First Name"
        value={f_name}
        onChangeText={(text) => {
          setFName(text);
          if (errors.f_name) setErrors((prev) => ({ ...prev, f_name: "" }));
        }}
      />
      {errors.f_name && <Text style={styles.errorText}>{errors.f_name}</Text>}

      {/* Last Name */}
      <TextInput
        style={[styles.input, errors.l_name && styles.inputError]}
        placeholder="Last Name"
        value={l_name}
        onChangeText={(text) => {
          setLName(text);
          if (errors.l_name) setErrors((prev) => ({ ...prev, l_name: "" }));
        }}
      />
      {errors.l_name && <Text style={styles.errorText}>{errors.l_name}</Text>}

      {/* Contact Number */}
      <TextInput
        style={[styles.input, errors.cp_no && styles.inputError]}
        placeholder="09**-***-****"
        keyboardType="number-pad"
        value={cp_no}
        onChangeText={handlePhoneChange}
        maxLength={13}
      />
      {errors.cp_no && <Text style={styles.errorText}>{errors.cp_no}</Text>}

      {/* Register Button */}
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerText}>Register</Text>
      </TouchableOpacity>

      {/* OR Divider */}
      <View style={styles.orContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
      </View>

      {/* Google Sign Up */}
        <TouchableOpacity
          style={styles.googleButton}
          disabled={!request} // disable if request is not ready
          onPress={() => {
            promptAsync();
          }}
        >
          <Image
            source={require("./assets/google.png")}
            style={styles.googleLogo}
          />
          <Text style={styles.googleText}>Sign up with Google</Text>
        </TouchableOpacity>

      {/* Back to Login */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.loginLink}
      >
        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Text style={styles.loginHighlight}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#28a745",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  registerButton: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  registerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: "#666",
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    justifyContent: 'center',
    flexDirection: 'row',
    borderColor: "#28a745",
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleText: {
    color: "#28a745",
    fontSize: 16,
    fontWeight: "600",
  },
  loginLink: {
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: "#555",
  },
  loginHighlight: {
    color: "#28a745",
    fontWeight: "bold",
  },
  logo: {
  width: 100,
  height: 100,
  marginBottom: 15,
},

});