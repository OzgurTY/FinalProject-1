import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Az önce kurduğumuz Recharts kütüphanesinden gerekli bileşenleri import ediyoruz
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import './App.css';

function App() {
  // Grafik verisini tutmak için state (başlangıçta boş liste)
  const [summaryData, setSummaryData] = useState([]);
  // Yükleme durumu için state
  const [loading, setLoading] = useState(true);

  // Bileşen ilk yüklendiğinde bir kez çalışır
  useEffect(() => {
    // Backend'in /api/signals/summary endpoint'ine POST isteği atıyoruz.
    // Boş body ({}) gönderiyoruz, bu backend'de varsayılan (günlük) gruplamayı tetikler.
    axios.post('http://localhost:8000/api/signals/summary', {})
      .then(response => {
        // Gelen özet verisini (SummaryBucket listesi) state'e kaydediyoruz
        setSummaryData(response.data); 
        setLoading(false); // Yükleme tamamlandı
      })
      .catch(error => {
        console.error("Özet verisi çekerken hata!", error);
        setLoading(false); // Hata durumunda da yüklemeyi bitir
      });

  }, []); // Boş dizi, bu kodun sadece bir kez çalışmasını sağlar

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sinyal Projesi</h1>

        {/* Yükleme durumunu kontrol et */}
        {loading ? (
          <p>Grafik verisi yükleniyor...</p>
        ) : (
          // Grafiğin düzgün görünmesi için bir alan yaratıyoruz
          <div style={{ width: '90%', height: 400, marginTop: '20px' }}>
            <h2>Günlük Sinyal Özeti (Al/Sat)</h2>
            
            {/* ResponsiveContainer grafiğin ekrana sığmasını sağlar */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summaryData} // Grafiğin verisi state'den geliyor
                margin={{
                  top: 5, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                {/* X ekseni 'bucket' (gün) alanını kullanacak */}
                <XAxis dataKey="bucket" stroke="#ccc" /> 
                <YAxis stroke="#ccc" />
                <Tooltip contentStyle={{ backgroundColor: '#333', color: '#fff' }} />
                <Legend />
                {/* 'buy' alanı için yeşil bir bar çiz */}
                <Bar dataKey="buy" fill="#82ca9d" name="Al Sinyalleri" />
                {/* 'sell' alanı için kırmızı bir bar çiz */}
                <Bar dataKey="sell" fill="#ca8282" name="Sat Sinyalleri" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;