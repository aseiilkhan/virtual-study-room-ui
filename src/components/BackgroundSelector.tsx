import React, { useEffect, useState } from 'react';
import './BackgroundSelector.css';
import { MenuState } from './Menu';
import { useStudyRoomStore } from './StudyRoom';

enum Backgrounds {
  CANDLES = 'candles',
  BATHTUB = 'bathtub',
  STUDYINGGIRL = 'studyinggirl',
  WINTERHOUSE = 'winterhouse',
  YOUTUBE = 'youtube',
}

export function BackgroundSelector() {
  const [background, setBackground] = useState<string>(Backgrounds.CANDLES);
  const [backgroundLink, setBackgroundLink] = useState<string | undefined>('');
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
  const { menuState, setMenuState } = useStudyRoomStore();
  const [youtubeLink, setYoutubeLink] = useState<string>('');

  const handleBackgroundChange = (newBackground: Backgrounds, link?: string) => {
    if (youtubePlayer) {
      // Destroy YouTube player if it exists
      youtubePlayer.destroy();
      setYoutubePlayer(null);
    }

    // Update background and video link
    setBackground(newBackground);
    setBackgroundLink(link);
  };

  useEffect(() => {
    if (background === Backgrounds.YOUTUBE) {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          createYouTubePlayer();
        };
      } else {
        createYouTubePlayer();
      }
    }

    // Cleanup to destroy YouTube player when component unmounts or background changes
    return () => {
      if (youtubePlayer) {
        youtubePlayer.destroy();
      }
    };
  }, [backgroundLink]); // Effect now depends on the background link

  const createYouTubePlayer = () => {
    if (!youtubePlayer && backgroundLink) {
      const player = new window.YT.Player('player', {
        videoId: backgroundLink, // The YouTube video ID
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          loop: 1,
          playlist: backgroundLink,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
          disablekb: 1,
          mute: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.mute();
            event.target.playVideo();
          },
        },
      });
      setYoutubePlayer(player);
    }
  };

  const extractYouTubeID = (url: string) => {
    let videoID = '';

    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

    const match = url.match(regex);

    if (match && match[1].length === 11) {
      videoID = match[1];
    }

    return videoID;
  };

  return (
    <div id="background">
      {background === Backgrounds.YOUTUBE ? (
        <div className="video-container">
          <div className="video-background" id="player" key={backgroundLink}></div>
        </div>
      ) : (
        <div className="video-container">
          <video
            key={background}
            autoPlay
            muted
            loop
            className="background-video"
          >
            <source
              src={`/assets/backgrounds/${background}.mp4`}
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      {menuState === MenuState.BACKGROUND_SELECTOR && (
        <>
          <div className="background-selector">
            <button className="background-option" onClick={() => handleBackgroundChange(Backgrounds.CANDLES)}>Candles</button>
            <button className="background-option" onClick={() => handleBackgroundChange(Backgrounds.BATHTUB)}>Bathtub</button>
            <button className="background-option" onClick={() => handleBackgroundChange(Backgrounds.STUDYINGGIRL)}>Studying Girl</button>
            <button className="background-option" onClick={() => handleBackgroundChange(Backgrounds.WINTERHOUSE)}>Winter House</button>

            
          </div>
          <div><input
              type="text"
              placeholder="Paste your YouTube link here"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              className="spotify-input"
            />
            <button onClick={() => handleBackgroundChange(Backgrounds.YOUTUBE, extractYouTubeID(youtubeLink))} className="play-button">
              Play on YouTube
            </button> </div>
        </>
      )}
    </div>
  );
}

export default BackgroundSelector;
