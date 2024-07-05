// core-js has issues with Promise feature detection on Edge, and hence
// polyfills Promise incorrectly. Importing this polyfill directly resolves that.
// This is necessary as PersistGate used in ./App uses `Promise.prototype.finally`.
// See: https://github.com/zloirock/core-js/issues/579#issuecomment-504325213
import "core-js/es/promise/finally";

import ReactDOM from "react-dom";
import ReactModal from "react-modal";
import { createRoot } from "react-dom/client";

import configureStore from "bootstrapping/configure-store";
import subscribeOnlineEvents from "bootstrapping/subscribeOnlineEvents";
import registerServiceWorker from "bootstrapping/service-worker-manager";

import "styles/globals.scss";
import "styles/main.scss";

import App from "./App";

const { store, persistor } = configureStore();

subscribeOnlineEvents(store);

// Initialize ReactModal
ReactModal.setAppElement("#app");

const root = createRoot(document.getElementById("app")!);
root.render;
root.render(<App store={store} persistor={persistor} />);

if (
  ((NUSMODS_ENV === "preview" ||
    NUSMODS_ENV === "staging" ||
    NUSMODS_ENV === "production") &&
    "serviceWorker" in navigator &&
    window.location.protocol === "https:") ||
  // Allow us to force service worker to be enabled for debugging
  DEBUG_SERVICE_WORKER
) {
  registerServiceWorker(store);
}

export default store;
