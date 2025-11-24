import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://digital-signage-project.onrender.com/api";

function PlaylistManager({ token, tenantId }) {
  const [playlistName, setPlaylistName] = useState("default");
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");
  const [savingAll, setSavingAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${BASE_URL}/content?tenantId=${encodeURIComponent(tenantId || "")}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const data = await res.json();
      setItems(
        (data || []).sort(
          (a, b) => (a.playlistOrder || 0) - (b.playlistOrder || 0)
        )
      );
    } catch (err) {
      console.error(err);
      setMessage("Failed to load contents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(
        `${BASE_URL}/content/${id}?tenantId=${encodeURIComponent(
          tenantId || ""
        )}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const result = await res.json();

      if (res.ok) {
        fetchContents();
        setMessage("Deleted successfully");
      } else {
        setMessage(result.message || "Failed to delete content");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete content");
    }
  };

  const updateOrder = (id, newOrder) => {
    setItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, playlistOrder: newOrder } : item
      )
    );
  };

  const saveOrder = async (id, order) => {
    setSavingId(id);
    setMessage("");
    try {
      await axios.put(
        `${BASE_URL}/content/${id}?tenantId=${encodeURIComponent(
          tenantId || ""
        )}`,
        {
          playlistOrder: Number(order) || 0,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setMessage("อัปเดตลำดับสำเร็จ");
      fetchContents();
    } catch (err) {
      console.error(err);
      setMessage("อัปเดตลำดับไม่สำเร็จ");
    } finally {
      setSavingId("");
    }
  };

  const saveAllOrders = async () => {
    setSavingAll(true);
    setMessage("");
    try {
      await Promise.all(
        items.map((item) =>
          axios.put(
            `${BASE_URL}/content/${item._id}?tenantId=${encodeURIComponent(
              tenantId || ""
            )}`,
            {
              playlistOrder: Number(item.playlistOrder) || 0,
            },
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          )
        )
      );
      setMessage("บันทึกลำดับทั้งหมดสำเร็จ");
      fetchContents();
    } catch (err) {
      console.error(err);
      setMessage("บันทึกลำดับทั้งหมดไม่สำเร็จ");
    } finally {
      setSavingAll(false);
    }
  };

  const messageTone =
    message.includes("success") || message.includes("สำเร็จ")
      ? "success"
      : "error";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Playlist Manager
          </p>
          <h2 className="text-2xl font-semibold text-white">
            จัดการเพลย์ลิสต์และคิวการเล่น
          </h2>
        </div>
        {message && (
          <div
            className={`px-3 py-2 rounded-lg text-sm border shadow-sm ${
              messageTone === "success"
                ? "border-emerald-600/50 bg-emerald-500/10 text-emerald-200"
                : "border-rose-600/50 bg-rose-500/10 text-rose-200"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-lg p-6 space-y-5">
        <div className="grid gap-3 sm:grid-cols-[180px_auto] items-center">
          <label className="text-sm text-slate-300">Playlist Name</label>
          <div className="flex flex-wrap gap-3">
            <input
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="flex-1 min-w-[220px] rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Playlist name"
            />
            <button
              onClick={fetchContents}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium border border-slate-700 text-slate-100 transition"
            >
              Refresh
            </button>
            <button
              onClick={saveAllOrders}
              disabled={savingAll || loading}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm font-medium border border-emerald-500 text-white transition disabled:opacity-60"
            >
              {savingAll ? "Saving..." : "Save All Orders"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800/80 text-slate-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold tracking-tight">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-semibold tracking-tight">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-semibold tracking-tight">
                  Order
                </th>
                <th className="px-4 py-3 text-left font-semibold tracking-tight">
                  Duration (s)
                </th>
                <th className="px-4 py-3 text-left font-semibold tracking-tight">
                  Action / Reorder
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Loading playlist...
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    ไม่มีคอนเทนต์ในเพลย์ลิสต์นี้
                  </td>
                </tr>
              )}

              {!loading &&
                items.map((item, idx) => (
                  <tr
                    key={item._id}
                    className={`${
                      idx % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"
                    } hover:bg-slate-800/40 transition`}
                  >
                    <td className="px-4 py-3 text-slate-100">{item.title}</td>
                    <td className="px-4 py-3 capitalize text-slate-200">
                      {item.type}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {item.playlistOrder}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {item.durationSeconds}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.playlistOrder}
                          onChange={(e) =>
                            updateOrder(item._id, Number(e.target.value))
                          }
                          className="w-20 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-sm"
                        />
                        <button
                          onClick={() =>
                            saveOrder(item._id, item.playlistOrder)
                          }
                          disabled={savingId === item._id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60"
                        >
                          {savingId === item._id ? "Saving" : "Save"}
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="px-3 py-1.5 rounded-lg border border-rose-600/60 text-rose-200 hover:bg-rose-600/10 text-xs font-semibold transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PlaylistManager;
