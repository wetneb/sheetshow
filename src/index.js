import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store, persistor } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import './index.css';
import DiagramViewer from './components/diagram_viewer.js' ;
// ========================================

ReactDOM.render(
  <Provider store={store}>
     <PersistGate loading={null} persistor={persistor}>
        <DiagramViewer />
     </PersistGate>
  </Provider>,
  document.getElementById('root')
);

