import RallyTable from './components/RallyTable';
import DarkModeButton from './components/DarkModeButton'; // Se cambió el nombre aquí
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-end mb-3">
        {/* Y se usa el nuevo nombre */}
        <DarkModeButton />
      </div>

      <RallyTable />
    </div>
  );
}

export default App;