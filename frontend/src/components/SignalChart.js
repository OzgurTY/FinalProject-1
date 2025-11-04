import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// AL/SAT/TUT sinyallerini göstermek için özel nokta (dot) bileşeni
const CustomizedDot = (props) => {
    const { cx, cy, payload } = props;

    // Veri noktasındaki (payload) sinyal tipine bak
    switch (payload.signal) {
        case 'BUY':
            // AL sinyali için yeşil bir üçgen (yukarı ok) çiz
            return (
                <svg x={cx - 7} y={cy - 7} width="14" height="14" fill="#52D017" viewBox="0 0 1024 1024">
                    <path d="M512 96l448 704H64z" />
                </svg>
            );
        case 'SELL':
            // SAT sinyali için kırmızı bir üçgen (aşağı ok) çiz
            return (
                <svg x={cx - 7} y={cy - 7} width="14" height="14" fill="#E41B17" viewBox="0 0 1024 1024">
                    <path d="M512 928L64 224h896z" />
                </svg>
            );
        case 'HOLD':
            // TUT sinyali için küçük gri bir daire
            return <circle cx={cx} cy={cy} r={3} fill="#808080" />;
        default:
            // Sinyal yoksa (veya farklı bir şeyse) bir şey çizme
            return null;
    }
};

// Tooltip'in (üzerine gelince çıkan kutu) içeriğini formatlamak için
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const date = new Date(data.ts).toLocaleString();
        return (
            <div style={{ backgroundColor: '#222', padding: '10px', border: '1px solid #555', borderRadius: '5px' }}>
                <p style={{ color: '#fff' }}>{`Tarih: ${date}`}</p>
                <p style={{ color: '#8884d8' }}>{`Fiyat: ${data.price}`}</p>
                {data.signal !== 'HOLD' && (
                    <p style={{ color: data.signal === 'BUY' ? '#52D017' : '#E41B17' }}>
                        {`Sinyal: ${data.signal}`}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

// Zaman damgasını (timestamp) X ekseni için "gün/ay" olarak formatlar
const formatXAxis = (ts) => {
    const date = new Date(ts);
    return `${date.getDate()}/${date.getMonth() + 1}`;
};

// Ana Grafik Bileşeni
// Bu bileşen 'symbol' (başlık için) ve 'data' (çizim için) prop'larını alır
const SignalChart = ({ symbol, data }) => {
    return (
        <div style={{ width: '100%', height: 350, backgroundColor: '#282c34', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', textAlign: 'left', marginLeft: '20px' }}>{symbol} Fiyat Grafiği ve Sinyaller</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 20 }} // Alt boşluğu artırdık
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#555" />

                    {/* X Ekseni (Zaman) */}
                    <XAxis
                        dataKey="ts" // Verideki zaman damgası
                        stroke="#ccc"
                        tickFormatter={formatXAxis} // Zamanı formatla

                        // --- YENİ EKLENEN SATIRLAR ---
                        interval="auto" // Etiketlerin üst üste binmesini otomatik engelle
                        minTickGap={40}   // Etiketler arası minimum 40px boşluk bırak
                        // --- BİTTİ ---

                        label={{ value: "", position: "insideBottom", offset: -15, fill: '#ccc', dy: 10 }} // dy eklendi
                    />

                    {/* Y Ekseni (Fiyat) */}
                    <YAxis
                        dataKey="price" // Verideki fiyat
                        stroke="#ccc"
                        domain={['auto', 'auto']} // Fiyat aralığını otomatik ayarla
                        label={{ value: '', angle: -90, position: 'insideLeft', fill: '#ccc' }}
                    />

                    {/* Üzerine gelince çıkan Tooltip */}
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />

                    {/* Fiyat Çizgisi */}
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Fiyat"
                        activeDot={<CustomizedDot />} // Aktif nokta (tıklanınca/yaklaşınca) sinyal ikonu
                        dot={<CustomizedDot />} // Her nokta için sinyal ikonunu göster
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SignalChart;