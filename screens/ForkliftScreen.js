import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Keyboard, TouchableWithoutFeedback,
  Pressable, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function ForkliftScreen({ route }) {
  const token = route.params?.token;
  console.log("TOKEN:", token);

  const [boats, setBoats] = useState([]);
  const [filteredBoats, setFilteredBoats] = useState([]);
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showBoatDropdown, setShowBoatDropdown] = useState(false);
  const [serviceDate, setServiceDate] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedMinutes, setSelectedMinutes] = useState(20);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contractLoading, setContractLoading] = useState(false);

  const minutesOptions = [20, 40, 60, 80, 100];
  const forkliftServiceId = "f90c1239-af58-4ef5-9c81-08dc15bacf13";
  const adjustedQty = (selectedMinutes / 20) * (parseInt(quantity) || 0);
  const adjustedPrice = adjustedQty * 30;

  useEffect(() => { fetchAllBoats(); }, []);

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
        Alert.alert("Sözleşme bulunamadı", "Bu tekneye ait sözleşme yok veya durumu uygun değil.");
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
    if (!selectedBoat || !selectedContractId || !serviceDate || !quantity) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun ve tekne seçimini yapın.');
      return;
    }

    const now = new Date().toISOString();

    const payload = {
      ContractId: selectedContractId,
      ContractRev: 0,
      ServiceId: forkliftServiceId,
      ServiceDate: serviceDate,
      Qty: adjustedQty,
      Unit: "hrs",
      Price: adjustedPrice,
      BasePrice: 30,
      Currency: "EUR",
      Status: "Completed",
      BoatId: selectedBoat.id,
      InsertedBy: "MOBIL",
      InsertedDate: now,
      UpdatedBy: "MOBIL",
      UpdatedDate: now,
      PriceRevision: 0,
      RevisionDiscount: 0,
      IsCompleted: true,
      Description: description
    };

    console.log("Gönderilen veriler:", payload);

    try {
      const response = await fetch(
        "https://marineapitest.tersan.com.tr/api/contract/ContractService",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();

      if (!response.ok || responseData?.Code >= 900) {
        console.error("ERP yanıtı:", responseData);
        throw new Error(responseData?.Message || "ERP kaydı başarısız.");
      }

      Alert.alert("Başarılı", `Forklift kaydı oluşturuldu. Ücret: €${payload.Price.toFixed(2)}`);
      resetForm();
    } catch (error) {
      console.error("ERP hatası:", error);
      Alert.alert("Hata", error.message || "Beklenmeyen bir hata oluştu.");
    }
  };

  const resetForm = () => {
  setSelectedBoat(null);
  setSelectedContractId(null);
  setSearchText('');
  setServiceDate('');
  setDescription('');
  setQuantity('1');
  setSelectedMinutes(20);
  setFilteredBoats(boats); // listeyi eski hâline getir
  setShowBoatDropdown(false); // dropdown kapalı kalsın
};



  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAwareScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>🚜 Forklift Kullanımı</Text>

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

        <Text style={styles.label}>Kullanım Süresi</Text>
        <View style={styles.minuteOptions}>
          {minutesOptions.map((min) => (
            <TouchableOpacity
              key={min}
              style={[
                styles.minuteButton,
                selectedMinutes === min && styles.minuteButtonSelected,
              ]}
              onPress={() => setSelectedMinutes(min)}
            >
              <Text style={{ color: selectedMinutes === min ? 'white' : '#333' }}>{min} dk</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Adet</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
        />

        <Text style={styles.label}>Açıklama</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.total}>Toplam Ücret: €{adjustedPrice.toFixed(2)}</Text>

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
  minuteOptions: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  minuteButton: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
    borderWidth: 1, borderColor: '#0077B6', marginRight: 10, marginBottom: 10,
  },
  minuteButtonSelected: { backgroundColor: '#0077B6' },
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
