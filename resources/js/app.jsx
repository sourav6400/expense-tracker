import {trackVisualViewport} from './viewport';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
trackVisualViewport();
createInertiaApp({ resolve: name => import(`./Pages/${name}.jsx`), setup({ el, App, props }) { createRoot(el).render(<App {...props} />); }, progress: { color: '#196b53' } });
