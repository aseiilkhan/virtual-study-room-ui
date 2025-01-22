import axios from 'axios';
import { access } from 'fs';
import { useEffect, useRef, useState } from 'react';
import { WebPlaybackSDK } from 'react-spotify-web-playback-sdk';
import Cookies from 'js-cookie';
import SpotifyWebPlayer, { SpotifyPlayer as Spotify} from 'react-spotify-web-playback';
import { useStudyRoomStore } from './StudyRoom';
import './SpotifyPlayer.css';
import { clear } from 'console';
function SpotifyPlayer(){
    const api = axios.create({baseURL: 'http://localhost:8080/api/spotify'})
    const {player, setPlayer, previousTrack, nextTrack, togglePlayPause} = useStudyRoomStore();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSongLiked, setSongLiked] = useState(false);
    const [position, setPosition] = useState(0);
    const [deviceID, setDeviceID] = useState('');
    const [isPlayingOnThisPlayer, setIsPlayingOnThisPlayer] = useState(false);
    const spotifyState = useRef({
        device: {
            name: '',
        },
        item: {
            album: {
                images: [{ url: '' }],
            },
            name: '',
            artists: [{ name: '' }],
        }
    });
    const trackInfo = useRef({
        name: '',
        album: '',
        artists: '',
        albumCover: '',
        duration: 0,
        position: 0,
        trackId: '',
        shuffle: false,
        repeatMode: 0,
        isPlaying: false,
    });
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const {accessToken, setAccessToken} = useStudyRoomStore();
    const [accessTokenExpires, setAccessTokenExpires] = useState(0);
    const [seekingPosition, setSeekingPosition] = useState<number | null>(null);
    const intervalRef = useRef<NodeJS.Timer | null>(null);
    const [volume, setVolume] = useState(50);
    const handleLoginClick = async () => {
        try {
            const response = await api.get('/auth/login', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('login_access_token')}`,
                }
            });
            const authUrl = response.data.auth_url;
            window.open(authUrl, '_blank', 'noopener, noreferrer');
        } catch (error) {
            // Handle errors
        }
    };
    
    useEffect(() => {
        console.log(isLoggedIn)
        console.log(parseInt(localStorage.getItem('spotifyTokenExpires') as string) < Date.now() )
        const fetchSpotifyToken = async () => {
            console.log('fetching token')
            try {
                const response = (await api.get('/auth/token', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('login_access_token')}`,
                    }
                }));
                if (response.status === 200 && response.data.access_token) {
                    const token = response.data.access_token;
                    console.log(response.data)
                    setAccessToken(token);
                    setAccessTokenExpires(response.data.sptotify_token_expires_at);
                    localStorage.setItem('spotifyAccessToken', token);
                    localStorage.setItem('spotifyTokenExpires', response.data.sptotify_token_expires_at);
                    setIsLoggedIn(true);
                    localStorage.setItem('spotifyRefreshToken', response.data.refresh_token);
                } else {
                    setIsLoggedIn(false);
                }
            } catch (error) {
                console.error('Error fetching Spotify token:', error);
                setIsLoggedIn(false);
            }
        };
        const refreshToken = async () => {
            try {
                const response = await api.get('/auth/refresh', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('login_access_token')}`,
                    }
                });
                if (response.status === 200 && response.data.access_token) {
                    const token = response.data.access_token;
                    setAccessToken(token);
                    setAccessTokenExpires(response.data.sptotify_token_expires_at);
                    localStorage.setItem('spotifyAccessToken', token);
                    localStorage.setItem('spotifyTokenExpires', response.data.sptotify_token_expires_at);
                    setIsLoggedIn(true);
                    if(response.data.refresh_token){
                        localStorage.setItem('spotifyRefreshToken', response.data.refresh_token);
                    }
                } else {
                    setIsLoggedIn(false);
                }
            } catch (error) {
                console.error('Error refreshing Spotify token:', error);
                setIsLoggedIn(false);
            }
        }
        // Only fetch token if not already logged in
        if (!localStorage.getItem('spotifyAccessToken') 
            || !localStorage.getItem('spotifyTokenExpires') 
            || localStorage.getItem('spotifyTokenExpires') === 'NaN' 
            || localStorage.getItem('spotifyTokenExpires') === 'undefined' 
            || localStorage.getItem('spotifyTokenExpires') === 'null' 
            || localStorage.getItem('spotifyTokenExpires') === ''
        ) 
        {
            fetchSpotifyToken();
        } else {
            if(Number(localStorage.getItem('spotifyTokenExpires')) < Date.now()){
                console.log("REFRESHING TOKEN")
               refreshToken();
            }
            setAccessToken(localStorage.getItem('spotifyAccessToken') as string);
            setIsLoggedIn(true);
        }
    }, []);


    useEffect(() => {
        if (isPlaying && trackInfo.current.position < trackInfo.current.duration) {
            let id: NodeJS.Timeout | null = null;
            id = setInterval(() => {
                // Update ref directly for trackInfo position
                trackInfo.current.position += 1000;

                // Update state to re-render the component
                setPosition(trackInfo.current.position);
            }, 1000);

            return () => {
                clearInterval(id as NodeJS.Timeout);
            };
        }
    }, [isPlaying, trackInfo.current.position, trackInfo.current.duration]);
    useEffect(() => {
        if (player) {
            const handleReady = ({ device_id } : { device_id: string }) => {
                console.log('Ready with Device ID', device_id);
                setDeviceID(device_id);
            };
            
            // Attach 'ready' listener
            player.addListener('ready', handleReady);
            
            // Cleanup to remove listener before re-attaching
            return () => {
                player.removeListener('ready', handleReady);
            };
        }
    }, [player]);
    
    useEffect(() => {
        if (player && accessToken) {
            const handleStateChange = async (state : any) => {
                let webAPIState = await getState();
                if(!webAPIState){
                    return;
                };
                console.log('api state: ')
                console.log(webAPIState)
                if(webAPIState.device.id !== deviceID){
                    console.log('Device ID has changed')
                    setIsPlayingOnThisPlayer(false);
                    spotifyState.current = webAPIState;
                    return;
                }
                if (state) {
                    setIsPlaying(!state.paused);
                    const trackId = state.track_window.current_track.id;
                    const previousTrackId = trackInfo.current.trackId;
                    // Only check if the song is liked if the track ID changes
                    if (trackId && trackId !== trackInfo.current.trackId) {
                        trackInfo.current = {
                            name: state.track_window.current_track.name,
                            album: state.track_window.current_track.album.name,
                            artists: state.track_window.current_track.artists.map((artist:any) => artist.name).join(', '),
                            albumCover: state.track_window.current_track.album.images[0].url,
                            duration: state.duration,
                            position: state.position,
                            trackId: trackId,
                            shuffle: state.shuffle,
                            repeatMode: state.repeat_mode,
                            isPlaying: !state.paused,
                        };
                        const isTrackLiked = await checkIfTrackIsLiked(trackId, accessToken);
                        setSongLiked(isTrackLiked);
                        setIsPlayingOnThisPlayer(true);
                    } 
                    else{
                        trackInfo.current = {
                            ...trackInfo.current,
                            position: state.position,
                        }
                        setPosition(state.position);
                    }
                        
                }
            };
            
            // Attach 'player_state_changed' listener
            player.addListener('player_state_changed', handleStateChange);
            
            // Cleanup to remove listener before re-attaching
            return () => {
                player.removeListener('player_state_changed', handleStateChange);
            };
        }
    }, [player, accessToken]);
    useEffect(() => {
        if (player) {
            const handleNotReady = ({ device_id } : { device_id: string }) => {
                console.log('Device ID has gone offline', device_id);
            };
            
            // Attach 'not_ready' listener
            player.addListener('not_ready', handleNotReady);
            
            // Cleanup to remove listener before re-attaching
            return () => {
                player.removeListener('not_ready', handleNotReady);
            };
        }
    }, [player]);
    // useEffect(() => {
    //     player?.addListener('ready', ({ device_id }) => {
    //         console.log('Ready with Device ID', device_id);
    //     });
    //     player?.addListener('player_state_changed', async (state: any) => {
    //         if (state) {
    //             setIsPlaying(!state.paused);
    //             const trackId = state.track_window.current_track.id;
    //             if (accessToken && trackId && trackInfo.trackId !== trackId) {
    //                 const isTrackLiked = await checkIfTrackIsLiked(trackId, accessToken);
    //                 setSongLiked(isTrackLiked);
    //             }
    //             setTrackInfo({
    //                 name: state.track_window.current_track.name,
    //                 album: state.track_window.current_track.album.name,
    //                 artists: state.track_window.current_track.artists.map((artist:any) => artist.name).join(', '),
    //                 albumCover: state.track_window.current_track.album.images[0].url,
    //                 duration: state.duration,
    //                 position: state.position,
    //                 trackId: trackId,
    //             });
    //         }
    //     });
    //     player?.addListener('not_ready', ({ device_id }) => {
    //         console.log('Device ID has gone offline', device_id);
    //     });

    //     return () => {
    //         player?.removeListener('ready');
    //         player?.removeListener('player_state_changed');
    //         player?.removeListener('not_ready');
    //     }
    // }, [player, trackInfo.trackId, accessToken]);

    
    const checkIfTrackIsLiked = async (trackId: string, token: string): Promise<boolean> => {
        try {
            const response = await axios.get(
                `https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("DATA: ", response.data);
            return response.data[0];
             // The API returns an array of booleans, so we check the first item
        } catch (error) {
            console.error('Error checking if track is liked:', error);
            return false;
        }
    };
    useEffect(() => {
    }, [isLoggedIn]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPosition = parseInt(e.target.value, 10);
        setSeekingPosition(newPosition); // Store the current position being dragged
    };

    // When the user stops dragging (onMouseUp or onTouchEnd), seek to the new position
    const handleSeekComplete = () => {
        if (seekingPosition !== null) {
            player?.seek(seekingPosition).then(() => {
                console.log(`Seeked to ${seekingPosition}`);
                trackInfo.current = {
                    ...trackInfo.current,
                    position: seekingPosition,
                }
            });
            setSeekingPosition(null); // Reset temporary seeking position
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseInt(e.target.value, 10);
        setVolume(newVolume);
        player?.setVolume(newVolume / 100).then(() => {
            console.log(`Volume set to ${newVolume}`);
        });
    };

    const handleLikeClick = async () => {
        if (!accessToken || !trackInfo.current.trackId) {
            console.error("Access token or track ID is missing");
            return;
        }

        try {
            await axios.put(
                `https://api.spotify.com/v1/me/tracks?ids=${trackInfo.current.trackId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            setSongLiked(true);
            console.log('Track liked successfully');
        } catch (error) {
            console.error('Error liking the track:', error);
        }
    };

    const handleShuffleToggle = () => {
        if (!accessToken) return; // Ensure we have the access token
    
        const newShuffleState = !trackInfo.current.shuffle;
    
        try {
            axios.put(
                'https://api.spotify.com/v1/me/player/shuffle?state=' + newShuffleState,
                {
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            trackInfo.current = {
                ...trackInfo.current,
                shuffle: newShuffleState,
            }
        } catch (error) {
            console.error('Error changing shuffle mode', error);
        }
    };

    const handleRepeatToggle = () => {
        if (!accessToken) return; // Ensure we have the access token
    
        const newRepeatMode = (trackInfo.current.repeatMode + 1) % 3;
        const newRepeatModeString = ['off', 'context', 'track'][newRepeatMode];
        try {
            axios.put(
                'https://api.spotify.com/v1/me/player/repeat?state=' + newRepeatModeString,
                {
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            trackInfo.current = {
                ...trackInfo.current,
                repeatMode: newRepeatMode,
            };
        } catch (error) {
            console.error('Error changing repeat mode', error);
        }
    }
    
    const getState = async () => {
        if (!accessToken) {
            console.error('Access token is missing');
            return;
        }

        try {
            const response = await axios({
                method: 'GET',
                url: 'https://api.spotify.com/v1/me/player',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (response.status === 200 && response.data) {
                const data = response.data
                if (data && data.item) {
                    const track = data.item;
                    const artists = track.artists.map((artist:any) => artist.name).join(', ');
                    let repeat_mode = data.repeat_state === 'off'? 0: data.repeat_state === 'context'? 1: 2;
                    trackInfo.current = {
                        name: track.name,
                        album: track.album.name,
                        artists: artists,
                        albumCover: track.album.images[0]?.url,
                        position: data.progress_ms,
                        duration: track.duration_ms,
                        shuffle: data.shuffle_state,
                        repeatMode: repeat_mode,
                        trackId: track.id,
                        isPlaying: !data.is_paused,
                    };
                }
                spotifyState.current = response.data
                return response.data;
            } else {
                console.error('No active device found or unable to get playback state.');
            }
        } catch (error) {
            console.error('Error fetching playback state:', error);
        }
    };

    useEffect(() => {
        const fetchAndSetState = async () => { 
            if (accessToken) {
                const webAPIState = await getState();
                spotifyState.current = webAPIState;
                console.log('fetching state')
                console.log(spotifyState.current) // Fetch state on component mount
            }
        }
        fetchAndSetState();
    }, [accessToken]);

    const transferPlayback = async () => {
        console.log('transferring playback')
        console.log(deviceID)
        if(accessToken){
            try{
                const devices = await axios({
                    method: 'GET',
                    url: 'https://api.spotify.com/v1/me/player/devices',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                })
                console.log(devices.data)
                // await axios({
                //     method: 'PUT',
                //     url: 'https://api.spotify.com/v1/me/player/pause',
                //     headers: {
                //         'Authorization': `Bearer ${accessToken}`,
                //         'Content-Type': 'application/json'
                //     }
                // })
                await axios({
                    method: 'PUT',
                    url: 'https://api.spotify.com/v1/me/player',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    data: {
                        "device_ids": [
                            deviceID
                        ],
                        play: false
                    }
                });
                console.log('done')
                setIsPlaying(false);
                setIsPlayingOnThisPlayer(true);
                console.log(player)
                console.log(isLoggedIn)
                console.log(isPlayingOnThisPlayer)
            } catch (error) {
                console.error('Error transferring playback', error);
            }
        }
    }

    // const togglePlayPause = async () => {
    //     if(isPlaying){
    //         try{
    //             await axios({
    //                 method: 'PUT',
    //                 url: 'https://api.spotify.com/v1/me/player/pause',
    //                 headers: {
    //                     'Authorization': `Bearer ${accessToken}`,
    //                     'Content-Type': 'application/json'
    //                 },
    //             })
    //         }
    //         catch(error){
    //             console.error('Error pausing playback')
    //         }
    //     }
    //     else{
    //         try{
    //             await axios({
    //                 method: 'PUT',
    //                 url: 'https://api.spotify.com/v1/me/player/play',
    //                 headers: {
    //                     'Authorization': `Bearer ${accessToken}`,
    //                     'Content-Type': 'application/json'
    //                 }
    //             })
    //         }
    //         catch(error){
    //             console.error('Error starting playback')
    //         }
    //     }
    // }



    return (
        <div className = 'spotify-player'>
            {(!player || !isLoggedIn) && (<button onClick={handleLoginClick}>Login to Spotify</button>)}
            {
                (player && isLoggedIn && isPlayingOnThisPlayer) && (
                    <div className='playback'>
                        <div className='album-info'>
                            {trackInfo.current.albumCover && (
                                <>
                                    <div className='album-cover'>
                                        <img src={trackInfo.current.albumCover} alt="Album Cover"/>
                                    </div>
                                    <div className='track-info'>
                                        <h3>{trackInfo.current.name}</h3>
                                        <p>{trackInfo.current.artists}</p>
                                    </div>
                                    <div>
                                        {!isSongLiked && (<img onClick = {handleLikeClick} src={`assets/spotify-icons/like.png`} alt="like button"/>)}
                                        {isSongLiked && (<span aria-hidden="true" className="songliked"><svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" className="Svg-sc-ytk21e-0 ceOVVX"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm11.748-1.97a.75.75 0 0 0-1.06-1.06l-4.47 4.47-1.405-1.406a.75.75 0 1 0-1.061 1.06l2.466 2.467 5.53-5.53z"></path></svg></span>)}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className='player'>
                            <div className='player-controls'>
                                {!trackInfo.current.shuffle ? 
                                (<span aria-hidden="true" className="shuffle-deactivated shuffle-button" onClick={handleShuffleToggle}><svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" className="Svg-sc-ytk21e-0 dYnaPI"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"></path><path d="m7.5 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.109 13H11.16a3.75 3.75 0 0 1-2.873-1.34l-.787-.938z"></path></svg></span>) : 
                                (<span aria-hidden="true" className="shuffle-activated shuffle-button" onClick={handleShuffleToggle}><svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" className="Svg-sc-ytk21e-0 dYnaPI"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"></path><path d="m7.5 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.109 13H11.16a3.75 3.75 0 0 1-2.873-1.34l-.787-.938z"></path></svg></span>)
                                }
                                <img src={`/assets/spotify-icons/previous.png`} onClick = {previousTrack} className="player-control-icon" alt="player-control-icon2"/>
                                {!isPlaying ?
                                    (<img src={`/assets/spotify-icons/play.png`} onClick={togglePlayPause} className="player-control-icon pause" alt="player-control-icon3"/>)
                                            :
                                    (<span  onClick={togglePlayPause} aria-hidden="true" className="play"><svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" className="Svg-sc-ytk21e-0 dYnaPI"><path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"></path></svg></span>)}
                                <img src={`/assets/spotify-icons/next.png`} onClick = {nextTrack} className="player-control-icon" alt="player-control-icon4"/>
                                {trackInfo.current.repeatMode === 0 && (<span aria-hidden="true" className="repeat-off repeat-button" onClick={handleRepeatToggle}><svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" className="Svg-sc-ytk21e-0 dYnaPI"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path></svg></span>)}
                                {trackInfo.current.repeatMode === 1 && (<span aria-hidden="true" className="repeat-context repeat-button" onClick={handleRepeatToggle}><svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" className="Svg-sc-ytk21e-0 dYnaPI"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path></svg></span>)}
                                {trackInfo.current.repeatMode === 2 && (<span aria-hidden="true" className="repeat-track repeat-button" onClick={handleRepeatToggle}><svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" className="Svg-sc-ytk21e-0 dYnaPI"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h.75v1.5h-.75A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5ZM12.25 2.5a2.25 2.25 0 0 1 2.25 2.25v5A2.25 2.25 0 0 1 12.25 12H9.81l1.018-1.018a.75.75 0 0 0-1.06-1.06L6.939 12.75l2.829 2.828a.75.75 0 1 0 1.06-1.06L9.811 13.5h2.439A3.75 3.75 0 0 0 16 9.75v-5A3.75 3.75 0 0 0 12.25 1h-.75v1.5h.75Z"></path><path d="m8 1.85.77.694H6.095V1.488c.697-.051 1.2-.18 1.507-.385.316-.205.51-.51.583-.913h1.32V8H8V1.85Z"></path><path d="M8.77 2.544 8 1.85v.693h.77Z"></path></svg></span>)}
                            </div>
                            <div className="playback-time">
                                <span className="current-time">{position/1000/60|0}:{position/1000%60<10? '0'+(position/1000%60|0): position/1000%60|0}</span>
                                <input type="range" min="0" max={trackInfo.current.duration} aria-label="range" className="progress-bar" step="1000" value={seekingPosition ?? trackInfo.current.position} onChange={handleInputChange} onMouseUp={handleSeekComplete} onTouchEnd={handleSeekComplete}/>
                                <span className="total-time">{trackInfo.current.duration/1000/60|0}:{trackInfo.current.duration/1000%60<10?'0'+(trackInfo.current.duration/1000%60|0) : trackInfo.current.duration/1000%60|0}</span>
                            </div>
                        </div>
                        <div className="sound">
                            {volume < 33 && (<svg data-encore-id="icon" role="presentation" aria-label="Низкая громкость" aria-hidden="true" id="volume-icon" viewBox="0 0 16 16" className="volume-icon"><path d="M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.139 2.139 0 0 0 0 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 0 1 0 4.88z"></path></svg>)}
                            {volume >= 33 && volume < 67 && (<svg data-encore-id="icon" role="presentation" aria-label="Средняя громкость" aria-hidden="true" id="volume-icon" viewBox="0 0 16 16" className="volume-icon"><path d="M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.139 2.139 0 0 0 0 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 6.087a4.502 4.502 0 0 0 0-8.474v1.65a2.999 2.999 0 0 1 0 5.175v1.649z"></path></svg>)}
                            {volume >= 67 && (<svg data-encore-id="icon" role="presentation" aria-label="Высокая громкость" aria-hidden="true" id="volume-icon" viewBox="0 0 16 16" className="volume-icon"><path d="M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.139 2.139 0 0 0 0 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 0 1 0 4.88z"></path><path d="M11.5 13.614a5.752 5.752 0 0 0 0-11.228v1.55a4.252 4.252 0 0 1 0 8.127v1.55z"></path></svg>)}
                            <input type="range" min="0" max="100" aria-label="range" className="sound-bar" step="1" onChange={handleVolumeChange}/>
                        </div>

                    </div> 
                )
            }
            {
                !isPlayingOnThisPlayer && (
                    <div className='playback'>
                        <div className='album-info'>
                            {spotifyState.current?.item && (
                                <>
                                    <div className='album-cover'>
                                        <img src={spotifyState.current?.item.album.images[0].url} alt="Album Cover"/>
                                    </div>
                                    <div className='track-info'>
                                        <h3>{spotifyState.current?.item.name}</h3>
                                        <p>{spotifyState.current?.item.artists.map((artist: any) => artist.name).join(', ')}</p>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className='note'>
                            <div>Currently playing on other device {spotifyState.current?.device.name}</div>
                            
                        </div>
                        <div className='play-here-button'>
                            <button onClick = {transferPlayback}>Play on this page</button>
                        </div>

                    </div> 
                )
            }
            
        </div>
    )
}

export default SpotifyPlayer;