/**
 * Punkt wejścia aplikacji React - Strażnik Prawa Medycznego.
 * 
 * @description Ten plik inicjalizuje aplikację React i montuje główny komponent App
 * do elementu DOM o id "root". Wykorzystuje React 19 z włączonym StrictMode
 * dla dodatkowych sprawdzeń w trybie deweloperskim.
 * 
 * @module index
 * @requires react
 * @requires react-dom/client
 * @requires ./App
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Element DOM do montowania aplikacji React.
 * 
 * @type {HTMLElement | null}
 * @description Pobiera element z id "root" z index.html. Jeśli element nie istnieje,
 * aplikacja wyrzuci błąd i nie uruchomi się.
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

/**
 * Root React - główny punkt montowania aplikacji.
 * 
 * @type {ReactDOM.Root}
 * @description Tworzy root React 19 używając nowego API createRoot (concurrent mode).
 * Umożliwia wykorzystanie nowych funkcji React 19 takich jak concurrent rendering.
 */
const root = ReactDOM.createRoot(rootElement);

/**
 * Renderowanie głównego komponentu aplikacji.
 * 
 * @description Montuje komponent App w trybie StrictMode, który:
 * - Wykrywa niebezpieczne praktyki lifecycle
 * - Ostrzega o przestarzałych API
 * - Wykrywa nieoczekiwane efekty uboczne
 * - Zapewnia lepsze komunikaty o błędach w trybie deweloperskim
 */
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
