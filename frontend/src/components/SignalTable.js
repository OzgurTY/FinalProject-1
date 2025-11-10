import React from 'react';

const getSignalStyle = (signal) => {
    if (signal === 'BUY') {
        return { color: '#52D017', fontWeight: 'bold' };
    }
    if (signal === 'SELL') {
        return { color: '#E41B17', fontWeight: 'bold' };
    }
    return {};
};

const SignalTable = ({ data }) => {

    const filteredData = data
        .filter(item => item.signal === 'BUY' || item.signal === 'SELL')
        .sort((a, b) => b.ts - a.ts);

    if (filteredData.length === 0) {
        return (
            <div className="table-container">
                <p style={{ fontStyle: 'italic', color: '#999', textAlign: 'center' }}>Bu periyotta AL/SAT sinyali bulunamadı.</p>
            </div>
        );
    }

    return (
        <div className="table-container">
            <h4 style={{ color: '#ccc', borderBottom: '1px solid #555', paddingBottom: '10px' }}>
                AL/SAT Sinyal Listesi ({filteredData.length} adet)
            </h4>
            <div className="table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>Tarih & Saat</th>
                            <th>Sinyal</th>
                            <th>Fiyat</th>
                            <th>Güven Skoru (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map(item => (
                            <tr key={item.id}>
                                <td>{new Date(item.ts).toLocaleString('tr-TR')}</td>
                                <td style={getSignalStyle(item.signal)}>{item.signal}</td>
                                <td>{item.price}</td>
                                {/* Güven skorunu yüzde olarak formatla */}
                                <td>{item.confidence ? (item.confidence * 100).toFixed(1) : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SignalTable;