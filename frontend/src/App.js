import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SignalChart from './components/SignalChart'; // Az önce oluşturduğumuz bileşen
import './App.css';

const API_BASE_URL = 'http://localhost:8000/api/signals';

// Tarihi YYYY-MM-DD formatına çeviren yardımcı fonksiyon
const formatDateForInput = (date) => {
  return date.toISOString().split('T')[0];
};

// Başlangıç tarihini bugünden 30 gün öncesi olarak ayarla
const getDefaultStartDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date;
};

function App() {
  // Filtre listeleri
  const [allSymbols, setAllSymbols] = useState([]);
  const [allModels, setAllModels] = useState([]);

  // Yükleme ve Hata durumları
  const [loadingFilters, setLoadingFilters] = useState(true); // Sayfa ilk yüklenirken
  const [loadingCharts, setLoadingCharts] = useState(false);  // Grafikleri yüklerken
  const [error, setError] = useState(null);

  // Seçili Filtre Değerleri
  const [selectedSymbols, setSelectedSymbols] = useState([]); // Artık bir dizi (array)
  const [selectedModel, setSelectedModel] = useState('');
  const [startDate, setStartDate] = useState(formatDateForInput(getDefaultStartDate()));
  const [endDate, setEndDate] = useState(formatDateForInput(new Date()));
  
  // Çizilecek grafik verilerini tutan state
  // Format: { 'SPY': [...veriler...], 'QQQ': [...veriler...] }
  const [chartData, setChartData] = useState({});

  // 1. Sadece ilk yüklemede: Filtreler için sembol ve model listesini çek
  useEffect(() => {
    setLoadingFilters(true);
    setError(null);
    Promise.all([
      axios.get(`${API_BASE_URL}/symbols`),
      axios.get(`${API_BASE_URL}/models`)
    ])
    .then(([symbolsResponse, modelsResponse]) => {
      setAllSymbols(symbolsResponse.data);
      setAllModels(['', ...modelsResponse.data]); // "Tümü" seçeneği için boş string ekle
      setLoadingFilters(false);
    })
    .catch(err => {
      console.error("Filtre verisi çekerken hata!", err);
      setError("Filtreler yüklenirken bir hata oluştu. Backend'in çalıştığından emin olun.");
      setLoadingFilters(false);
    });
  }, []);

  // 2. Sembol kutucuklarını (checkbox) yöneten fonksiyon
  const handleSymbolChange = (event) => {
    const symbol = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
      // Eğer işaretlendiyse, listeye ekle
      setSelectedSymbols(prev => [...prev, symbol]);
    } else {
      // Eğer işaret kaldırıldıysa, listeden çıkar
      setSelectedSymbols(prev => prev.filter(s => s !== symbol));
    }
  };

  // 3. "Göster" butonuna tıklandığında çalışan ana fonksiyon
  const handleShowCharts = () => {
    if (selectedSymbols.length === 0) {
      alert("Lütfen en az bir ETF sembolü seçin.");
      return;
    }
    
    setLoadingCharts(true);
    setError(null);
    setChartData({}); // Eski grafikleri temizle

    // Tarihleri ISO 8601 formatına çevir
    const fromISO = new Date(startDate + 'T00:00:00Z').toISOString();
    const toISO = new Date(endDate + 'T23:59:59Z').toISOString();

    // Seçilen her sembol için ayrı bir API isteği oluştur
    const requests = selectedSymbols.map(symbol => {
      const requestBody = {
        symbol: symbol,
        modelName: selectedModel || null,
        from: fromISO,
        to: toISO,
        size: 1000 // Grafikler için çok veri çek (pagination'ı atlamak için yüksek bir sayı)
      };
      // /api/signals/search endpoint'ini kullanıyoruz
      return axios.post(`${API_BASE_URL}/search`, requestBody)
                  .then(response => ({
                    symbol: symbol,
                    data: response.data.content // Dönen verinin "content" alanı
                  }));
    });

    // Tüm istekleri paralel olarak çalıştır
    Promise.all(requests)
      .then(results => {
        // Gelen sonuçları { 'SPY': [...], 'QQQ': [...] } formatına dönüştür
        const dataBySymbol = results.reduce((acc, result) => {
          // Zaman damgasını sayıya çevir (Recharts'ın sıralama için ihtiyacı var)
          const sortedData = result.data
            .map(d => ({ ...d, ts: new Date(d.ts).getTime() }))
            .sort((a, b) => a.ts - b.ts); // Tarihe göre sırala
          
          acc[result.symbol] = sortedData;
          return acc;
        }, {});

        setChartData(dataBySymbol);
        setLoadingCharts(false);
      })
      .catch(err => {
        console.error("Grafik verisi çekerken hata!", err);
        setError("Grafik verisi çekilirken bir hata oluştu.");
        setLoadingCharts(false);
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sinyal Projesi</h1>

        {loadingFilters ? (
          <p>Filtreler yükleniyor...</p>
        ) : (
          <>
            {/* --- Filtreleme Alanı --- */}
            <div className="filter-container">
              {/* ETF Sembol Seçimi (Checkbox) */}
              <fieldset className="filter-group">
                <legend>ETF Sembolleri</legend>
                <div className="checkbox-group">
                  {allSymbols.map(symbol => (
                    <label key={symbol}>
                      <input
                        type="checkbox"
                        value={symbol}
                        checked={selectedSymbols.includes(symbol)}
                        onChange={handleSymbolChange}
                      />
                      {symbol}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Model ve Tarih Seçimi */}
              <fieldset className="filter-group">
                <legend>Ayarlar</legend>
                <label>
                  Model:
                  <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                    {allModels.map(model => (
                      <option key={model} value={model}>{model === '' ? 'Tümü' : model}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Başlangıç:
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </label>
                <label>
                  Bitiş:
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </label>
              </fieldset>

              <button onClick={handleShowCharts} disabled={loadingCharts}>
                {loadingCharts ? 'Yükleniyor...' : 'Grafikleri Göster'}
              </button>
            </div>

            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            
            {/* --- Grafik Alanı --- */}
            <div className="chart-area">
              {!loadingCharts && Object.keys(chartData).length === 0 && (
                <p>Grafikleri görmek için lütfen filtreleri seçip "Göster" butonuna basın.</p>
              )}
              
              {loadingCharts && <p>Grafikler yükleniyor...</p>}

              {/* chartData'daki her bir sembol için SignalChart bileşenini render et */}
              {Object.entries(chartData).map(([symbol, data]) => (
                <SignalChart key={symbol} symbol={symbol} data={data} />
              ))}
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;