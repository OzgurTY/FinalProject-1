import React from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush
} from 'recharts';
import SignalTable from './SignalTable';

const CustomizedDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;

    switch (payload.signal) {
        case 'BUY':
            return (
                <svg x={cx - 7} y={cy - 7} width="14" height="14" fill="#52D017" viewBox="0 0 1024 1024">
                    <path d="M512 96l448 704H64z" />
                </svg>
            );
        case 'SELL':
            return (
                <svg x={cx - 7} y={cy - 7} width="14" height="14" fill="#E41B17" viewBox="0 0 1024 1024">
                    <path d="M512 928L64 224h896z" />
                </svg>
            );
        case 'HOLD':
            return <circle cx={cx} cy={cy} r={3} fill="#808080" />;
        default:
            return null;
    }
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const priceData = payload.find(p => p.dataKey === 'price');
        const buyData = payload.find(p => p.dataKey === 'buy');
        const sellData = payload.find(p => p.dataKey === 'sell');

        const data = priceData ? priceData.payload : (buyData ? buyData.payload : null);
        if (!data) return null;

        const date = new Date(data.ts || data.bucket).toLocaleString(); // 'ts' (fiyat) veya 'bucket' (hacim) olabilir

        return (
            <div style={{ backgroundColor: '#222', padding: '10px', border: '1px solid #555', borderRadius: '5px' }}>
                <p style={{ color: '#fff' }}>{`Tarih: ${date}`}</p>

                {/* Fiyatı veya Sinyali göster */}
                {data.price && <p style={{ color: '#8884d8' }}>{`Fiyat: ${data.price}`}</p>}
                {data.signal && data.signal !== 'HOLD' && (
                    <p style={{ color: data.signal === 'BUY' ? '#52D017' : '#E41B17' }}>
                        {`Sinyal: ${data.signal}`}
                    </p>
                )}

                {/* Hacim verisini göster */}
                {data.buy > 0 && <p style={{ color: '#82ca9d' }}>{`Al Hacmi: ${data.buy}`}</p>}
                {data.sell > 0 && <p style={{ color: '#ca8282' }}>{`Sat Hacmi: ${data.sell}`}</p>}
            </div>
        );
    }
    return null;
};

const formatXAxis = (ts) => {
    const date = new Date(ts);
    return `${date.getDate()}/${date.getMonth() + 1}`;
};

const SignalChart = ({ symbol, priceData, volumeData }) => {

    if (!priceData || priceData.length === 0) {
        return (
            <div style={{ width: '100%', height: 350, backgroundColor: '#3a3f4a', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: '#fff', margin: 0 }}>{symbol}</h3>
                    <p style={{ color: '#ccc', fontStyle: 'italic', marginTop: '10px' }}>
                        Seçilen kriterler için sinyal verisi bulunamadı.
                    </p>
                </div>
            </div>
        );
    }

    const volumeMap = new Map();
    volumeData.forEach(bucket => {
        volumeMap.set(bucket.ts, { buy: bucket.buy, sell: bucket.sell });
    });

    return (
        <div style={{ width: '100%', height: 500, backgroundColor: '#3a3f4a', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', textAlign: 'left', marginLeft: '20px' }}>{symbol} Fiyat Grafiği ve Sinyal Hacmi</h3>

            {/* FİYAT GRAFİĞİ (ÜSTTE) */}
            <ResponsiveContainer width="100%" height="65%">
                <LineChart
                    data={priceData} // Sadece fiyat verisini kullan
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    syncId={`chart-${symbol}`}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                    <XAxis
                        dataKey="ts"
                        stroke="#ccc"
                        tickFormatter={formatXAxis}
                        interval="auto"
                        minTickGap={60}
                        hide={true}
                    />
                    <YAxis
                        dataKey="price"
                        stroke="#ccc"
                        domain={['auto', 'auto']}
                        label={{ value: 'Fiyat', angle: -90, position: 'insideLeft', fill: '#ccc', dx: -10 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Fiyat"
                        activeDot={<CustomizedDot />}
                        dot={<CustomizedDot />}
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* HACİM GRAFİĞİ (ALTTA) */}
            <ResponsiveContainer width="100%" height="30%">
                <BarChart
                    data={volumeData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                    syncId={`chart-${symbol}`}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                    <XAxis
                        dataKey="ts"
                        stroke="#ccc"
                        tickFormatter={formatXAxis}
                        interval="auto"
                        minTickGap={60}
                        label={{ value: "Tarih", position: "insideBottom", offset: -15, fill: '#ccc', dy: 10 }}
                    />
                    <YAxis
                        stroke="#ccc"
                        label={{ value: 'Hacim', angle: -90, position: 'insideLeft', fill: '#ccc', dx: -10 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="buy" fill="#82ca9d" name="Al Hacmi" />
                    <Bar dataKey="sell" fill="#ca8282" name="Sat Hacmi" />
                    <Brush
                        dataKey="ts"
                        height={30}
                        stroke="#61dafb"
                        fill="rgba(40, 44, 52, 0.5)"
                        tickFormatter={formatXAxis}
                    // `priceData`'yı baz alarak kaydırma yap (en yoğun veri)
                    // (Bu kısım için `volumeData`'nın `ts`'sini kullanmak daha iyi)
                    />
                </BarChart>
            </ResponsiveContainer>

            {/* SİNYAL TABLOSU (ALTTA) - %35 yükseklik
            <ResponsiveContainer width="100%" height="35%">
                <SignalTable data={priceData} />
            </ResponsiveContainer> */}
        </div>
    );
};

export default SignalChart;