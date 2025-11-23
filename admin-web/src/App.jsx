// App.jsx
// จัดการ navigation ระหว่างหน้า Dashboard / Upload / Playlist


import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import UploadContent from './pages/UploadContent.jsx';
import PlaylistManager from './pages/PlaylistManager.jsx';
import ControlDashboard from './pages/ControlDashboard.jsx';


const App = () => {
const [activePage, setActivePage] = useState('dashboard');


const renderPage = () => {
switch (activePage) {
case 'upload':
return <UploadContent />;
case 'playlist':
return <PlaylistManager />;
case 'control':
return <ControlDashboard />;
case 'dashboard':
default:
return <Dashboard />;
}
};


return (
<div className="min-h-screen flex flex-col text-slate-100 app-gradient">
<Navbar activePage={activePage} onChangePage={setActivePage} />
<main className="flex-1 p-6 w-full max-w-screen-2xl mx-auto">
{renderPage()}
</main>
</div>
);
};


export default App;
