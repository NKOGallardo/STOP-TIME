import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // Import the new CSS file

export default function App() {
  const [activeTab, setActiveTab] = useState('stopwatch');
  
  // Stopwatch state
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);

  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTime, setTimerTime] = useState(300000); 
  const [timerTotal, setTimerTotal] = useState(300000);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  // Stopwatch effects
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Timer effects
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerTime(prevTime => {
          if (prevTime <= 10) {
            setIsTimerRunning(false);
            playAlarmSound();
            return 0;
          }
          return prevTime - 10;
        });
      }, 10);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isTimerRunning]);

  const playAlarmSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }, i * 600);
    }
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const formatTimerTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleStartStop = () => setIsRunning(!isRunning);
  const handleReset = () => { setIsRunning(false); setTime(0); setLaps([]); };
  const handleLap = () => { if (isRunning) setLaps([...laps, time]); };
  const handleTimerStartStop = () => setIsTimerRunning(!isTimerRunning);
  const handleTimerReset = () => {
    setIsTimerRunning(false);
    const totalMs = (timerMinutes * 60 + timerSeconds) * 1000;
    setTimerTime(totalMs);
    setTimerTotal(totalMs);
  };

  const handleSetTimer = () => {
    const totalMs = (timerMinutes * 60 + timerSeconds) * 1000;
    setTimerTime(totalMs);
    setTimerTotal(totalMs);
    setIsTimerRunning(false);
  };

  const getCircleProgress = () => timerTotal === 0 ? 0 : (timerTime / timerTotal) * 100;

  return (
    <div className="container">
      <div className="card">
        <div className="tabs">
          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`tab ${activeTab === 'stopwatch' ? 'active' : ''}`}
          >
            STOPWATCH
          </button>
          <button
            onClick={() => setActiveTab('timer')}
            className={`tab ${activeTab === 'timer' ? 'active' : ''}`}
          >
            TIMER
          </button>
        </div>

        {activeTab === 'stopwatch' ? (
          <div className="content">
            <div className="time-display">{formatTime(time)}</div>

            <div className="button-group">
              <button 
                onClick={handleStartStop} 
                className={`btn ${isRunning ? 'btn-stop' : 'btn-start'}`}
              >
                {isRunning ? 'STOP' : 'START'}
              </button>

              <button 
                onClick={handleLap} 
                disabled={!isRunning} 
                className="btn btn-lap"
              >
                LAP
              </button>

              <button onClick={handleReset} className="btn btn-reset">
                RESET
              </button>
            </div>

            {laps.length > 0 && (
              <div className="laps-container">
                <h2 className="laps-title">Laps</h2>
                <div className="laps-list">
                  {laps.map((lapTime, index) => (
                    <div key={index} className="lap-item">
                      <span className="lap-number">Lap {laps.length - index}</span>
                      <span className="lap-time">{formatTime(lapTime)}</span>
                      <span className="lap-diff">
                        {index < laps.length - 1 
                          ? `+${formatTime(lapTime - laps[index + 1])}`
                          : formatTime(lapTime)
                        }
                      </span>
                    </div>
                  )).reverse()}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="content">
            <div className="circle-container">
              <svg width="280" height="280">
                <circle cx="140" cy="140" r="120" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                <circle
                  cx="140" cy="140" r="120" fill="none"
                  stroke={timerTime === 0 ? '#f56565' : '#667eea'}
                  strokeWidth="20"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - getCircleProgress() / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 140 140)"
                  style={{ transition: 'stroke-dashoffset 0.01s linear' }}
                />
              </svg>
              <div className="timer-text-display">
                {formatTimerTime(timerTime)}
              </div>
            </div>

            {!isTimerRunning && timerTime === timerTotal && (
              <div className="timer-inputs">
                <div className="input-group">
                  <label>Minutes</label>
                  <input
                    type="number" min="0" max="99"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
                <div className="input-group">
                  <label>Seconds</label>
                  <input
                    type="number" min="0" max="59"
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  />
                </div>
                <button onClick={handleSetTimer} className="btn btn-set">SET</button>
              </div>
            )}

            <div className="button-group">
              <button
                onClick={handleTimerStartStop}
                disabled={timerTotal === 0}
                className={`btn ${isTimerRunning ? 'btn-stop' : 'btn-start'}`}
              >
                {isTimerRunning ? 'PAUSE' : 'START'}
              </button>
              <button onClick={handleTimerReset} className="btn btn-reset">RESET</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}