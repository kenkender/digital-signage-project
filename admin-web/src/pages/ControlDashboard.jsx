import React, { useState } from 'react';
import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ControlDashboard = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [jumpIndex, setJumpIndex] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendControl = async (type, payload = {}) => {
    setStatus('');
    setError('');
    setSending(true);
    try {
      const res = await axios.post(`${BASE_URL}/control`, { type, payload });
      setStatus(`ส่งคำสั่ง ${type} สำเร็จ #${res.data?.version || ''}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'ส่งคำสั่งไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  const handleJump = () => {
    const idx = Number(jumpIndex);
    if (Number.isNaN(idx) || idx < 0) {
      setError('กรุณากรอก index เป็นตัวเลข 0 หรือมากกว่า');
      return;
    }
    sendControl('jump', { index: idx });
  };

  const handleMessage = () => {
    if (!message.trim()) {
      setError('กรุณากรอกข้อความประกาศ');
      return;
    }
    sendControl('show_message', { message });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pt-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Control
          </p>
          <h2 className="text-3xl font-semibold text-white">Control Dashboard</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => sendControl('play')}
          disabled={sending}
          className="w-full py-4 text-lg font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
        >
          ▶ Play
        </button>
        <button
          type="button"
          onClick={() => sendControl('pause')}
          disabled={sending}
          className="w-full py-4 text-lg font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60"
        >
          ⏸ Pause
        </button>
        <button
          type="button"
          onClick={() => sendControl('reload')}
          disabled={sending}
          className="w-full py-4 text-lg font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60"
        >
          🔄 Reload
        </button>
        <button
          type="button"
          onClick={() => sendControl('prev')}
          disabled={sending}
          className="w-full py-4 text-lg font-semibold rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-60"
        >
          ⏮ Prev
        </button>
        <button
          type="button"
          onClick={() => sendControl('next')}
          disabled={sending}
          className="w-full py-4 text-lg font-semibold rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-60"
        >
          ⏭ Next
        </button>
        <button
          type="button"
          onClick={() => sendControl('clear_message')}
          disabled={sending}
          className="w-full py-4 text-lg font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60"
        >
          ❌ Clear Message
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/60 space-y-3">
          <h3 className="text-lg font-semibold">Jump to Index</h3>
          <div className="flex gap-3">
            <input
              type="number"
              value={jumpIndex}
              onChange={(e) => setJumpIndex(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
              placeholder="0"
            />
            <button
              type="button"
              onClick={handleJump}
              disabled={sending}
              className="px-4 py-2 rounded-lg bg-accent text-white font-semibold disabled:opacity-60"
            >
              Jump
            </button>
          </div>
          <p className="text-xs text-slate-400">ระบุ index (เริ่มที่ 0)</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/60 space-y-3">
          <h3 className="text-lg font-semibold">Overlay Message</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
            placeholder="ข้อความประกาศบนหน้าจอ"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleMessage}
              disabled={sending}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-60"
            >
              📝 Send Message
            </button>
            <button
              type="button"
              onClick={() => sendControl('clear_message')}
              disabled={sending}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold disabled:opacity-60"
            >
              ❌ Clear
            </button>
          </div>
          <p className="text-xs text-slate-400">
            ใช้สำหรับแสดงข้อความประกาศทับบนจอ player
          </p>
        </div>
      </div>

      {(status || error) && (
        <div className="text-sm">
          {status && <p className="text-emerald-400">{status}</p>}
          {error && <p className="text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default ControlDashboard;
