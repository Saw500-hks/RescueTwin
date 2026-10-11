/**
 * Nepal Command Center — RescueTwin Nepal Disaster Intelligence Dashboard
 *
 * Wraps the generic CommandCenter with Nepal-specific configuration.
 *
 * Data status:
 *   Events: HISTORICAL DATA (documented past events — not current operations)
 *   Buildings: DATA UNAVAILABLE (not fabricated)
 *   Geography: VERIFIED ADMINISTRATIVE DATA (Government of Nepal / OCHA 2017)
 *   Boundary: PUBLIC DOMAIN GEOGRAPHIC DATA (Natural Earth 1:10m)
 */
import React from 'react';
import { Navigate } from 'react-router-dom';

const NepalCommandCenter: React.FC = () => {
  return <Navigate to="/map" replace />;
};

export default NepalCommandCenter;
