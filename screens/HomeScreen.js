import React from 'react';
import {
  View, Text, StyleSheet, Image,
  TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

export default function HomeScreen({ navigation, route }) {
  const roles = (route.params?.roles || []).map(r => r.toLowerCase());
  const token = route.params?.token;
  const boats = route.params?.boats || [];

  const goTo = (screen) => {
    navigation.navigate(screen, { token, boats });
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Evet', style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('userToken');
          await SecureStore.deleteItemAsync('username');
          navigation.replace('Login');
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={32} color="#0077B6" />
      </TouchableOpacity>
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      {roles.includes('ekipman') && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>İş Ekipmanları</Text>
          <TouchableOpacity style={styles.button} onPress={() => goTo('Forklift')}>
            <Text style={styles.buttonText}>Forklift</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => goTo('Manlift')}>
            <Text style={styles.buttonText}>Manlift</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => goTo('Iskele')}>
            <Text style={styles.buttonText}>İskele</Text>
          </TouchableOpacity>
        </View>
      )}

      {roles.includes('enerji') && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enerji</Text>
          <TouchableOpacity style={styles.button} onPress={() => goTo('Elektrik')}>
            <Text style={styles.buttonText}>Elektrik</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => goTo('Su')}>
            <Text style={styles.buttonText}>Su</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#CAF0F8', paddingTop: 40 },
  logoutButton: { position: 'absolute', top: 60, right: 20 },
  logo: { width: 200, height: 80, resizeMode: 'contain', alignSelf: 'center', marginTop: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', alignSelf: 'center', marginVertical: 10 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#0077B6', marginBottom: 15, textAlign: 'center' },
  button: { backgroundColor: '#00B4D8', paddingVertical: 12, borderRadius: 10, marginVertical: 6, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18 },
});
