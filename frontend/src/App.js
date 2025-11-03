import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './App.css';

const API_BASE_URL = 'http://localhost:8000/api/signals';

// Tarihi YYYY-MM-DD formatına çeviren yardımcı fonksiyon
const formatDateForInput = (date) => {
  return date.toISOString().split('T')[0];
};

// Başlangıç tarihini bugünden 7 gün öncesi olarak ayarla
const getDefaultStartDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date;
};

function App() {
  const [summaryData, setSummaryData] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState(null);

  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  
  // Tarih state'leri (varsayılan değerlerle)
  const [startDate, setStartDate] = useState(formatDateForInput(getDefaultStartDate()));
  const [endDate, setEndDate] = useState(formatDateForInput(new Date())); // Bugün

  // İlk veri yükleme
  useEffect(() => {
    setLoading(true);
    setError(null);
    // İlk yüklemede varsayılan tarih aralığını kullanalım
    const initialRequestBody = {
      from: new Date(startDate + 'T00:00:00Z').toISOString(), // Günün başlangıcı UTC
      to: new Date(endDate + 'T23:59:59Z').toISOString()      // Günün sonu UTC
    };

    Promise.all([
      axios.post(`${API_BASE_URL}/summary`, initialRequestBody), 
      axios.get(`${API_BASE_URL}/symbols`),
      axios.get(`${API_BASE_URL}/models`)
    ])
    .then(([summaryResponse, symbolsResponse, modelsResponse]) => {
      setSummaryData(summaryResponse.data);
      setSymbols(['', ...symbolsResponse.data]); 
      setModels(['', ...modelsResponse.data]);
      setLoading(false);
    })
    .catch(err => {
      console.error("İlk veri yüklenirken hata!", err);
      setError("Veriler yüklenirken bir hata oluştu.");
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sadece component mount olduğunda çalışır

  // Filtreler değiştiğinde veriyi yeniden çeken fonksiyon
  const fetchFilteredSummary = () => {
    // startDate veya endDate boşsa istek yapma (kullanıcı henüz seçmemiş olabilir)
    if (!startDate || !endDate) return; 

    setLoadingChart(true); 
    setError(null);

    // Tarihleri ISO 8601 formatına çevir (UTC olarak gün başı ve sonu)
    const fromISO = new Date(startDate + 'T00:00:00Z').toISOString();
    const toISO = new Date(endDate + 'T23:59:59Z').toISOString();

    const requestBody = {
      symbol: selectedSymbol || null, 
      modelName: selectedModel || null,
      from: fromISO, // Başlangıç tarihi
      to: toISO      // Bitiş tarihi
    };

    axios.post(`${API_BASE_URL}/summary`, requestBody)
      .then(response => {
        setSummaryData(response.data);
        setLoadingChart(false);
      })
      .catch(err => {
        console.error("Filtreli özet verisi çekerken hata!", err);
        setError("Grafik güncellenirken bir hata oluştu.");
        setLoadingChart(false);
      });
  };

  // Filtreler (sembol, model VEYA tarihler) değiştiğinde
  // fetchFilteredSummary fonksiyonunu çağıran useEffect
  useEffect(() => {
    if (loading) { // İlk yükleme bitmeden tetiklenmesin
      return;
    }
    fetchFilteredSummary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol, selectedModel, startDate, endDate, loading]); // Tarihleri de dependency'e ekledik


  // Handler fonksiyonları
  const handleSymbolChange = (event) => setSelectedSymbol(event.target.value);
  const handleModelChange = (event) => setSelectedModel(event.target.value);
  const handleStartDateChange = (event) => setStartDate(event.target.value);
  const handleEndDateChange = (event) => setEndDate(event.target.value);


  return (
    <div className="App">
      <header className="App-header">
        <h1>Sinyal Projesi</h1>

        {loading ? (
          <p>Veriler yükleniyor...</p>
        ) : (
          <>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Filtreleme Alanı */}
            <div style={{ marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}> {/* flexWrap eklendi */}
              <label style={{ color: '#ccc' }}>
                Sembol:
                <select value={selectedSymbol} onChange={handleSymbolChange} style={{ marginLeft: '5px', padding: '5px' }}>
                  {symbols.map(symbol => ( <option key={symbol} value={symbol}>{symbol === '' ? 'Tümü' : symbol}</option> ))}
                </select>
              </label>
              
              <label style={{ color: '#ccc' }}>
                Model:
                <select value={selectedModel} onChange={handleModelChange} style={{ marginLeft: '5px', padding: '5px' }}>
                  {models.map(model => ( <option key={model} value={model}>{model === '' ? 'Tümü' : model}</option> ))}
                </select>
              </label>

              {/* Tarih Filtreleri */}
              <label style={{ color: '#ccc' }}>
                Başlangıç:
                <input type="date" value={startDate} onChange={handleStartDateChange} style={{ marginLeft: '5px', padding: '4px' }}/>
              </label>
              <label style={{ color: '#ccc' }}>
                Bitiş:
                <input type="date" value={endDate} onChange={handleEndDateChange} style={{ marginLeft: '5px', padding: '4px' }}/>
              </label>
            </div>

            {/* Grafik Alanı */}
            <div style={{ width: '90%', height: 400, position: 'relative' }}>
              <h2>Günlük Sinyal Özeti (Al/Sat)</h2>
              {loadingChart && ( // Koşullu render
                <div style={{ // Gösterilecek JSX elemanı
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(40, 44, 52, 0.7)', // App-header rengi ile uyumlu
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                }}>
                  <p>Grafik güncelleniyor...</p>
                </div>
              )} {/* Koşullu render bitti */}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                  <XAxis dataKey="bucket" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip contentStyle={{ backgroundColor: '#333', color: '#fff', border: 'none' }} itemStyle={{ color: '#fff' }}/>
                  <Legend />
                  <Bar dataKey="buy" fill="#82ca9d" name="Al Sinyalleri" />
                  <Bar dataKey="sell" fill="#ca8282" name="Sat Sinyalleri" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;