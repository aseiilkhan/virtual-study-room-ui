import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { create, useStore } from 'zustand';
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
import { Sounds } from './Sounds';
import { Rnd } from 'react-rnd';
import Menu from './Menu';
import AuthPage from './AuthPage';


declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

// Zustand Store (You'll need to define this separately)
interface StudyRoomState {
  theme: string;
  layout: string[]; 
  backgroundImage: string;
  setTheme: (theme: string) => void;
  setLayout: (layout: string[]) => void;
  setBackgroundImage: (backgroundImage: string) => void;
  nondraggable: boolean;
  resizable: boolean;
  player: Spotify.Player | null;
  setPlayer: (player: Spotify.Player) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setTogglePlayPause: (togglePlayPause: any) => void;
  setNextTrack: (nextTrack: any) => void;
  setPreviousTrack: (previousTrack: any) => void;
  menuState: string;
  setMenuState: (menuState: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  accessToken: string;
  setAccessToken: (accessToken: string) => void;
}

export const useStudyRoomStore = create<StudyRoomState>((set) => ({
  theme: 'light',
  layout: ['spotify', 'youtube', 'timer', 'notes', 'menu'], // Initialize with your default layout
  backgroundImage: '',
  setTheme: (theme) => set((state) => {state.theme = theme; console.log(state); return state;}),
  setLayout: (layout) => set({ layout }),
  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
  nondraggable: true,
  resizable: false,
  player: null,
  setPlayer: (player) => set({ player }),
  togglePlayPause: () => {console.log('togglePlayPause')},
  nextTrack: () => {},
  previousTrack: () => {},
  setTogglePlayPause: (togglePlayPause: any) => set({ togglePlayPause }),
  setNextTrack: (nextTrack: any) => set({ nextTrack }),
  setPreviousTrack: (previousTrack: any) => set({ previousTrack }),
  menuState: 'off',
  setMenuState: (menuState) => set({ menuState }),
  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
  accessToken: '',
  setAccessToken: (accessToken) => set({ accessToken }),
}));

export function StudyRoom() {
  const { theme, layout, backgroundImage, setTheme, setLayout, setBackgroundImage, nondraggable, resizable, player, setPlayer,
    togglePlayPause, nextTrack, previousTrack, setTogglePlayPause, setNextTrack, setPreviousTrack, menuState, setMenuState
   } = useStudyRoomStore();
    // useEffect(() => {
    //     // Fetch initial preferences from the backend here
    //     axios.get('/api/preferences?userId=1') // Replace 1 with the actual user ID
    //     .then(response => {
    //         setTheme(response.data.theme);
    //         setLayout(response.data.layout ? JSON.parse(response.data.layout) : []); // Parse layout from JSON if available
    //         setBackgroundImage(localStorage.getItem('backgroundImage') || ''); // Load background from local storage
    //     })
    //     .catch(error => {
    //         console.error('Error fetching preferences:', error);
    //     });
    //  }, []); // Run this effect only once on component mount
  // Load sounds from the server
  const [backgroundLink, setBackgroundLink] = useState('');
  
  const toggleNotesLayout = () => {
    if (layout.includes('notes')) {
      setLayout(layout.filter(appId => appId !== 'notes'));
    } else {
      setLayout([...layout, 'notes']);
    }
  }

  const toggleTimerLayout = () => {
    if (layout.includes('timer')) {
      setLayout(layout.filter(appId => appId !== 'timer'));
    } else {
      setLayout([...layout, 'timer']);
    }
  }

  const toggleBackgroundSelectorMenu = () => {
    setMenuState('backgroundSelector');
  }

  const toggleSoundsMenu = () => {
    setMenuState('sounds');
  }

  const toggleEditLayout = () => {
    useStudyRoomStore.setState({nondraggable: !nondraggable});
    useStudyRoomStore.setState({resizable: !resizable});
  }

  const toggleSpotifySelectorMenu = () => {
    setMenuState('spotifySelector');
  }
  
  useEffect(() => {
    // Check if the Spotify SDK script is already loaded
    const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
  
    if (!existingScript) {
      // If the script is not present, create and append it
      const script = document.createElement('script');
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      script.onload = () => {
        window.onSpotifyWebPlaybackSDKReady = () => {
          const token = localStorage.getItem('spotifyAccessToken');
          if (token) {
            const player = new Spotify.Player({
              name: 'Web Playback SDK Player',
              getOAuthToken: cb => { cb(token); },
              volume: 0.5
            });
            setPlayer(player);
  
            player.connect().then(success => {
              if (success) {
                console.log('Connected to Spotify Player');
              } else {
                console.error('Failed to connect to Spotify Player');
              }
            });
          } else {
            console.error('Spotify access token is missing');
          }
        };
      };
      document.body.appendChild(script);
    } else {
      console.log('Spotify SDK script already loaded');
      // If the script is already present, just initialize the player
      window.onSpotifyWebPlaybackSDKReady = () => {
        const token = localStorage.getItem('spotifyAccessToken');
        if (token) {
          const player = new Spotify.Player({
            name: 'Web Playback SDK Player',
            getOAuthToken: cb => { cb(token); },
            volume: 0.5
          });
          setPlayer(player);
          // setPlayer(new Spotify.Player({
          //   name: 'Web Playback SDK Player',
          //   getOAuthToken: cb => { cb(token); },
          //   volume: 0.5
          // }));
          player.connect().then(success => {
            if (success) {
              console.log('Connected to Spotify Player');
            } else {
              console.error('Failed to connect to Spotify Player');
            }
          });
        } else {
          console.error('Spotify access token is missing');
        }
      };
    }
  }, []);

  useEffect(() => {
    if (player) {
      const togglePlayPause = () => {
        if (player) {
          player.togglePlay().then(() => {
            console.log('Toggled play/pause');
          }).catch((error: any) => {
            console.error('Failed to toggle play/pause:', error);
          });
        } else {
          console.error('Player is not initialized yet');
        }
      };
  
      const nextTrack = () => {
        if (player) {
          player.nextTrack().then(() => {
            console.log('Skipped to next track');
          }).catch((error: any) => {
            console.error('Failed to skip to next track:', error);
          });
        } else {
          console.error('Player is not initialized yet');
        }
      };
  
      const previousTrack = () => {
        if (player) {
          player.previousTrack().then(() => {
            console.log('Skipped to previous track');
          }).catch((error: any) => {
            console.error('Failed to skip to previous track:', error);
          });
        } else {
          console.error('Player is not initialized yet');
        }
      };
      // const togglePlayPause = () => {
      //   if (player) {
      //     player.togglePlay().then(() => {
      //       console.log('Toggled play/pause');
      //     }).catch((error: any) => {
      //       console.error('Failed to toggle play/pause:', error);
      //     });
      //   }
      // };

      // Set the updated togglePlayPause function in the Zustand store
      setTogglePlayPause(togglePlayPause);
      setNextTrack(nextTrack);
      setPreviousTrack(previousTrack);
    }
  }, [player, setTogglePlayPause, setNextTrack, setPreviousTrack]);
  
  // useEffect(() => {
  //   // Load YouTube API script
  //   const tag = document.createElement('script');
  //   tag.src = "https://www.youtube.com/iframe_api";
  //   const firstScriptTag = document.getElementsByTagName('script')[0];
  //   (firstScriptTag.parentNode as ParentNode).insertBefore(tag, firstScriptTag);

  //   // Initialize YouTube player after API is loaded
  //   window.onYouTubeIframeAPIReady = function () {
  //     new window.YT.Player('player', {
  //       videoId: 'M66U_DuMCS8', // Replace with your YouTube video ID
  //       playerVars: {
  //         autoplay: 1,
  //         controls: 0,          // Hides all player controls
  //         modestbranding: 1,    // Minimizes YouTube branding
  //         loop: 1,              // Loops the video
  //         playlist: 'M66U_DuMCS8', // Required for looping
  //         rel: 0,               // Disables related videos
  //         fs: 0,                // Disables the fullscreen button
  //         iv_load_policy: 3,    // Hides video annotations
  //         cc_load_policy: 0,    // Hides closed captions
  //         disablekb: 1,         // Disables keyboard controls
  //         mute: 1,              // Mutes the video on autoplay
  //         playsinline: 1        // Plays the video inline on mobile
  //       },
  //       events: {
  //         onReady: (event:any) => {
  //           event.target.mute();
  //           event.target.playVideo();
  //         }
  //       }
  //     });
  //   };
  // }, []);
  return (
    <div className={`study-room ${theme}`} style={{ backgroundImage: `url(${backgroundImage})` }}>
      {/* <BackgroundSelector /> */}

      {/* <div className="video-background" id="player"></div> */}
      <div className="toolbar">
        <div className = "tools">
          <button onClick = {toggleTimerLayout} >Timer</button>
          <button onClick = {toggleNotesLayout} >Notes</button>
        </div>
          <div className = "menu-control-buttons">
            <button onClick = {toggleBackgroundSelectorMenu}>BG</button>
            <button onClick = {toggleSoundsMenu}>Sounds</button>
            <button onClick = {toggleEditLayout}>Edit</button>
            <button onClick = {toggleSpotifySelectorMenu}>Spotify</button>
        </div>
      </div>
      <div className = 'content'>
        {/* <p>Study Room</p>
        <Sounds /> 
        <ThemeSelector />
        <BackgroundSelector /> */}

        <CustomizableLayout
          layout={layout}
          onLayoutChange={setLayout}
          menuState = {menuState}
        >
        </CustomizableLayout>
        <div className = "menu-wrap">
          <Menu />
        </div>
        <SpotifyPlayer />
      </div>
    </div>
  );
}

export default StudyRoom;
