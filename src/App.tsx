import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AudioProvider } from './context/AudioContext';

function App() {
  return (
    <AudioProvider>
      <RouterProvider router={router} />
    </AudioProvider>
  );
}

export default App;
