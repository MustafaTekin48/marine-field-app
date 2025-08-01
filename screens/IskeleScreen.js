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

const lengths = Array.from({ length: 9 }, (_, i) => i + 2); // 2m - 10m

export default function IskeleScreen({ route }) {
  const token = route.params?.token;
  const [boats, setBoats] = useState([]);
  const [filteredBoats, setFilteredBoats] = useState([]);
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showBoatDropdown, setShowBoatDropdown] = useState(false);
  const [serviceDate, setServiceDate] = useState('');
  const [note, setNote] = useState('');
  const [scaffoldCounts, setScaffoldCounts] = useState({});
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
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const json = await res.json();

        if (!json.value) break;

        const newBoats = json.value.map((item) => ({
          id: item.Id,
          name: item.BoatName || item.Name || item.BoatNo || 'Bilinmeyen Tekne',
        }));

        allBoats = [...allBoats, ...newBoats];
        if (newBoats.length < top) hasMore = false;
        else skip += top;
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
    const d = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    setServiceDate(d);
    setDatePickerVisibility(false);
  };

  const incrementCount = (length) => {
    setScaffoldCounts((prev) => ({ ...prev, [length]: (prev[length] || 0) + 1 }));
  };

  const decrementCount = (length) => {
    setScaffoldCounts((prev) => {
      const current = prev[length] || 0;
      return { ...prev, [length]: current > 0 ? current - 1 : 0 };
    });
  };

  const totalCount = Object.values(scaffoldCounts).reduce((sum, val) => sum + val, 0);
  const totalCost = totalCount * 10;

  const handleSave = () => {
    if (!selectedBoat || !serviceDate || totalCount === 0) {
      Alert.alert('Eksik Bilgi', 'Tüm alanları doldurun ve en az 1 iskele seçin.');
      return;
    }

    const data = {
      tekne: selectedBoat.name,
      tarih: serviceDate,
      iskeleler: scaffoldCounts,
      not: note,
      toplamAdet: totalCount,
      ücret: totalCost,
    };

    console.log('İSKELE KAYIT:', data);
    Alert.alert('Kayıt Başarılı', `Toplam Ücret: €${totalCost}`);
    setSelectedBoat(null);
    setSearchText('');
    setScaffoldCounts({});
    setNote('');
    setServiceDate('');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAwareScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>🛠️ İskele Kullanımı</Text>

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
                      setShowBoatDropdown(false);
                      setSearchText('');
                    }}
                  >
                    <Text>{boat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

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

        <Text style={styles.label}>İskele Uzunlukları</Text>
        {lengths.map((len) => (
          <View key={len} style={styles.lengthBox}>
            <Text>{len} m</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={styles.counterBtn} onPress={() => decrementCount(len)}>
                <Text style={styles.counterText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterDisplay}>{scaffoldCounts[len] || 0}</Text>
              <TouchableOpacity style={styles.counterBtn} onPress={() => incrementCount(len)}>
                <Text style={styles.counterText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={styles.label}>Not</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={note}
          onChangeText={setNote}
        />

        <Text style={styles.total}>Toplam Ücret: €{totalCost}</Text>

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
  lengthBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  counterBtn: {
    backgroundColor: '#00B4D8',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  counterText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  counterDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
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
