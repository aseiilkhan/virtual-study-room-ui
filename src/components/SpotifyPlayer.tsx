import axios from 'axios';
import { access } from 'fs';
import { useEffect } from 'react';
import { WebPlaybackSDK } from 'react-spotify-web-playback-sdk';
import SpotifyWebPlayer, { SpotifyPlayer as Spotify} from 'react-spotify-web-playback';
function SpotifyPlayer(){
    const api = axios.create({baseURL: 'http://localhost:8080/api/spotify'})
    var accessToken = '';
    const handleLoginClick = async () => {
        try {
            const response = await api.get('/auth/login');
            const authUrl = response.data.auth_url;
            window.location.href = authUrl;
          } catch (error) {
            // Handle errors
          }
    };
    useEffect(() => {
        const fetchSpotifyToken = async () => {
          try {
            const response = await axios.get('/auth/token');
            accessToken = response.data.access_token;
            localStorage.setItem('spotifyAccessToken', accessToken); // Store in localStorage

            // Initialize your Spotify player here using the accessToken
          } catch (error) {
            console.error('Error fetching Spotify token:', error);
            // Handle the error (e.g., show a message to the user)
          }
        await fetchSpotifyToken();
        }
    });
    const getOAuthToken = () => {return accessToken};
    return (
            <div>
                <button onClick={handleLoginClick}>Login to Spotify</button>
            <SpotifyWebPlayer
                token = {localStorage.getItem('spotifyAccessToken') as string}
                uris={['spotify:artist:6HQYnRM4OzToCYPpVBInuU']}
            ></SpotifyWebPlayer>
            </div>
    )
}

export default SpotifyPlayer;