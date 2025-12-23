import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function AthleteStopwatch() {
  const [activeTab, setActiveTab] = useState('stopwatch');
  
  // Stopwatch state
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTime, setTimerTime] = useState(300000);
  const [timerTotal, setTimerTotal] = useState(300000);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);
  const [targetSets, setTargetSets] = useState(1);
  const [timerPresets, setTimerPresets] = useState([
    { label: '30s', seconds: 30 },
    { label: '1m', seconds: 60 },
    { label: '3m', seconds: 180 },
    { label: '5m', seconds: 300 },
    { label: '10m', seconds: 600 },
    { label: '15m', seconds: 900 }
  ]);
  const timerIntervalRef = useRef(null);
  const alarmAudioRef = useRef(null);

  useEffect(() => {
    // Preload the provided alarm audio URL so it can play immediately when timer ends
    const alarmUrl = 'https://tiengdong.com/en/en69442?utm_source=copylink&utm_medium=share_button&utm_campaign=shared_from_tiengdong.com&utm_content=en-01h07-24-12-2025';
    try {
      alarmAudioRef.current = new Audio(alarmUrl);
      alarmAudioRef.current.preload = 'auto';
    } catch (e) {
      alarmAudioRef.current = null;
    }
  }, []);

  // Settings state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showMilliseconds, setShowMilliseconds] = useState(true);
  const [splitTimes, setSplitTimes] = useState([]);
  
  // History state
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Stopwatch effects
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Timer effects
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerTime(prevTime => {
          if (prevTime <= 10) {
            setIsTimerRunning(false);
            if (soundEnabled) playAlarmSound();
            if (vibrationEnabled && navigator.vibrate) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
            
            // Handle sets
            const newCompletedSets = completedSets + 1;
            setCompletedSets(newCompletedSets);
            
            if (newCompletedSets < targetSets) {
              // Auto-restart for next set
              setTimeout(() => {
                setTimerTime(timerTotal);
                setIsTimerRunning(true);
              }, 2000);
            }
            return 0;
          }
          return prevTime - 10;
        });
      }, 10);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, soundEnabled, vibrationEnabled, completedSets, targetSets, timerTotal]);

  const playAlarmSound = () => {
    if (alarmAudioRef.current) {
      try {
        alarmAudioRef.current.currentTime = 0;
        alarmAudioRef.current.play().catch(() => {});
      } catch (e) {
        // ignore play errors
      }
      return;
    }

    // Fallback: short beep if audio not available
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const formatTime = (milliseconds, includeMs = showMilliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);

    if (hours > 0) {
      return includeMs 
        ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
        : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    return includeMs 
      ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatTimerTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Stopwatch functions
  const handleStartStop = () => {
    setIsRunning(!isRunning);
    setIsPaused(!isRunning);
    if (soundEnabled) playClickSound();
  };

  const handleReset = () => {
    // Save to history if there were laps
    if (laps.length > 0) {
      const workout = {
        date: new Date().toISOString(),
        totalTime: time,
        laps: [...laps],
        type: 'stopwatch'
      };
      setWorkoutHistory([workout, ...workoutHistory].slice(0, 10)); // Keep last 10
    }
    
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    setLaps([]);
    setSplitTimes([]);
  };

  const handleLap = () => {
    if (isRunning) {
      const newLap = time;
      const splitTime = laps.length > 0 ? time - laps[laps.length - 1] : time;
      setLaps([...laps, newLap]);
      setSplitTimes([...splitTimes, splitTime]);
      if (soundEnabled) playClickSound();
      if (vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  const playClickSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  // Get best and worst lap
  const getBestLap = () => {
    if (splitTimes.length === 0) return null;
    return Math.min(...splitTimes);
  };

  const getWorstLap = () => {
    if (splitTimes.length === 0) return null;
    return Math.max(...splitTimes);
  };

  const getAverageLap = () => {
    if (splitTimes.length === 0) return null;
    return splitTimes.reduce((a, b) => a + b, 0) / splitTimes.length;
  };

  // Timer functions
  const handleTimerStartStop = () => {
    setIsTimerRunning(!isTimerRunning);
    if (soundEnabled) playClickSound();
  };

  const handleTimerReset = () => {
    setIsTimerRunning(false);
    const totalMs = (timerMinutes * 60 + timerSeconds) * 1000;
    setTimerTime(totalMs);
    setTimerTotal(totalMs);
    setCompletedSets(0);
  };

  const handleSetTimer = () => {
    const totalMs = (timerMinutes * 60 + timerSeconds) * 1000;
    setTimerTime(totalMs);
    setTimerTotal(totalMs);
    setIsTimerRunning(false);
    setCompletedSets(0);
  };

  const handlePresetClick = (seconds) => {
    const totalMs = seconds * 1000;
    setTimerMinutes(Math.floor(seconds / 60));
    setTimerSeconds(seconds % 60);
    setTimerTime(totalMs);
    setTimerTotal(totalMs);
    setIsTimerRunning(false);
    setCompletedSets(0);
    if (soundEnabled) playClickSound();
  };

  const getCircleProgress = () => {
    if (timerTotal === 0) return 0;
    return (timerTime / timerTotal) * 100;
  };

  const exportLaps = () => {
    const data = laps.map((lapTime, index) => {
      const lapNumber = index + 1;
      const splitTime = splitTimes[index];
      return `Lap ${lapNumber},${formatTime(lapTime, false)},${formatTime(splitTime, false)}`;
    }).join('\n');
    
    const csvContent = `Lap Number,Total Time,Split Time\n${data}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laps_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const shareResults = () => {
    const text = `Stopwatch Results:\nTotal Time: ${formatTime(time)}\nLaps: ${laps.length}\nBest Lap: ${formatTime(getBestLap())}\nAverage: ${formatTime(getAverageLap())}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Workout Results',
        text: text
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    }
  };

  const clearHistory = () => {
    if (window.confirm('Clear all workout history?')) {
      setWorkoutHistory([]);
    }
  };

  const loadWorkout = (workout) => {
    setTime(workout.totalTime);
    setLaps(workout.laps);
    // Recalculate split times
    const splits = workout.laps.map((lap, index) => 
      index === 0 ? lap : lap - workout.laps[index - 1]
    );
    setSplitTimes(splits);
    setShowHistory(false);
  };

  return (
    <div className={`container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="mas">
        <div className="card">
          <div className="header-controls">
            <div className="tabs">
              <button
                onClick={() => setActiveTab('stopwatch')}
                className={`tab ${activeTab === 'stopwatch' ? 'active' : ''}`}
              >
                ⏱ STOPWATCH
              </button>
              <button
                onClick={() => setActiveTab('timer')}
                className={`tab ${activeTab === 'timer' ? 'active' : ''}`}
              >
                ⏲ TIMER
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
              >
                ⚙️
              </button>
            </div>
          </div>

          {activeTab === 'stopwatch' ? (
            <div className="content">
              <div className="circle-container">
                <div className="time-display">
                  {formatTime(time)}
                </div>
                {isRunning && (
                  <div className="pulse-indicator"></div>
                )}
              </div>

              <div className="button-group">
                <button
                  onClick={handleStartStop}
                  className={`btn ${isRunning ? 'btn-stop' : 'btn-start'}`}
                >
                  {isRunning ? '⏸ STOP' : isPaused ? '▶ RESUME' : '▶ START'}
                </button>

                <button
                  onClick={handleLap}
                  disabled={!isRunning}
                  className="btn btn-lap"
                >
                   LAP
                </button>

                <button
                  onClick={handleReset}
                  className="btn btn-reset"
                >
                   RESET
                </button>
              </div>

              {laps.length > 0 && (
                <div className="laps-container">
                  <div className="laps-header">
                    <h2 className="laps-title">Laps ({laps.length})</h2>
                    <div className="header-actions">
                      <button className="icon-btn-small" onClick={shareResults} title="Share">
                        📤
                      </button>
                      <button className="icon-btn-small" onClick={exportLaps} title="Export">
                        📥
                      </button>
                    </div>
                  </div>
                  
                  <div className="laps-stats">
                    <div className="stat-item">
                      <span className="stat-label">Best</span>
                      <span className="stat-value best">{formatTime(getBestLap())}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Average</span>
                      <span className="stat-value avg">{formatTime(getAverageLap())}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Worst</span>
                      <span className="stat-value worst">{formatTime(getWorstLap())}</span>
                    </div>
                  </div>
                  
                  <div className="laps-list">
                    {laps.map((lapTime, index) => {
                      const splitTime = splitTimes[index];
                      const isBest = splitTime === getBestLap();
                      const isWorst = splitTime === getWorstLap();
                      
                      return (
                        <div key={index} className={`lap-item ${isBest ? 'best-lap' : ''} ${isWorst ? 'worst-lap' : ''}`}>
                          <span className="lap-number">
                            {isBest && '🏆 '}
                            {isWorst && '🐌 '}
                            Lap {index + 1}
                          </span>
                          <span className="lap-time">{formatTime(lapTime)}</span>
                          <span className="lap-diff">
                            {formatTime(splitTime)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {workoutHistory.length > 0 && (
                <div className="history-section">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    📊 {showHistory ? 'Hide' : 'Show'} History ({workoutHistory.length})
                  </button>
                  
                  {showHistory && (
                    <div className="history-list">
                      {workoutHistory.map((workout, index) => (
                        <div key={index} className="history-item">
                          <div className="history-info">
                            <span className="history-date">
                              {new Date(workout.date).toLocaleDateString()} {new Date(workout.date).toLocaleTimeString()}
                            </span>
                            <span className="history-details">
                              {formatTime(workout.totalTime)} • {workout.laps.length} laps
                            </span>
                          </div>
                          <button 
                            className="btn-load"
                            onClick={() => loadWorkout(workout)}
                          >
                            Load
                          </button>
                        </div>
                      ))}
                      <button className="btn-danger-small" onClick={clearHistory}>
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'timer' ? (
            <div className="content">
              <div className="circle-container">
                <svg width="280" height="280" viewBox="0 0 280 280" style={{width: '100%', maxWidth: '280px', height: 'auto'}}>
                  <circle
                    cx="140"
                    cy="140"
                    r="120"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="20"
                  />
                  <circle
                    cx="140"
                    cy="140"
                    r="120"
                    fill="none"
                    stroke={timerTime === 0 ? '#f56565' : getCircleProgress() < 20 ? '#f6ad55' : '#667eea'}
                    strokeWidth="20"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - getCircleProgress() / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 140 140)"
                    style={{transition: 'stroke-dashoffset 0.01s linear, stroke 0.3s ease'}}
                  />
                </svg>
                <div className="timer-text-display">
                  {formatTimerTime(timerTime)}
                  {targetSets > 1 && (
                    <div className="sets-display">
                      Set {completedSets + 1}/{targetSets}
                    </div>
                  )}
                </div>
              </div>

              {!isTimerRunning && timerTime === timerTotal && (
                <>
                  <div className="timer-presets">
                    {timerPresets.map((preset, index) => (
                      <button
                        key={index}
                        className="preset-btn"
                        onClick={() => handlePresetClick(preset.seconds)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="timer-inputs">
                    <div className="input-group">
                      <label>Minutes</label>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={timerMinutes}
                        onChange={(e) => setTimerMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      />
                    </div>
                    <div className="input-group">
                      <label>Seconds</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={timerSeconds}
                        onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      />
                    </div>
                    <button
                      onClick={handleSetTimer}
                      className="btn btn-set"
                    >
                      SET
                    </button>
                  </div>

                  <div className="sets-control">
                    <label>Sets (Rounds)</label>
                    <div className="sets-buttons">
                      <button 
                        className="sets-btn"
                        onClick={() => setTargetSets(Math.max(1, targetSets - 1))}
                      >
                        -
                      </button>
                      <span className="sets-value">{targetSets}</span>
                      <button 
                        className="sets-btn"
                        onClick={() => setTargetSets(Math.min(99, targetSets + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="button-group">
                <button
                  onClick={handleTimerStartStop}
                  disabled={timerTotal === 0}
                  className={`btn ${isTimerRunning ? 'btn-stop' : 'btn-start'}`}
                >
                  {isTimerRunning ? '⏸ PAUSE' : '▶ START'}
                </button>

                <button
                  onClick={handleTimerReset}
                  className="btn btn-reset"
                >
                   RESET
                </button>
              </div>

              {completedSets > 0 && (
                <div className="completed-sets">
                  ✅ Completed {completedSets} of {targetSets} sets
                </div>
              )}
            </div>
          ) : (
            <div className="content settings-content">
              <h2 className="settings-title">⚙️ Settings</h2>
              
              <div className="settings-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">🔊 Sound Effects</span>
                    <span className="setting-desc">Play sounds for buttons and timer</span>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={soundEnabled}
                      onChange={() => setSoundEnabled(!soundEnabled)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">📳 Vibration</span>
                    <span className="setting-desc">Vibrate on lap and timer end</span>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={vibrationEnabled}
                      onChange={() => setVibrationEnabled(!vibrationEnabled)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">🌙 Dark Mode</span>
                    <span className="setting-desc">Switch to dark theme</span>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={darkMode}
                      onChange={() => setDarkMode(!darkMode)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">⏱️ Milliseconds</span>
                    <span className="setting-desc">Show milliseconds in stopwatch</span>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={showMilliseconds}
                      onChange={() => setShowMilliseconds(!showMilliseconds)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="app-info">
                <h3>About</h3>
                <p>Athlete Stopwatch & Timer</p>
                <p className="version">Version 2.0</p>
                <p className="copyright">By <a href='https://nkogallardo.link'>Ntobeko</a></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}