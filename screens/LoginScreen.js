import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Alert, Image
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('https://marineapitest.tersan.com.tr/api/identity/Auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: username, password }),
      });

      const raw = await response.text();
      const data = JSON.parse(raw);

      if (data?.AccessToken) {
        const token = data.AccessToken;
        await SecureStore.setItemAsync('userToken', token);

        const roles = parseJwtRoles(token);
        const boats = await fetchBoatList(token);

        navigation.replace('Home', { token, roles, boats });
      } else {
        Alert.alert('Hata', 'Giriş başarısız, bilgileri kontrol edin.');
      }
    } catch (err) {
      Alert.alert('Sunucu Hatası', 'Bağlantı sağlanamadı.');
    }
  };

  const parseJwtRoles = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      const payload = JSON.parse(jsonPayload);
      return Array.isArray(payload?.role) ? payload.role : [payload?.role];
    } catch {
      return [];
    }
  };

  const fetchBoatList = async (token) => {
    try {
      const res = await fetch('https://marineapitest.tersan.com.tr/odata/Contract/BoatList', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      return json.value.map(b => ({ id: b.BoatNo, name: b.BoatName }));
    } catch (err) {
      return [];
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Giriş Yap</Text>
      <TextInput style={styles.input} placeholder="Kullanıcı Adı" value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Şifre" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Giriş</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#CAF0F8' },
  logo: { width: 200, height: 80, resizeMode: 'contain', alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#00B4D8', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
