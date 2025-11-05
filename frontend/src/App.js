import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SignalChart from './components/SignalChart'; // Bileşen yolunu güncelledik (varsa)
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
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [error, setError] = useState(null);

  // Seçili Filtre Değerleri
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [startDate, setStartDate] = useState(formatDateForInput(getDefaultStartDate()));
  const [endDate, setEndDate] = useState(formatDateForInput(new Date()));
  const [groupBy, setGroupBy] = useState('day'); // Varsayılan "day"

  // Çizilecek grafik verilerini tutan state
  // Format: { 'SPY': { priceData: [...], volumeData: [...] }, ... }
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
        setAllModels(['', ...modelsResponse.data]); // "Tümü" seçeneği için
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
      setSelectedSymbols(prev => [...prev, symbol]);
    } else {
      setSelectedSymbols(prev => prev.filter(s => s !== symbol));
    }
  };

  // YENİ: "Tümünü Seç" / "Tümünü Temizle" fonksiyonları
  const handleSelectAllSymbols = () => setSelectedSymbols(allSymbols);
  const handleClearAllSymbols = () => setSelectedSymbols([]);


  // 3. "Göster" butonuna tıklandığında çalışan ana fonksiyon
  const handleShowCharts = () => {
    if (selectedSymbols.length === 0) {
      alert("Lütfen en az bir ETF sembolü seçin.");
      return;
    }

    setLoadingCharts(true);
    setError(null);
    setChartData({}); // Eski grafikleri temizle

    const fromISO = new Date(startDate + 'T00:00:00Z').toISOString();
    const toISO = new Date(endDate + 'T23:59:59Z').toISOString();

    // Seçilen her sembol için 2 API isteği (search ve summary) oluştur
    const requests = selectedSymbols.flatMap(symbol => {
      // Backend DTO'larına uygun request body'leri
      const searchRequest = {
        symbol: symbol,
        modelName: selectedModel || null,
        from: fromISO,
        to: toISO,
        size: 10000
      };

      const summaryRequest = {
        symbol: symbol,
        modelName: selectedModel || null,
        from: fromISO,
        to: toISO,
        groupBy: groupBy
      };

      return [
        // Fiyat/Sinyal verisi
        axios.post(`${API_BASE_URL}/search`, searchRequest).then(res => ({
          type: 'price',
          symbol: symbol,
          data: res.data.content
        })),
        // Hacim (Al/Sat sayısı) verisi
        axios.post(`${API_BASE_URL}/summary`, summaryRequest).then(res => ({
          type: 'volume',
          symbol: symbol,
          data: res.data
        }))
      ];
    });

    // Tüm istekleri paralel olarak çalıştır
    Promise.all(requests)
      .then(results => {
        // Gelen sonuçları { 'SPY': { priceData: [...], volumeData: [...] }, ... } formatına dönüştür
        const dataBySymbol = results.reduce((acc, result) => {
          const { symbol, type, data } = result;

          // Akümülatörde { symbol: { priceData: [], volumeData: [] } } yapısını oluştur
          if (!acc[symbol]) {
            acc[symbol] = { priceData: [], volumeData: [] };
          }

          if (type === 'price') {
            // Fiyat verisini tarihe göre sırala
            acc[symbol].priceData = data
              .map(d => ({ ...d, ts: new Date(d.ts).getTime() }))
              .sort((a, b) => a.ts - b.ts);
          } else if (type === 'volume') {
            // Hacim verisini tarihe göre sırala (bucket zaten string tarih)
            acc[symbol].volumeData = data.map(bucketData => {
              let ts;
              if (groupBy === 'week') {
                // "2025-W45" formatını parse et
                const [year, week] = bucketData.bucket.split('-W');
                ts = new Date(year, 0, 1 + (parseInt(week) - 1) * 7).getTime(); // Haftanın başlangıcı (yaklaşık)
              } else if (groupBy === 'month') {
                // "2025-11" formatını parse et
                ts = new Date(bucketData.bucket + '-01T00:00:00Z').getTime(); // Ayın ilk günü
              } else {
                // "2025-11-03" formatını parse et
                ts = new Date(bucketData.bucket + 'T00:00:00Z').getTime(); // Günün başlangıcı
              }
              return { ...bucketData, ts: ts };
            }).sort((a, b) => a.ts - b.ts); // Mutlaka tarihe göre sırala
          }

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

                {/* YENİ: Tümünü Seç/Temizle Butonları */}
                <div className="select-all-buttons">
                  <button onClick={handleSelectAllSymbols}>Tümünü Seç</button>
                  <button onClick={handleClearAllSymbols}>Tümünü Temizle</button>
                </div>

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

                {/* YENİ: Hacim Gruplama Dropdown */}
                <label>
                  Hacim Aralığı:
                  <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                    <option value="day">Günlük</option>
                    <option value="week">Haftalık</option>
                    <option value="month">Aylık</option>
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

              <button onClick={handleShowCharts} disabled={loadingCharts} className="show-charts-button">
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
                <SignalChart
                  key={symbol}
                  symbol={symbol}
                  priceData={data.priceData}  // Fiyat verisini gönder
                  volumeData={data.volumeData} // Hacim verisini gönder
                />
              ))}
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;