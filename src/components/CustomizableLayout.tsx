import React, { ReactNode, useEffect, useState } from 'react';
import { Rnd } from "react-rnd"; // Install this package if you would like to drag and drop elements
import  Timer  from './Timer';
import { Calendar } from './Calendar';
import Notes from './Notes';
import { Whiteboard } from './Whiteboard';
import SpotifyPlayer  from './SpotifyPlayer';
import { YoutubePlayer } from './YoutubePlayer';
import { useStudyRoomStore } from './StudyRoom';
import Menu from './Menu';
import { useStore } from 'zustand';


interface CustomizableLayoutProps {
  layout: string[];
  onLayoutChange: (newLayout: string[]) => void;
  menuState: string;
  children?: ReactNode; // Add optional children prop
}

export function CustomizableLayout({ layout, onLayoutChange, menuState, children }: CustomizableLayoutProps) {
  const [timerPosition, setTimerPosition] = useState({ x: 10, y: 0 });
  const [notesPosition, setNotesPosition] = useState({ x: 10, y: 240 });

  return (
    <div className="customizable-layout">
      {layout.map((appId, index) => (
        <Rnd
            enableResizing = {useStudyRoomStore.getState().resizable}
            disableDragging = {useStudyRoomStore.getState().nondraggable}
            key={appId}
            position={appId === 'timer' ? timerPosition : notesPosition}
            onDragStop={(e, d) => {appId === 'timer' ? setTimerPosition({ x: d.x, y: d.y }) : setNotesPosition({ x: d.x, y: d.y });}}
        >
            {/* Render the app component based on the appId */}
            {appId === 'timer' && <Timer/>}
            {appId === 'notes' && <Notes />}
            {/* ... other app components */}
        </Rnd>
      ))}
    </div>
  );
}
