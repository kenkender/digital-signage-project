// ContentTable.jsx
// ตารางแสดงรายการคอนเทนต์ทั้งหมด


import React from 'react';


const ContentTable = ({ contents }) => {
return (
<div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60 backdrop-blur shadow">
<table className="min-w-full text-sm">
<thead className="bg-slate-800">
<tr>
<th className="px-3 py-2 text-left">Title</th>
<th className="px-3 py-2 text-left">Type</th>
<th className="px-3 py-2 text-left">Playlist</th>
<th className="px-3 py-2 text-left">Order</th>
<th className="px-3 py-2 text-left">Duration (s)</th>
<th className="px-3 py-2 text-left">Created</th>
</tr>
</thead>
<tbody>
{contents.length === 0 && (
<tr>
<td colSpan="6" className="px-3 py-4 text-center text-slate-400">
No content yet.
</td>
</tr>
)}
{contents.map((item) => (
<tr key={item._id} className="border-t border-slate-800 hover:bg-slate-800/60">
<td className="px-3 py-2">{item.title}</td>
<td className="px-3 py-2 capitalize">{item.type}</td>
<td className="px-3 py-2">{item.playlistName}</td>
<td className="px-3 py-2">{item.playlistOrder}</td>
<td className="px-3 py-2">{item.durationSeconds}</td>
<td className="px-3 py-2 text-slate-400 text-xs">
{new Date(item.createdAt).toLocaleString()}
</td>
</tr>
))}
</tbody>
</table>
</div>
);
};


export default ContentTable;