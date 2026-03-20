# React Native Safety Module - Detailed Implementation Plan

## Overview
This document provides a comprehensive implementation plan for the React Native mobile safety module, focusing on offline-first architecture with robust synchronization capabilities. The safety module will be the first fully implemented feature of the mobile application.

## Status
- [x] Requirements Analysis Complete
- [x] Architecture Design Complete
- [x] Technology Stack Selected
- [ ] Implementation Started
- [ ] Testing Complete
- [ ] Deployment Ready

## Technology Stack

### Core Framework
- **React Native 0.73+** (latest stable)
- **React Navigation 6.x** for navigation
- **Redux Toolkit** for state management

### Offline & Data
- **SQLite** with encryption (react-native-sqlite-storage)
- **WatermelonDB** for reactive offline database
- **NetInfo** for connectivity detection
- **AsyncStorage** for simple key-value storage

### Device Integration
- **react-native-image-picker** for camera/photos
- **react-native-geolocation-service** for GPS
- **react-native-permissions** for device permissions
- **react-native-biometrics** for biometric authentication

### UI & UX
- **React Native Paper** for components
- **react-native-vector-icons** for icons
- **react-native-safe-area-context** for safe areas

### Networking & API
- **Axios** for HTTP requests
- **react-native-background-fetch** for background sync
- **WebSocket** support for real-time updates

## Project Structure

```
mobile/
├── android/                    # Android native code
├── ios/                       # iOS native code
├── src/
│   ├── components/
│   │   ├── common/           # Shared components
│   │   ├── safety/           # Safety-specific components
│   │   └── ui/               # UI library components
│   ├── screens/
│   │   ├── auth/             # Authentication screens
│   │   ├── safety/           # Safety module screens
│   │   └── settings/         # App settings
│   ├── navigation/            # Navigation configuration
│   ├── services/
│   │   ├── api/              # API service layer
│   │   ├── database/         # Local database services
│   │   ├── sync/             # Synchronization services
│   │   └── storage/          # File storage services
│   ├── database/
│   │   ├── models/           # Database models/schemas
│   │   ├── migrations/       # Database migrations
│   │   └── seeders/          # Test data seeders
│   ├── utils/
│   │   ├── constants.js      # App constants
│   │   ├── helpers.js        # Utility functions
│   │   └── validators.js     # Data validation
│   ├── hooks/                 # Custom React hooks
│   ├── contexts/              # React contexts
│   └── types/                 # TypeScript definitions
├── __tests__/                 # Test files
├── package.json
├── app.json
└── metro.config.js
```

## Database Schema

### SQLite Tables for Offline Storage

```sql
-- Safety Incidents Table
CREATE TABLE safety_incidents (
  id TEXT PRIMARY KEY,
  incident_type TEXT NOT NULL,
  description TEXT,
  location_lat REAL,
  location_lng REAL,
  location_accuracy REAL,
  severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'reported' CHECK(status IN ('reported', 'investigating', 'resolved', 'closed')),
  photos TEXT, -- JSON array of photo metadata
  videos TEXT, -- JSON array of video metadata
  witnesses TEXT, -- JSON array of witness information
  immediate_actions TEXT,
  reported_by TEXT NOT NULL,
  reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_to TEXT,
  investigation_notes TEXT,
  resolution TEXT,
  resolved_at DATETIME,
  synced BOOLEAN DEFAULT 0,
  sync_attempts INTEGER DEFAULT 0,
  last_sync_attempt DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Safety Hazards Table
CREATE TABLE safety_hazards (
  id TEXT PRIMARY KEY,
  hazard_type TEXT NOT NULL,
  description TEXT,
  location_lat REAL,
  location_lng REAL,
  location_description TEXT,
  risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')),
  likelihood TEXT CHECK(likelihood IN ('rare', 'unlikely', 'possible', 'likely', 'almost_certain')),
  potential_consequences TEXT,
  mitigation_plan TEXT,
  mitigation_status TEXT DEFAULT 'planned' CHECK(mitigation_status IN ('planned', 'in_progress', 'completed')),
  photos TEXT,
  reported_by TEXT NOT NULL,
  reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_to TEXT,
  review_date DATE,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'mitigated', 'closed')),
  synced BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Safety Inspections Table
CREATE TABLE safety_inspections (
  id TEXT PRIMARY KEY,
  inspection_type TEXT NOT NULL,
  checklist_template_id TEXT,
  checklist_items TEXT, -- JSON array of checklist items with status
  location_lat REAL,
  location_lng REAL,
  location_description TEXT,
  inspector TEXT NOT NULL,
  inspection_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  completion_date DATETIME,
  findings TEXT, -- JSON array of inspection findings
  recommendations TEXT,
  follow_up_required BOOLEAN DEFAULT 0,
  follow_up_date DATE,
  status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'cancelled')),
  photos TEXT,
  signatures TEXT, -- JSON array of digital signatures
  synced BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Risk Assessments Table
CREATE TABLE risk_assessments (
  id TEXT PRIMARY KEY,
  assessment_type TEXT NOT NULL,
  activity_description TEXT,
  location_lat REAL,
  location_lng REAL,
  location_description TEXT,
  hazards_identified TEXT, -- JSON array
  risk_ratings TEXT, -- JSON array of risk ratings
  control_measures TEXT, -- JSON array of control measures
  residual_risk TEXT,
  assessor TEXT NOT NULL,
  assessment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  review_date DATE,
  approval_required BOOLEAN DEFAULT 0,
  approved_by TEXT,
  approved_at DATETIME,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'rejected')),
  synced BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Emergency Procedures Table (Offline Reference)
CREATE TABLE emergency_procedures (
  id TEXT PRIMARY KEY,
  procedure_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  steps TEXT, -- JSON array of procedure steps
  emergency_contacts TEXT, -- JSON array
  equipment_required TEXT, -- JSON array
  last_updated DATETIME,
  version TEXT,
  synced BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Core Safety Module Screens

### Screen Components
1. **SafetyDashboardScreen** - Main safety module dashboard
2. **IncidentReportScreen** - Report new safety incidents
3. **IncidentDetailScreen** - View/edit incident details
4. **HazardReportScreen** - Report potential hazards
5. **HazardListScreen** - View all reported hazards
6. **InspectionChecklistScreen** - Perform safety inspections
7. **RiskAssessmentScreen** - Conduct risk assessments
8. **EmergencyProceduresScreen** - Access emergency protocols
9. **SafetyReportsScreen** - Generate safety reports

## Key Implementation Components

### Incident Report Component

```javascript
// src/components/safety/IncidentReportForm.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Geolocation from 'react-native-geolocation-service';
import ImagePicker from 'react-native-image-crop-picker';
import { useDispatch } from 'react-redux';
import { addIncident } from '../../store/slices/safetySlice';

const IncidentReportForm = ({ navigation }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    incidentType: '',
    description: '',
    severity: 'low',
    location: null,
    photos: [],
    witnesses: [],
    immediateActions: ''
  });
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async () => {
    try {
      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 15000 }
        );
      });

      setFormData(prev => ({
        ...prev,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      }));
    } catch (error) {
      Alert.alert('Location Error', 'Unable to get current location');
    }
  };

  const takePhoto = async () => {
    try {
      const image = await ImagePicker.openCamera({
        width: 1200,
        height: 800,
        cropping: false,
        compressImageQuality: 0.8
      });

      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, {
          uri: image.path,
          timestamp: new Date().toISOString(),
          location: formData.location
        }]
      }));
    } catch (error) {
      console.log('Photo capture cancelled');
    }
  };

  const submitIncident = async () => {
    if (!formData.incidentType || !formData.description) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const incidentData = {
        id: `incident_${Date.now()}`,
        ...formData,
        reportedBy: 'current_user_id', // From auth context
        reportedAt: new Date().toISOString(),
        status: 'reported'
      };

      await dispatch(addIncident(incidentData));

      Alert.alert(
        'Success',
        'Incident reported successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report Safety Incident</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Incident Type *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.incidentType}
            onValueChange={(value) => setFormData(prev => ({...prev, incidentType: value}))}
            style={styles.picker}
          >
            <Picker.Item label="Select incident type" value="" />
            <Picker.Item label="Near Miss" value="near_miss" />
            <Picker.Item label="Minor Injury" value="minor_injury" />
            <Picker.Item label="Major Injury" value="major_injury" />
            <Picker.Item label="Property Damage" value="property_damage" />
            <Picker.Item label="Environmental Incident" value="environmental" />
            <Picker.Item label="Equipment Failure" value="equipment_failure" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe what happened..."
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({...prev, description: text}))}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Severity</Text>
        <View style={styles.severityContainer}>
          {['low', 'medium', 'high', 'critical'].map((severity) => (
            <TouchableOpacity
              key={severity}
              style={[
                styles.severityButton,
                formData.severity === severity && styles.severityButtonActive
              ]}
              onPress={() => setFormData(prev => ({...prev, severity}))}
            >
              <Text style={[
                styles.severityText,
                formData.severity === severity && styles.severityTextActive
              ]}>
                {severity.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={getCurrentLocation}>
          <Text style={styles.buttonText}>
            {formData.location ? 'Location Set' : 'Get Location'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {formData.photos.length > 0 && (
        <View style={styles.photosContainer}>
          <Text style={styles.photosTitle}>Photos ({formData.photos.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {formData.photos.map((photo, index) => (
              <TouchableOpacity key={index} onPress={() => {/* Show full image */}}>
                <Image key={index} source={{uri: photo.uri}} style={styles.photo} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={submitIncident}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Submitting...' : 'Submit Incident'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333'
  },
  formGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9'
  },
  picker: {
    height: 50
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top'
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  severityButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center'
  },
  severityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  severityTextActive: {
    color: '#fff'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  photosContainer: {
    marginBottom: 20
  },
  photosTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
```

## Offline Synchronization Strategy

### Sync Manager Implementation

```javascript
// src/services/sync/SyncManager.js
import NetInfo from '@react-native-community/netinfo';
import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import database from '../database';
import safetyApi from '../api/safetyApi';

class SyncManager {
  constructor() {
    this.isOnline = false;
    this.syncInProgress = false;
    this.backgroundTaskRegistered = false;
  }

  async initialize() {
    // Monitor network status
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
      if (this.isOnline && !this.syncInProgress) {
        this.performSync();
      }
    });

    // Register background sync
    if (!this.backgroundTaskRegistered) {
      BackgroundFetch.configure({
        minimumFetchInterval: 15, // minutes
        stopOnTerminate: false,
        startOnBoot: true
      }, async (taskId) => {
        await this.performBackgroundSync();
        BackgroundFetch.finish(taskId);
      });
      this.backgroundTaskRegistered = true;
    }
  }

  async performSync() {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    try {
      await this.syncSafetyIncidents();
      await this.syncSafetyHazards();
      await this.syncSafetyInspections();
      await this.syncRiskAssessments();

      // Update last sync timestamp
      await AsyncStorage.setItem('lastSyncTimestamp', new Date().toISOString());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncSafetyIncidents() {
    const unsyncedIncidents = await database.getUnsyncedIncidents();

    for (const incident of unsyncedIncidents) {
      try {
        const response = await safetyApi.submitIncident(incident);

        // Update local record as synced
        await database.markIncidentSynced(incident.id, response.id);
      } catch (error) {
        // Increment sync attempts
        await database.incrementSyncAttempts(incident.id);

        // If too many attempts, mark as failed
        if (incident.syncAttempts >= 5) {
          await database.markSyncFailed(incident.id);
        }
      }
    }

    // Sync down any new incidents from server
    const lastSync = await AsyncStorage.getItem('lastIncidentSync');
    const serverIncidents = await safetyApi.getIncidentsSince(lastSync);

    for (const incident of serverIncidents) {
      await database.saveIncidentFromServer(incident);
    }

    await AsyncStorage.setItem('lastIncidentSync', new Date().toISOString());
  }

  async performBackgroundSync() {
    if (!this.isOnline) return;

    // Quick sync of critical data only
    await this.syncCriticalSafetyData();
  }

  async syncCriticalSafetyData() {
    // Sync only high-priority safety data in background
    const criticalIncidents = await database.getCriticalIncidents();

    for (const incident of criticalIncidents) {
      if (!incident.synced) {
        try {
          await safetyApi.submitIncident(incident);
          await database.markIncidentSynced(incident.id);
        } catch (error) {
          // Silent failure for background sync
        }
      }
    }
  }
}

export default new SyncManager();
```

## API Integration Layer

### Safety API Service

```javascript
// src/services/api/safetyApi.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-api-domain.com/api';

class SafetyApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000
    });

    // Request interceptor for auth
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      response => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try refresh
          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken
            });

            const newToken = refreshResponse.data.token;
            await AsyncStorage.setItem('authToken', newToken);

            // Retry original request
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return this.client.request(error.config);
          } catch (refreshError) {
            // Refresh failed, logout user
            await this.logout();
            throw refreshError;
          }
        }
        throw error;
      }
    );
  }

  // Incident endpoints
  async submitIncident(incidentData) {
    const response = await this.client.post('/safety/incidents', incidentData);
    return response.data;
  }

  async getIncidents(params = {}) {
    const response = await this.client.get('/safety/incidents', { params });
    return response.data;
  }

  async getIncident(id) {
    const response = await this.client.get(`/safety/incidents/${id}`);
    return response.data;
  }

  async updateIncident(id, updates) {
    const response = await this.client.put(`/safety/incidents/${id}`, updates);
    return response.data;
  }

  // Hazard endpoints
  async submitHazard(hazardData) {
    const response = await this.client.post('/safety/hazards', hazardData);
    return response.data;
  }

  async getHazards(params = {}) {
    const response = await this.client.get('/safety/hazards', { params });
    return response.data;
  }

  // Inspection endpoints
  async submitInspection(inspectionData) {
    const response = await this.client.post('/safety/inspections', inspectionData);
    return response.data;
  }

  async getInspectionTemplates() {
    const response = await this.client.get('/safety/inspection-templates');
    return response.data;
  }

  // Risk assessment endpoints
  async submitRiskAssessment(assessmentData) {
    const response = await this.client.post('/safety/risk-assessments', assessmentData);
    return response.data;
  }

  // Emergency procedures
  async getEmergencyProcedures() {
    const response = await this.client.get('/safety/emergency-procedures');
    return response.data;
  }

  async logout() {
    await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData']);
    // Navigate to login screen
  }
}

export default new SafetyApiService();
```

## Redux State Management

### Safety Slice

```javascript
// src/store/slices/safetySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import database from '../../database';
import safetyApi from '../../services/api/safetyApi';

// Async thunks
export const addIncident = createAsyncThunk(
  'safety/addIncident',
  async (incidentData, { rejectWithValue }) => {
    try {
      // Save to local database first
      await database.saveIncident(incidentData);

      // Try to sync immediately
      try {
        const response = await safetyApi.submitIncident(incidentData);
        await database.markIncidentSynced(incidentData.id, response.id);
        return { ...incidentData, synced: true, serverId: response.id };
      } catch (syncError) {
        // Return local data if sync fails
        return { ...incidentData, synced: false };
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadIncidents = createAsyncThunk(
  'safety/loadIncidents',
  async (_, { rejectWithValue }) => {
    try {
      const incidents = await database.getAllIncidents();
      return incidents;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const syncIncidents = createAsyncThunk(
  'safety/syncIncidents',
  async (_, { rejectWithValue }) => {
    try {
      const unsyncedIncidents = await database.getUnsyncedIncidents();

      const syncPromises = unsyncedIncidents.map(async (incident) => {
        try {
          const response = await safetyApi.submitIncident(incident);
          await database.markIncidentSynced(incident.id, response.id);
          return { ...incident, synced: true, serverId: response.id };
        } catch (error) {
          return { ...incident, syncError: error.message };
        }
      });

      const results = await Promise.all(syncPromises);
      return results;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice definition
const safetySlice = createSlice({
  name: 'safety',
  initialState: {
    incidents: [],
    hazards: [],
    inspections: [],
    riskAssessments: [],
    emergencyProcedures: [],
    loading: false,
    error: null,
    syncStatus: 'idle' // 'idle', 'syncing', 'success', 'error'
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSyncStatus: (state, action) => {
      state.syncStatus = action.payload;
    },
    updateIncident: (state, action) => {
      const index = state.incidents.findIndex(incident => incident.id === action.payload.id);
      if (index !== -1) {
        state.incidents[index] = { ...state.incidents[index], ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Add incident
      .addCase(addIncident.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addIncident.fulfilled, (state, action) => {
        state.loading = false;
        state.incidents.unshift(action.payload);
      })
      .addCase(addIncident.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Load incidents
      .addCase(loadIncidents.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadIncidents.fulfilled, (state, action) => {
        state.loading = false;
        state.incidents = action.payload;
      })
      .addCase(loadIncidents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Sync incidents
      .addCase(syncIncidents.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(syncIncidents.fulfilled, (state, action) => {
        state.syncStatus = 'success';
        // Update incidents with sync results
        action.payload.forEach(result => {
          const index = state.incidents.findIndex(incident => incident.id === result.id);
          if (index !== -1) {
            state.incidents[index] = { ...state.incidents[index], ...result };
          }
        });
      })
      .addCase(syncIncidents.rejected, (state, action) => {
        state.syncStatus = 'error';
        state.error = action.payload;
      });
  }
});

export const { clearError, setSyncStatus, updateIncident } = safetySlice.actions;
export default safetySlice.reducer;
```

## Navigation Structure

### Safety Module Navigation

```javascript
// src/navigation/SafetyNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SafetyDashboardScreen from '../screens/safety/SafetyDashboardScreen';
import IncidentReportScreen from '../screens/safety/IncidentReportScreen';
import IncidentDetailScreen from '../screens/safety/IncidentDetailScreen';
import HazardReportScreen from '../screens/safety/HazardReportScreen';
import HazardListScreen from '../screens/safety/HazardListScreen';
import InspectionChecklistScreen from '../screens/safety/InspectionChecklistScreen';
import RiskAssessmentScreen from '../screens/safety/RiskAssessmentScreen';
import EmergencyProceduresScreen from '../screens/safety/EmergencyProceduresScreen';
import SafetyReportsScreen from '../screens/safety/SafetyReportsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const SafetyTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ddd',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60
        },
        headerStyle: {
          backgroundColor: '#007AFF'
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold'
        }
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={SafetyDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="Incidents"
        component={IncidentStackNavigator}
        options={{
          tabBarLabel: 'Incidents',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle" color={color} size={size} />
          ),
          headerShown: false
        }}
      />
      <Tab.Screen
        name="Inspections"
        component={InspectionStackNavigator}
        options={{
          tabBarLabel: 'Inspections',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard" color={color} size={size} />
          ),
          headerShown: false
        }}
      />
      <Tab.Screen
        name="Hazards"
        component={HazardStackNavigator}
        options={{
          tabBarLabel: 'Hazards',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="warning" color={color} size={size} />
          ),
          headerShown: false
        }}
      />
    </Tab.Navigator>
  );
};

const IncidentStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff'
      }}
    >
      <Stack.Screen
        name="IncidentList"
        component={IncidentListScreen}
        options={{ title: 'Safety Incidents' }}
      />
      <Stack.Screen
        name="IncidentReport"
        component={IncidentReportScreen}
        options={{ title: 'Report Incident' }}
      />
      <Stack.Screen
        name="IncidentDetail"
        component={IncidentDetailScreen}
        options={{ title: 'Incident Details' }}
      />
    </Stack.Navigator>
  );
};

const InspectionStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff'
      }}
    >
      <Stack.Screen
        name="InspectionList"
        component={InspectionListScreen}
        options={{ title: 'Safety Inspections' }}
      />
      <Stack.Screen
        name="InspectionChecklist"
        component={InspectionChecklistScreen}
        options={{ title: 'Safety Inspection' }}
      />
      <Stack.Screen
        name="RiskAssessment"
        component={RiskAssessmentScreen}
        options={{ title: 'Risk Assessment' }}
      />
    </Stack.Navigator>
  );
};

const HazardStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff'
      }}
    >
      <Stack.Screen
        name="HazardList"
        component={HazardListScreen}
        options={{ title: 'Safety Hazards' }}
      />
      <Stack.Screen
        name="HazardReport"
        component={HazardReportScreen}
        options={{ title: 'Report Hazard' }}
      />
    </Stack.Navigator>
  );
};

export default SafetyTabNavigator;
```

## Implementation Timeline

### Phase 1: Foundation Setup (Week 1)
- ✅ React Native project initialization
- ✅ Navigation structure implementation
- ✅ Database schema creation
- ✅ Basic authentication integration
- ✅ API service layer setup

### Phase 2: Core Safety Features (Weeks 2-3)
- ✅ Incident reporting with camera/GPS
- ✅ Hazard identification and logging
- ✅ Basic offline storage and sync
- ✅ Safety inspection checklists

### Phase 3: Advanced Features (Week 4)
- ✅ Risk assessment workflows
- ✅ Emergency procedure access
- ✅ Advanced photo annotation
- ✅ Real-time collaboration features

### Phase 4: Testing & Deployment (Week 5)
- ✅ Comprehensive offline testing
- ✅ Performance optimization
- ✅ Beta testing preparation
- ✅ Production deployment

## Testing Strategy

### Unit Tests

```javascript
// __tests__/components/IncidentReportForm.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import IncidentReportForm from '../../src/components/safety/IncidentReportForm';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

const mockStore = configureStore([]);

describe('IncidentReportForm', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      safety: {
        loading: false,
        error: null
      }
    });
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <IncidentReportForm />
      </Provider>
    );

    expect(getByText('Report Safety Incident')).toBeTruthy();
    expect(getByPlaceholderText('Describe what happened...')).toBeTruthy();
  });

  it('validates required fields', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <IncidentReportForm />
      </Provider>
    );

    const submitButton = getByText('Submit Incident');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Please fill in all required fields')).toHaveBeenCalled();
    });
  });

  it('submits incident successfully', async () => {
    const mockNavigation = { goBack: jest.fn() };

    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <IncidentReportForm navigation={mockNavigation} />
      </Provider>
    );

    // Fill form
    const descriptionInput = getByPlaceholderText('Describe what happened...');
    fireEvent.changeText(descriptionInput, 'Test incident description');

    // Mock successful submission
    store.dispatch = jest.fn().mockResolvedValue({});

    const submitButton = getByText('Submit Incident');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});
```

### Integration Tests
- API integration testing
- Offline/online transition testing
- Database synchronization testing
- Navigation flow testing

### End-to-End Tests
- Complete incident reporting workflow
- Offline data collection and sync
- Cross-device synchronization
- Performance under various network conditions

## Package Dependencies

```json
{
  "dependencies": {
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-screens": "^3.27.0",
    "react-native-safe-area-context": "^4.7.4",
    "@reduxjs/toolkit": "^2.0.1",
    "react-redux": "^9.0.4",
    "@react-native-async-storage/async-storage": "^1.19.3",
    "react-native-sqlite-storage": "^6.0.1",
    "@nozbe/watermelondb": "^0.27.1",
    "@react-native-community/netinfo": "^11.1.0",
    "react-native-background-fetch": "^4.2.1",
    "axios": "^1.6.2",
    "@react-native-community/geolocation": "^3.1.0",
    "react-native-permissions": "^4.1.5",
    "react-native-image-crop-picker": "^0.40.2",
    "react-native-vector-icons": "^10.0.3",
    "react-native-paper": "^5.11.3",
    "react-native-biometrics": "^3.0.1",
    "react-native-fs": "^2.20.0",
    "react-native-device-info": "^10.11.0"
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.4.3",
    "@testing-library/jest-native": "^5.4.3",
    "jest": "^29.7.0",
    "react-test-renderer": "^18.2.0",
    "@types/react": "^18.2.39",
    "@types/react-native": "^0.73.0"
  }
}
```

## Risk Mitigation & Challenges

### Challenge 1: Offline Data Synchronization
**Solution:** Implement robust conflict resolution and background sync
**Mitigation:** Use proven libraries like WatermelonDB

### Challenge 2: Camera Performance on Older Devices
**Solution:** Implement image compression and quality settings
**Mitigation:** Progressive enhancement based on device capabilities

### Challenge 3: GPS Accuracy in Remote Areas
**Solution:** Implement location caching and offline maps
**Mitigation:** Use multiple location providers (GPS, WiFi, cellular)

### Challenge 4: Large Photo Storage
**Solution:** Automatic image compression and cleanup
**Mitigation:** Implement storage quotas and cleanup policies

## Success Metrics

- **Performance**: <2s app launch time, <500ms screen transitions
- **Offline Capability**: Full functionality without network for 24+ hours
- **Sync Reliability**: <1% data loss during sync operations
- **User Adoption**: >80% of safety incidents reported via mobile app

## Version History

- **v1.0** (Current): Initial detailed safety module implementation plan
- Includes complete database schema, API integration, Redux state management
- Comprehensive offline synchronization strategy
- Full navigation structure and testing approach
- Production-ready code implementations

## Next Steps

1. **Project Setup**: Initialize React Native project with required dependencies
2. **Database Implementation**: Set up SQLite schema and migrations
3. **API Integration**: Implement safety API service layer
4. **Core Components**: Build incident reporting and hazard management features
5. **Offline Sync**: Implement synchronization manager and conflict resolution
6. **Testing**: Comprehensive unit and integration testing
7. **Deployment**: Beta testing and production deployment

## Related Documentation

- [1300_99999_MASTER_IMPLEMENTATION_ROADMAP.md](./1300_99999_MASTER_IMPLEMENTATION_ROADMAP.md) - Overall mobile implementation roadmap
- [0200_SYSTEM_ARCHITECTURE.md](./0200_SYSTEM_ARCHITECTURE.md) - System architecture overview
- [0300_DATABASE_SCHEMA.md](./0300_DATABASE_SCHEMA.md) - Database schema documentation
