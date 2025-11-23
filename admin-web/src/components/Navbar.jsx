// Navbar.jsx
// แถบเมนูด้านบนสำหรับสลับหน้า


import React from 'react';


const Navbar = ({ activePage, onChangePage }) => {
const tabs = [
{ id: 'dashboard', label: 'Dashboard' },
{ id: 'upload', label: 'Upload Content' },
{ id: 'playlist', label: 'Playlist Manager' },
{ id: 'control', label: 'Control Dashboard' }
];


return (
<header className="bg-primary shadow-lg">
<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-lg bg-accent" />
<h1 className="text-xl font-semibold tracking-tight">Digital Signage Admin</h1>
</div>
<nav className="flex gap-2">
{tabs.map((tab) => (
<button
key={tab.id}
onClick={() => onChangePage(tab.id)}
className={`px-3 py-1.5 rounded-full text-sm font-medium transition
${
activePage === tab.id
? 'bg-accent text-white shadow'
: 'bg-slate-800 text-slate-200 hover:bg-slate-700'
}`}
>
{tab.label}
</button>
))}
</nav>
</div>
</header>
);
};


export default Navbar;
