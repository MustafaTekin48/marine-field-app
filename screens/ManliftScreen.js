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

export default function ManliftScreen({ route }) {
  const token = route.params?.token;
  const [boats, setBoats] = useState([]);
  const [filteredBoats, setFilteredBoats] = useState([]);
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showBoatDropdown, setShowBoatDropdown] = useState(false);
  const [serviceDate, setServiceDate] = useState('');
  const [note, setNote] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contractLoading, setContractLoading] = useState(false);
  const [selectedManlifts, setSelectedManlifts] = useState([]);

  const manliftServiceId = "a6bedc3d-9139-47f9-920a-08dc2189810a";
  const manlifts = Array.from({ length: 11 }, (_, i) => `T${i + 1}`);

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
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (!json.value) break;

        const newBoats = json.value.map((item) => ({
          id: item.Id,
          name: item.BoatName || item.Name || item.BoatNo || 'Bilinmeyen Tekne',
        }));

        allBoats = [...allBoats, ...newBoats];
        hasMore = newBoats.length === top;
        skip += top;
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

  const fetchContractId = async (boatId) => {
    setContractLoading(true);
    try {
      const res = await fetch(
        `https://marineapitest.tersan.com.tr/odata/contract/Contract?$filter=BoatId eq ${boatId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();

      const contract = json?.value?.find(c => c.Status?.toLowerCase() === 'contracted');

      if (!contract?.Id) {
        Alert.alert("Sözleşme bulunamadı", "Bu tekneye ait sözleşme yok.");
        setSelectedContractId(null);
        return;
      }

      setSelectedContractId(contract.Id);
    } catch (error) {
      console.error("Sözleşme alınamadı:", error);
      Alert.alert("Hata", "Sözleşme bilgisi alınamadı.");
    } finally {
      setContractLoading(false);
    }
  };

  const handleConfirmDate = (date) => {
    const formatted = date.toISOString();
    setServiceDate(formatted);
    setDatePickerVisibility(false);
  };

  const handleSave = async () => {
  if (!selectedBoat || !selectedContractId || !serviceDate || selectedManlifts.length === 0) {
    Alert.alert("Eksik Bilgi", "Lütfen tüm alanları doldurun.");
    return;
  }

  const payload = {
    ContractId: selectedContractId,
    ContractRev: "1",
    BasePrice: 60,
    Currency: "EUR",
    Price: 60,
    Qty: selectedManlifts.length,
    ServiceDate: serviceDate,
    ServiceId: manliftServiceId,
    Status: "Completed",
    Unit: "days",
    Description: `Not: ${note || "-"} | Manliftler: ${selectedManlifts.join(", ")}`,
  };

  console.log("Gönderilen veri:", payload);

  try {
    const res = await fetch("https://marineapitest.tersan.com.tr/api/ContractService/Create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let responseData = null;

    try {
      responseData = text ? JSON.parse(text) : null;
    } catch (e) {
      console.log("Boş veya geçersiz JSON:", text);
    }

    console.log("API cevabı:", responseData || text);

    if (res.ok && (!responseData || !responseData?.Code)) {
      Alert.alert("Başarılı", "Manlift hizmeti kaydedildi.");
      setSelectedBoat(null);
      setSelectedContractId(null);
      setSearchText('');
      setServiceDate('');
      setNote('');
      setSelectedManlifts([]);
      setShowBoatDropdown(false);
    } else {
      Alert.alert("Hata", responseData?.Message || "Kayıt başarısız oldu.");
    }

  } catch (err) {
    console.error("Kaydetme hatası:", err);
    Alert.alert("Sunucu Hatası", "ERP sistemine bağlanılamadı.");
  }
};


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAwareScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>🛠️ Manlift Kullanımı</Text>

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
                      fetchContractId(boat.id);
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

        {contractLoading && <ActivityIndicator size="small" color="orange" />}

        <Text style={styles.label}>Servis Tarihi</Text>
        <Pressable style={styles.input} onPress={() => setDatePickerVisibility(true)}>
          <Text style={{ color: serviceDate ? '#000' : '#999' }}>
            {serviceDate ? new Date(serviceDate).toLocaleDateString() : 'Tarih seçin'}
          </Text>
        </Pressable>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={() => setDatePickerVisibility(false)}
        />

        <Text style={styles.label}>Manlift Seç (T1 - T11)</Text>
        <View style={styles.manliftContainer}>
          {manlifts.map((id) => (
            <TouchableOpacity
              key={id}
              style={[
                styles.manliftItem,
                selectedManlifts.includes(id) && styles.manliftItemSelected,
              ]}
              onPress={() => {
                setSelectedManlifts((prev) =>
                  prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
                );
              }}
            >
              <Text style={{ color: selectedManlifts.includes(id) ? '#fff' : '#333' }}>{id}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Not</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={note}
          onChangeText={setNote}
        />

        <Text style={styles.total}>Toplam Ücret: €{selectedManlifts.length * 60}</Text>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>💾 Kaydet</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f1fbfe', padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 25, color: '#0077B6' },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 6, color: '#333' },
  selectBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', marginBottom: 10,
  },
  dropdown: {
    backgroundColor: '#fff', borderRadius: 10, borderColor: '#ccc',
    borderWidth: 1, paddingHorizontal: 10, marginBottom: 15,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1,
    borderColor: '#eee', paddingBottom: 5, marginBottom: 5,
  },
  searchInput: { flex: 1, paddingVertical: 6, fontSize: 15, color: '#333' },
  dropdownItem: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  input: {
    backgroundColor: '#fff', padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#ccc', marginBottom: 15,
  },
  manliftContainer: {
    flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15,
  },
  manliftItem: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
    borderWidth: 1, borderColor: '#0077B6', marginRight: 10, marginBottom: 10,
  },
  manliftItemSelected: { backgroundColor: '#0077B6' },
  total: {
    fontSize: 18, fontWeight: 'bold', textAlign: 'center',
    marginVertical: 15, color: '#0077B6',
  },
  saveButton: {
    backgroundColor: '#00B4D8', paddingVertical: 16,
    borderRadius: 14, alignItems: 'center', marginTop: 10,
  },
  saveButtonText: {
    color: '#fff', fontSize: 18, fontWeight: '600',
  },
});
