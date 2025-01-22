import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStudyRoomStore } from './StudyRoom';
import './SpotifySelector.css'
export function SpotifySelector() {
  const [playlists, setPlaylists] = useState([]);
  const {accessToken, setAccessToken} = useStudyRoomStore();
  const [spotifyLink, setSpotifyLink] = useState('');
  
  const extractSpotifyURI = (link: string) => {
    const regex = /https:\/\/open\.spotify\.com\/(track|playlist|album|artist)\/([\w\d]+)/;
    const match = link.match(regex);
    if (match) {
        const type = match[1];
        const id = match[2];
        return `spotify:${type}:${id}`;  // URI in format spotify:{type}:{id}
    }
    return null;
  };

const playSpotifyLink = async () => {
    const uri = extractSpotifyURI(spotifyLink);
    let data
    if (uri && accessToken) {
        if(uri.includes('track')){
            data = {
                uris: [uri]
            }
        }
        else if(uri.includes('playlist')){
            data = {
                context_uri: uri
            }
        }
        try {
            // Make the request to start playback
            await axios({
                method: 'PUT',
                url: 'https://api.spotify.com/v1/me/player/play',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                data: data
            });

            console.log(`Playing ${uri} on Spotify`);
        } catch (error) {
            console.error('Error starting playback:', error);
        }
    } else {
        console.error('Invalid Spotify link or missing access token.');
    }
};

  useEffect(() => {
    // Fetch user's playlists when the component mounts
    if (accessToken) {
      fetchPlaylists();
    }
  }, [accessToken]);

  const fetchPlaylists = async () => {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      setPlaylists(response.data.items); // Set playlists to state
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const playPlaylist = async (playlistId: any) => {
    try {
      await axios.put(
        'https://api.spotify.com/v1/me/player/play',
        {
          context_uri: `spotify:playlist:${playlistId}`
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
    } catch (error) {
      console.error('Error playing playlist:', error);
    }
  };

  return (
    <div className='spotify-selector'>
      <div className='menu-module'>
        <h2>Your Spotify Playlists</h2>
        {playlists.length > 0 ? (
            <>
            <ul className='playlist-list'>
                {playlists.map((playlist: any) => (
                <li key={playlist.id} className="playlist-item">
                    <div className='playlist-box'>
                    <img src={playlist.images[0]?.url} alt={playlist.name} className="playlist-image" />
                    <p>{playlist.name}</p>
                    <div className="playlist-info">
                    <button onClick={() => playPlaylist(playlist.id)}>Play</button>
                    </div>
                    </div>
                </li>
                ))}
            </ul>
                <input
                type="text"
                placeholder="Paste your Spotify link here"
                value={spotifyLink}
                onChange={(e) => setSpotifyLink(e.target.value)}
                className="spotify-input"
            />

            <button onClick={playSpotifyLink} className="play-button">
                Play on Spotify
            </button>

            </>
        ) : (
          <p>No playlists available</p>
        )}
      </div>
    </div>
  );
}
