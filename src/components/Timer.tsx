import { time } from 'console';
import { stat } from 'fs';
import React, { useState, useEffect, useRef } from 'react';
import { BsFillPlayFill, BsPauseFill, BsArrowRepeat, BsStopFill, BsStop, BsPlay, BsPlayFill } from 'react-icons/bs';
import { create } from 'zustand';

// Interface to define the structure of your app's state
interface TimerState {
    timerMode: 'work' | 'break';
    timeLeft: number;
    isRunning: boolean;
    isPaused: boolean;
    workMinutes: number;
    breakMinutes: number;
    setTimerMode: (timerMode: 'work' | 'break') => void;
    setTimeLeft: (timeLeft: number) => void;
    setIsRunning: (isRunning: boolean) => void;
    setWorkMinutes: (workMinutes: number) => void;
    setBreakMinutes: (breakMinutes: number) => void;
    setIsPaused: (isPaused: boolean) => void;

}

export const useTimerStore = create<TimerState>((set) => ({
    timerMode: 'work',
    timeLeft: 10*60, // 25 minutes
    isRunning: false,
    workMinutes: 10,
    breakMinutes: 5,
    isPaused: true,
    setTimerMode: (timerMode) => set({ timerMode }),
    setTimeLeft: (timeLeft) => set({ timeLeft }),
    setIsRunning: (isRunning) => set({ isRunning }),
    setWorkMinutes: (workMinutes) => set({ workMinutes }),
    setBreakMinutes: (breakMinutes) => set({ breakMinutes }),
    setIsPaused: (isPaused) => set({ isPaused }),
}));

// const unsub1 = timerStore.subscribe((state, prevState) => {
//   if(prevState.isRunning != state.isRunning){
//     console.log('isRunning changed');
//     if(state.isRunning === true){
//       console.log('Timer started');
//     }

//   }
// });
function Timer() {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Using the zustand store for better state management
  const workMinutes = useTimerStore((state) => state.workMinutes);
  const breakMinutes = useTimerStore((state) => state.breakMinutes);
  const timeLeft = useTimerStore((state) => state.timeLeft);
  const timerMode = useTimerStore((state) => state.timerMode);
  const isRunning = useTimerStore((state) => state.isRunning);
  const isPaused = useTimerStore((state) => state.isPaused)

  const setTimerMode = useTimerStore((state) => state.setTimerMode);
  const setTimeLeft = useTimerStore((state) => state.setTimeLeft);
  const setIsRunning = useTimerStore((state) => state.setIsRunning);
  const setWorkMinutes = useTimerStore((state) => state.setWorkMinutes);
  const setBreakMinutes = useTimerStore((state) => state.setBreakMinutes);
  const setIsPaused = useTimerStore((state) => state.setIsPaused);

  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (!isPaused && isRunning) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft-1);
      }, 1000);
    }
    // Clean up the interval on unmount or when isRunning changes
    return () => clearInterval(interval as NodeJS.Timeout);
  }, [isPaused, timeLeft, setTimeLeft]); // Only re-run this effect if isRunning changes
  useEffect(() => {
    if (timeLeft === 0 && !isPaused && isRunning) { // Check if running to prevent resetting on initial load
      audioRef.current?.play();
      setIsPaused(true);
      setShowNotification(true);
    } 
  }, [timeLeft, timerMode, isRunning]); // This effect depends on all three variables

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(timerMode === 'work' ? workMinutes * 60 : breakMinutes * 60);
    }
  }, [workMinutes, breakMinutes]); // Add timerMode and isRunning
  
  const handleStartPause = () => {
    if(!isPaused){
      setIsPaused(true);
    }
    else{
      setIsPaused(false);
      setIsRunning(true);
    }
  }
  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(true);
    setShowNotification(false);
    setTimerMode('work');
    setTimeLeft(workMinutes * 60);
  };

  const handleIncreaseWorkTime = () => {
    if (workMinutes < 120) {
      setWorkMinutes(workMinutes + 5);
      if (!isRunning && timerMode === 'work') {
        setTimeLeft((workMinutes + 5) * 60);
      }
    }
  };

  const handleDecreaseWorkTime = () => {
    if (workMinutes > 10) {
      setWorkMinutes(workMinutes - 5);
      if (!isRunning && timerMode === 'work') {
        setTimeLeft((workMinutes - 5) * 60);
      }
    }
  };

  const handleIncreaseBreakTime = () => {
    if (breakMinutes < 60) {
      setBreakMinutes(breakMinutes + 1);
      if (!isRunning && timerMode === 'break') {
        setTimeLeft((breakMinutes + 1) * 60);
      }
    }
  };

  const handleDecreaseBreakTime = () => {
    if (breakMinutes > 1) {
      setBreakMinutes(breakMinutes - 1);
      if (!isRunning && timerMode === 'break') {
        setTimeLeft((breakMinutes - 1) * 60);
      }
    }
  }

  const handleContinue = () => {
    setShowNotification(false);
    const newTime = timerMode === 'work' ? 10 * 60 : 5 * 60;
    setTimeLeft(newTime);
    setIsRunning(true);
    setIsPaused(false);
  };

  const handleSwitchMode = () => {
      setShowNotification(false);
      setTimerMode(timerMode === 'work' ? 'break' : 'work');
      setTimeLeft(timerMode === 'work' ? breakMinutes * 60 : workMinutes * 60);
      setIsRunning(true);
      setIsPaused(false);
  };
  return (
    <div className="pomodoro-timer">
      <h2>{timerMode === 'work' ? 'Work Time' : 'Break Time'}</h2>
      {
        !isRunning && (
          <div>
            <div className="time-control-group">
              <label htmlFor="work-duration">Work:</label>
              <button className="adjust-button" onClick={handleDecreaseWorkTime}>-</button>
              <span className="time-display">{workMinutes} min</span>
              <button className="adjust-button" onClick={handleIncreaseWorkTime}>+</button>
            </div>

            <div className="time-control-group">
              <label htmlFor="break-duration">Break:</label>
              <button className="adjust-button" onClick={handleDecreaseBreakTime}>-</button>
              <span className="time-display">{breakMinutes} min</span>
              <button className="adjust-button" onClick={handleIncreaseBreakTime}>+</button>
            </div>
          </div>
        )
      }
    
      <div className="timer-display">{formatTime(timeLeft)}</div>
          <button className="timer-button" onClick={handleStartPause} disabled = {showNotification}>
              {isPaused ? <BsPlayFill /> : <BsPauseFill />}
          </button>
          <button className="timer-button" onClick={handleStop}><BsStopFill/></button>

          {/* Notification (Shown when timer reaches 0) */}
          {showNotification && (
              <div className="notification">
                  <p>Time's up!</p>
                  <button onClick={handleContinue}>Continue</button>
                  <button onClick={handleSwitchMode}>{timerMode === 'work' ? 'Take a Break' : 'Start Working'}</button>
              </div>
          )}

      <audio ref={audioRef}>
        {/* Add your sound file here (e.g., <source src="alarm.mp3" type="audio/mpeg" />) */}
      </audio>
    </div>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default Timer;
// ... (rest of the code: formatTime function, CSS)
