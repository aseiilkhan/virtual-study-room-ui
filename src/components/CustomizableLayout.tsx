import React, { ReactNode } from 'react';
import { Rnd } from "react-rnd"; // Install this package if you would like to drag and drop elements
import  Timer  from './Timer';
import { Calendar } from './Calendar';
import Notes from './Notes';
import { Whiteboard } from './Whiteboard';
import SpotifyPlayer  from './SpotifyPlayer';
import { YoutubePlayer } from './YoutubePlayer';

interface CustomizableLayoutProps {
  layout: string[];
  onLayoutChange: (newLayout: string[]) => void;
  children?: ReactNode; // Add optional children prop
}

export function CustomizableLayout({ layout, onLayoutChange, children }: CustomizableLayoutProps) {
  layout = ['timer', 'notes']; // Default layout if no layout is provided
  return (
    <div className="customizable-layout">
      <h5>Customizable Layout</h5>
      {layout.map((appId, index) => (
        <Rnd
            default={{
                x: 0,
                y: 0,
                width: 320,
                height: 200
            }}
            key={appId}
        >
            {/* Render the app component based on the appId */}
            {appId === 'timer' && <Timer />}
            {appId === 'notes' && <Notes />}
            {appId === 'spotify' && <SpotifyPlayer />}
            {appId === 'youtube' && <YoutubePlayer />}

            {/* ... other app components */}
        </Rnd>
      ))}
    </div>
  );
}
