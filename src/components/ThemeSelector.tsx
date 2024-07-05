import React from 'react';
import { BsFillSunFill, BsFillMoonFill } from 'react-icons/bs'; // Install react-icons if you haven't: npm install react-icons
import axios from "axios";
import { useStudyRoomStore } from './StudyRoom';
import { useStore } from '../App';

function ThemeSelector() {
  const { theme, setTheme } = useStudyRoomStore();
  const { preferences, setPreferences } = useStore();
  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setPreferences({ theme: newTheme }); // Update the preferences in the Zustand store

    // Update in the backend as well:
    axios.put('/api/preferences?userId=1', { theme: newTheme }) // Update this URL with your API endpoint
        .then(response => {
          // Optionally handle the response here
        })
        .catch(error => {
          console.error('Error updating preferences:', error);
        });
  };

  return (
    <button className="theme-toggle" onClick={handleThemeToggle}>
      {theme === 'light' ? <BsFillMoonFill /> : <BsFillSunFill />}
    </button>
  );
}

export default ThemeSelector;
