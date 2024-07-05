import React, { useEffect } from 'react';
import { create } from 'zustand';
import axios from 'axios'; // Assuming you're using axios for API requests
import { StudyRoom } from './components/StudyRoom'; // Import your StudyRoom component
import './App.css'; // Import your CSS file for styling (optional)


// Interface to define the structure of your app's state
interface AppState {
    preferences: {
        theme: string;
        layout: string;
    };
    setPreferences: (newPreferences: Partial<AppState['preferences']>) => void; // Function to update preferences
    fetchPreferences: (userId: number) => void; // Function to fetch initial preferences
}

// Create your Zustand store
export const useStore = create<AppState>((set) => ({
    preferences: {
        theme: 'light', // Default theme
        layout: 'default', // Default layout
    },
    setPreferences: (newPreferences) => set((state) => ({
        preferences: { ...state.preferences, ...newPreferences },
    })),
    fetchPreferences: async (userId) => {
        try {
            const response = await axios.get(`/api/preferences?userId=${userId}`); // Fetch preferences from the backend
            set({ preferences: response.data });
        } catch (error) {
            // Handle error if fetching preferences fails
            console.error('Error fetching preferences:', error);
        }
    },
}));

function App() {
    // Accessing the store
    const { preferences, fetchPreferences } = useStore();

    useEffect(() => {
        const userId = 1; // Replace with logic to get the actual user ID
        fetchPreferences(userId); // Fetch initial preferences when the component mounts
    }, [fetchPreferences]); // Include fetchPreferences in the dependency array

    return (
        <div className="app">
            <StudyRoom /> 
        </div>
    );
}

export default App;
