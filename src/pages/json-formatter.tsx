import React, { useState } from 'react';

const JsonFormatter: React.FC = () => {
    const [input, setInput] = useState('');
    const [formatted, setFormatted] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFormat = () => {
        try {
            const obj = JSON.parse(input);
            setFormatted(JSON.stringify(obj, null, 2));
            setError(null);
        } catch (e: unknown) {
            console.error(e);
            setFormatted(null);
            setError('無効なJSONです');
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
            <h2>JSON整形ツール</h2>
            <textarea
                rows={10}
                style={{ width: '100%', fontFamily: 'monospace' }}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="ここにJSONを入力してください"
            />
            <div style={{ margin: '12px 0' }}>
                <button onClick={handleFormat}>整形</button>
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {formatted && (
                <pre style={{ background: '#f4f4f4', padding: 12, borderRadius: 4 }}>
                    {formatted}
                </pre>
            )}
        </div>
    );
};

export default JsonFormatter;