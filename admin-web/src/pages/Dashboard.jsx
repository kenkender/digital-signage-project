// Dashboard.jsx
// หน้า Overview แสดงรายการคอนเทนต์ทั้งหมด


import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ContentTable from '../components/ContentTable.jsx';


// ใช้ .env: VITE_API_BASE_URL (default = Render backend)
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://digital-signage-project.onrender.com/api';


const Dashboard = () => {
const [contents, setContents] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');


const fetchContents = async () => {
try {
setLoading(true);
setError('');
const res = await axios.get(`${BASE_URL}/content`);
setContents(res.data);
} catch (err) {
console.error(err);
setError('Failed to load contents');
} finally {
setLoading(false);
}
};


useEffect(() => {
fetchContents();
}, []);


return (
<div className="space-y-4">
<div className="grid grid-cols-1 gap-6 justify-center">
<h2 className="text-2xl font-semibold">Dashboard</h2>
<button
onClick={fetchContents}
className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
>
Refresh
</button>
</div>


{loading && <p className="text-slate-300">Loading...</p>}
{error && <p className="text-red-400 text-sm">{error}</p>}


<ContentTable contents={contents} />
</div>
);
};


export default Dashboard;
