import React, { useEffect, useState } from 'react';
import './Menu.css'
import { useStudyRoomStore } from './StudyRoom';
import BackgroundSelector from './BackgroundSelector';
import { Sounds } from './Sounds';
import { Rnd } from 'react-rnd';
import {SpotifySelector} from './SpotifySelector';

export enum MenuState {
  BACKGROUND_SELECTOR = 'backgroundSelector',
  SPOTIFY_SELECTOR = 'spotifySelector',
  SOUNDS = 'sounds',
  OFF = 'off'
}

export function Menu() {
    const {menuState, setMenuState} = useStudyRoomStore();
  return (
    <div id="background">
        <div className='menu-module'>
            <BackgroundSelector />
            {menuState === MenuState.SOUNDS && <Sounds />}
            {menuState === MenuState.OFF && <div></div>}
            {menuState === MenuState.SPOTIFY_SELECTOR && <SpotifySelector />}
        </div>
    </div>
  );
}

export default Menu;
