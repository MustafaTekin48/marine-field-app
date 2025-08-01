import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function ElektrikScreen({ route }) {
  const token = route.params?.token;
  const [boats, setBoats] = useState([]);
  const [filteredBoats, setFilteredBoats] = useState([]);
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showBoatDropdown, setShowBoatDropdown] = useState(false);
  const [serviceDate, setServiceDate] = useState('');
  const [kwh, setKwh] = useState('');
  const [note, setNote] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllBoats();
  }, []);

  useEffect(() => {
    const filtered = boats.filter((boat) =>
      boat.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredBoats(filtered);
  }, [searchText, boats]);

  const fetchAllBoats = async () => {
    try {
      let allBoats = [];
      let skip = 0;
      const top = 100;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(
          `https://marineapitest.tersan.com.tr/odata/contract/Boat?$count=true&$skip=${skip}&$top=${top}&$orderby=BoatNo desc`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const json = await res.json();

        if (!json.value) break;

        const newBoats = json.value.map((item) => ({
          id: item.Id,
          name: item.BoatName || item.Name || item.BoatNo || 'Bilinmeyen Tekne',
        }));

        allBoats = [...allBoats, ...newBoats];

        if (newBoats.length < top) {
          hasMore = false;
        } else {
          skip += top;
        }
      }

      const sorted = allBoats.sort((a, b) => a.name.localeCompare(b.name));
      setBoats(sorted);
      setFilteredBoats(sorted);
      setLoading(false);
    } catch (err) {
      Alert.alert('Hata', 'Tekne listesi alınamadı.');
      setLoading(false);
    }
  };

  const handleConfirmDate = (date) => {
    const formatted = `${String(date.getDate()).padStart(2, '0')}.${String(
      date.getMonth() + 1
    ).padStart(2, '0')}.${date.getFullYear()}`;
    setServiceDate(formatted);
    setDatePickerVisibility(false);
  };

  const totalCost = parseFloat(kwh) * 0.5 || 0;

  const handleSave = () => {
    if (!selectedBoat || !serviceDate || !kwh) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }

    const data = {
      tekne: selectedBoat.name,
      tarih: serviceDate,
      kwh,
      not: note,
      ücret: totalCost,
    };

    console.log('ELEKTRİK KAYIT:', data);
    Alert.alert('Kayıt Başarılı', `Toplam Ücret: €${totalCost.toFixed(2)}`);

    setSelectedBoat(null);
    setSearchText('');
    setServiceDate('');
    setKwh('');
    setNote('');
    setShowBoatDropdown(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAwareScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>🔌 Elektrik Kullanımı</Text>

        {/* Tekne Seçimi */}
        <Text style={styles.label}>Tekne Seç</Text>
        <Pressable style={styles.selectBox} onPress={() => setShowBoatDropdown(!showBoatDropdown)}>
          <Ionicons name="boat-outline" size={20} color="#555" style={{ marginRight: 8 }} />
          <Text style={{ color: selectedBoat ? '#000' : '#999' }}>
            {selectedBoat?.name || 'Tekne seçin'}
          </Text>
        </Pressable>

        {showBoatDropdown && (
          <View style={styles.dropdown}>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color="#555" style={{ marginHorizontal: 8 }} />
              <TextInput
                placeholder="Tekne ara..."
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchInput}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="small" color="#0077B6" style={{ marginTop: 10 }} />
            ) : (
              <ScrollView style={{ maxHeight: 200 }}>
                {filteredBoats.map((boat) => (
                  <TouchableOpacity
                    key={boat.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedBoat(boat);
                      setSearchText('');
                      setShowBoatDropdown(false);
                    }}
                  >
                    <Text style={{ color: '#333' }}>{boat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Tarih */}
        <Text style={styles.label}>Servis Tarihi</Text>
        <Pressable style={styles.input} onPress={() => setDatePickerVisibility(true)}>
          <Text style={{ color: serviceDate ? '#000' : '#999' }}>
            {serviceDate || 'Tarih seçin (GG.AA.YYYY)'}
          </Text>
        </Pressable>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={() => setDatePickerVisibility(false)}
        />

        {/* Kwh */}
        <Text style={styles.label}>Kwh</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Tüketilen elektrik (kwh)"
          value={kwh}
          onChangeText={setKwh}
        />

        {/* Not */}
        <Text style={styles.label}>Not</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={note}
          onChangeText={setNote}
        />

        <Text style={styles.total}>Toplam Ücret: €{totalCost.toFixed(2)}</Text>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>💾 Kaydet</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f1fbfe',
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 25,
    color: '#0077B6',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 5,
    marginBottom: 5,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 15,
    color: '#333',
  },
  dropdownItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#0077B6',
  },
  saveButton: {
    backgroundColor: '#00B4D8',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
