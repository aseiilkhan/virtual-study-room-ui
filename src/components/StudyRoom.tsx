import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { create } from 'zustand';
import Timer from './Timer';
import Notes from './Notes';
import SpotifyPlayer from './SpotifyPlayer';
import {YoutubePlayer} from './YoutubePlayer';
import ThemeSelector from './ThemeSelector';
import {BackgroundSelector} from './BackgroundSelector';
import {CustomizableLayout} from './CustomizableLayout';
import './StudyRoom.css';  // Create this file for styling
import { stat } from 'fs';
import { useLocation } from 'react-router-dom';

// Zustand Store (You'll need to define this separately)
interface StudyRoomState {
  theme: string;
  layout: string[]; 
  backgroundImage: string;
  setTheme: (theme: string) => void;
  setLayout: (layout: string[]) => void;
  setBackgroundImage: (backgroundImage: string) => void;
}

export const useStudyRoomStore = create<StudyRoomState>((set) => ({
  theme: 'light',
  layout: [], // Initialize with your default layout
  backgroundImage: '',
  setTheme: (theme) => set((state) => {state.theme = theme; console.log(state); return state;}),
  setLayout: (layout) => set((state) => {state.layout = layout; console.log(state); return state;}),
  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
}));

export function StudyRoom() {
  const { theme, layout, backgroundImage, setTheme, setLayout, setBackgroundImage } = useStudyRoomStore();
  const location = useLocation();
    useEffect(() => {
      const queryParams = new URLSearchParams(location.search);
      const accessToken = queryParams.get('access_token');
  
      if (accessToken) {
        // Store the access token in localStorage
        localStorage.setItem('spotifyAccessToken', accessToken);
      }
    });
  useEffect(() => {
    // Fetch initial preferences from the backend here
    axios.get('/api/preferences?userId=1') // Replace 1 with the actual user ID
      .then(response => {
        setTheme(response.data.theme);
        setLayout(response.data.layout ? JSON.parse(response.data.layout) : []); // Parse layout from JSON if available
        setBackgroundImage(localStorage.getItem('backgroundImage') || ''); // Load background from local storage
      })
      .catch(error => {
        console.error('Error fetching preferences:', error);
      });
  }, []); // Run this effect only once on component mount

  return (
    <div className={`study-room ${theme}`} style={{ backgroundImage: `url(${backgroundImage})` }}>
        <p>Study Room</p>
        <ThemeSelector />
        <BackgroundSelector />
        <CustomizableLayout 
          layout={layout}
          onLayoutChange={setLayout}  // Assuming you have a function to handle layout changes
        >
            <Timer />
            <Notes />
            <SpotifyPlayer />
            <YoutubePlayer />
            {/* Add more app components here */}
        </CustomizableLayout>
    </div>
  );
}

export default StudyRoom;
