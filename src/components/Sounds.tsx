import { useEffect, useRef, useState } from "react";
import './Sounds.css'

export function Sounds(){
const rainRef = useRef<HTMLAudioElement>(null)
  const fireplaceRef = useRef<HTMLAudioElement>(null)
  const lofiRef = useRef<HTMLAudioElement>(null)
  const natureRef = useRef<HTMLAudioElement>(null)

  const [rainVolume, setRainVolume] = useState(0);
  const [fireplaceVolume, setFireplaceVolume] = useState(0);
  const [lofiVolume, setLofiVolume] = useState(0);
  const [natureVolume, setNatureVolume] = useState(0);
  
  const rainVolumeAdjust = (event:any) => {
    const newVolume = parseFloat(event.target.value);  // Convert the input value to a number
    setRainVolume(newVolume); 
  };

  const fireplaceVolumeAdjust = (event:any) => {
    const newVolume = parseFloat(event.target.value);  // Get the new volume from the slider
    setFireplaceVolume(newVolume);  // Update the volume state
  }

  const lofiVolumeAdjust = (event:any) => {
    const newVolume = parseFloat(event.target.value);// Get the new volume from the slider
    setLofiVolume(newVolume);  // Update the volume state
  }

  const natureVolumeAdjust = (event:any) => {
    console.log(event)
    const newVolume = parseFloat(event.target.value); // Get the new volume from the slider
    setNatureVolume(newVolume);  // Update the volume state
    console.log(natureVolume);
  }

  useEffect(() => {
    if (rainRef.current && rainVolume != rainRef.current.volume) {
      if(rainRef.current.volume == 0 && rainVolume > 0) {
        rainRef.current.play();
      }
      else if(rainRef.current.volume > 0 && rainVolume == 0) {
        rainRef.current.pause();
      }
      rainRef.current.volume = rainVolume;
    }

    if (natureRef.current && natureVolume != natureRef.current.volume) {
      if(natureRef.current.volume == 0 && natureVolume > 0) {
        natureRef.current.play();
      }
      else if(natureRef.current.volume > 0 && natureVolume == 0) {
        natureRef.current.pause();
      }
      natureRef.current.volume = natureVolume;
    }

    if (lofiRef.current && lofiVolume != lofiRef.current.volume) {
      if(lofiRef.current.volume == 0 && lofiVolume > 0) {
        lofiRef.current.play();
      }
      else if(lofiRef.current.volume > 0 && lofiVolume == 0) {
        lofiRef.current.pause();
      }
      lofiRef.current.volume = lofiVolume;
    }

    if (fireplaceRef.current && fireplaceVolume != fireplaceRef.current.volume) {
      if(fireplaceRef.current.volume == 0 && fireplaceVolume > 0) {
        fireplaceRef.current.play();
      }
      else if(fireplaceRef.current.volume > 0 && fireplaceVolume == 0) {
        fireplaceRef.current.pause();
      }
      fireplaceRef.current.volume = fireplaceVolume;
    }
  }
  , [rainVolume, natureVolume, lofiVolume, fireplaceVolume]);
  
  return(
    <div className="soundboard">
    <div className="sound-control">
        <label>Rain</label>
        <input type="range" id="rainVolume" min="0" max="1" step="0.1" value={rainVolume}  onChange={rainVolumeAdjust}/>
        <audio ref={rainRef} src={'/assets/sounds/rain.mp3'} id="rainSound" loop ></audio>
    </div>
    
    <div className="sound-control">
        <label>Fireplace</label>
        <input type="range" id="fireplaceVolume" min="0" max="1" step="0.1" value={fireplaceVolume}  onChange={fireplaceVolumeAdjust}/>
        <audio ref={fireplaceRef} src={'assets/sounds/fireplace.mp3'} id="fireplaceSound" loop></audio>
    </div>

    <div className="sound-control">
        <label>Nature</label>
        <input type="range" id="natureVolume" min="0" max="1" step="0.1" value={natureVolume} onChange={natureVolumeAdjust}/>
        <audio ref={natureRef} src={'/assets/sounds/nature.mp3'} id="natureSound" loop ></audio>
    </div>

    <div className="sound-control">
        <label>lofi</label>
        <input type="range" id="lofiVolume" min="0" max="1" step="0.1" value={lofiVolume} onChange={lofiVolumeAdjust}/>
        <audio ref={lofiRef} src={'/assets/sounds/lofi.mp3'} id="lofiSound" loop ></audio>
    </div>
  </div>
  )
}