class FocusTimer {
  constructor() {
    this.isRunning = false;
    this.currentMode = "work";
    this.timeLeft = 0;
    this.totalTime = 0;
    this.interval = null;
    this.settings = this.loadSettings();

    this.initializeElements();
    this.bindEvents();
    this.applySettings();
    this.resetTimer();
  }

  initializeElements() {
    this.timerTime = document.getElementById("timer-time");
    this.timerLabel = document.getElementById("timer-label");
    this.startBtn = document.getElementById("start-btn");
    this.pauseBtn = document.getElementById("pause-btn");
    this.resetBtn = document.getElementById("reset-btn");
    this.settingsBtn = document.getElementById("settings-btn");
    this.closeSettingsBtn = document.getElementById("close-settings");
    this.settingsPanel = document.getElementById("settings-panel");
    this.progressBar = document.getElementById("progress-bar");
    this.timerContainer = document.querySelector(".timer-container");

    // Digit wheels
    this.hoursTens = document
      .getElementById("hours-tens")
      .querySelector(".digit-wheel");
    this.hoursOnes = document
      .getElementById("hours-ones")
      .querySelector(".digit-wheel");
    this.minutesTens = document
      .getElementById("minutes-tens")
      .querySelector(".digit-wheel");
    this.minutesOnes = document
      .getElementById("minutes-ones")
      .querySelector(".digit-wheel");
    this.secondsTens = document
      .getElementById("seconds-tens")
      .querySelector(".digit-wheel");
    this.secondsOnes = document
      .getElementById("seconds-ones")
      .querySelector(".digit-wheel");
    this.hoursSegment = document.querySelector(".hours-segment");

    // Settings inputs
    this.workDuration = document.getElementById("work-duration");
    this.breakDuration = document.getElementById("break-duration");
    this.longBreakDuration = document.getElementById("long-break-duration");
    this.autoStartBreaks = document.getElementById("auto-start-breaks");
    this.soundNotifications = document.getElementById("sound-notifications");
    this.themeColor = document.getElementById("theme-color");

    // Mode buttons
    this.modeButtons = document.querySelectorAll(".mode-btn");
  }

  bindEvents() {
    this.startBtn.addEventListener("click", () => this.startTimer());
    this.pauseBtn.addEventListener("click", () => this.pauseTimer());
    this.resetBtn.addEventListener("click", () => this.resetTimer());
    this.settingsBtn.addEventListener("click", () => this.toggleSettings());
    this.closeSettingsBtn.addEventListener("click", () =>
      this.toggleSettings()
    );

    // Mode buttons
    this.modeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setMode(e.target.dataset.mode);
      });
    });

    // Settings changes
    this.workDuration.addEventListener("change", () => this.saveSettings());
    this.breakDuration.addEventListener("change", () => this.saveSettings());
    this.longBreakDuration.addEventListener("change", () =>
      this.saveSettings()
    );
    this.autoStartBreaks.addEventListener("change", () => this.saveSettings());
    this.soundNotifications.addEventListener("change", () =>
      this.saveSettings()
    );
    this.themeColor.addEventListener("change", () => this.saveSettings());

    // Close settings on outside click
    document.addEventListener("click", (e) => {
      if (
        !this.settingsPanel.contains(e.target) &&
        !this.settingsBtn.contains(e.target) &&
        this.settingsPanel.classList.contains("open")
      ) {
        this.toggleSettings();
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (this.isRunning) {
          this.pauseTimer();
        } else {
          this.startTimer();
        }
      } else if (e.code === "KeyR") {
        this.resetTimer();
      } else if (e.code === "KeyS") {
        this.toggleSettings();
      } else if (e.code === "Escape" && this.isRunning) {
        this.pauseTimer();
      }
    });
  }

  loadSettings() {
    const defaultSettings = {
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: false,
      soundNotifications: true,
      themeColor: "#6366f1",
    };

    const saved = localStorage.getItem("focusTimerSettings");
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  }

  saveSettings() {
    this.settings = {
      workDuration: parseInt(this.workDuration.value),
      breakDuration: parseInt(this.breakDuration.value),
      longBreakDuration: parseInt(this.longBreakDuration.value),
      autoStartBreaks: this.autoStartBreaks.checked,
      soundNotifications: this.soundNotifications.checked,
      themeColor: this.themeColor.value,
    };

    localStorage.setItem("focusTimerSettings", JSON.stringify(this.settings));
    this.applySettings();
  }

  applySettings() {
    // Update input values
    this.workDuration.value = this.settings.workDuration;
    this.breakDuration.value = this.settings.breakDuration;
    this.longBreakDuration.value = this.settings.longBreakDuration;
    this.autoStartBreaks.checked = this.settings.autoStartBreaks;
    this.soundNotifications.checked = this.settings.soundNotifications;
    this.themeColor.value = this.settings.themeColor;

    // Apply theme color
    document.documentElement.style.setProperty(
      "--primary-color",
      this.settings.themeColor
    );

    // Update secondary color (slightly darker)
    const secondaryColor = this.adjustColor(this.settings.themeColor, -20);
    document.documentElement.style.setProperty(
      "--secondary-color",
      secondaryColor
    );
  }

  adjustColor(color, amount) {
    const hex = color.replace("#", "");
    const r = Math.max(
      0,
      Math.min(255, parseInt(hex.substr(0, 2), 16) + amount)
    );
    const g = Math.max(
      0,
      Math.min(255, parseInt(hex.substr(2, 2), 16) + amount)
    );
    const b = Math.max(
      0,
      Math.min(255, parseInt(hex.substr(4, 2), 16) + amount)
    );
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  setMode(mode) {
    this.currentMode = mode;

    // Update active button
    this.modeButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    // Update label
    const labels = {
      work: "Work Time",
      break: "Break Time",
      "long-break": "Long Break",
    };
    this.timerLabel.textContent = labels[mode];

    // Reset timer with new duration
    this.resetTimer();

    // Add animation
    this.timerLabel.classList.add("fade-in");
    setTimeout(() => this.timerLabel.classList.remove("fade-in"), 500);
  }

  getDuration() {
    const durations = {
      work: this.settings.workDuration,
      break: this.settings.breakDuration,
      "long-break": this.settings.longBreakDuration,
    };
    return durations[this.currentMode] * 60; // Convert to seconds
  }

  resetTimer() {
    this.pauseTimer();
    this.totalTime = this.getDuration();
    this.timeLeft = this.totalTime;
    this.initializeDigits();
    this.updateDisplay(); // Add this to show the correct initial time
    this.updateProgress();
  }

  initializeDigits() {
    // Set initial positions without animation
    const duration = this.getDuration();
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    // Set digit positions (no animation)
    this.setDigitPosition(this.hoursTens, Math.floor(hours / 10), false);
    this.setDigitPosition(this.hoursOnes, hours % 10, false);
    this.setDigitPosition(this.minutesTens, Math.floor(minutes / 10), false);
    this.setDigitPosition(this.minutesOnes, minutes % 10, false);
    this.setDigitPosition(this.secondsTens, Math.floor(seconds / 10), false);
    this.setDigitPosition(this.secondsOnes, seconds % 10, false);

    // Show/hide hours
    if (hours > 0) {
      this.hoursSegment.style.display = "flex";
      this.hoursSegment.classList.add("show");
    } else {
      this.hoursSegment.style.display = "none";
      this.hoursSegment.classList.remove("show");
    }
  }

  setDigitPosition(wheel, value, animate = true) {
    if (!wheel) return;

    if (!animate) {
      wheel.style.transition = "none";
    }

    // Calculate transform based on digit value
    const offset = -value * 1.2; // 1.2em per digit
    wheel.style.transform = `translateY(${offset}em)`;

    if (!animate) {
      // Force reflow to apply the no-transition style
      wheel.offsetHeight;
      // Re-enable transitions
      wheel.style.transition = "";
    }
  }

  startTimer() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startBtn.style.display = "none";
    this.pauseBtn.style.display = "inline-block";

    // Enter fullscreen mode
    this.enterFullscreen();

    this.interval = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();
      this.updateProgress();

      if (this.timeLeft <= 0) {
        this.timerComplete();
      }
    }, 1000);

    // Add subtle glow effect for active timer
    this.timerTime.classList.add("active-timer");
  }

  pauseTimer() {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.startBtn.style.display = "inline-block";
    this.pauseBtn.style.display = "none";

    clearInterval(this.interval);
    this.interval = null;

    // Exit fullscreen mode
    this.exitFullscreen();

    // Remove active timer effect
    this.timerTime.classList.remove("active-timer");
  }

  timerComplete() {
    this.pauseTimer();

    // Play notification sound
    if (this.settings.soundNotifications) {
      this.playNotificationSound();
    }

    // Show notification
    this.showNotification();

    // Auto-start break if enabled
    if (this.settings.autoStartBreaks && this.currentMode === "work") {
      setTimeout(() => {
        this.setMode("break");
        this.startTimer();
      }, 1000);
    }

    // Add completion animation
    this.timerTime.classList.add("fade-out");
    setTimeout(() => {
      this.timerTime.classList.remove("fade-out");
    }, 500);
  }

  playNotificationSound() {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }

  showNotification() {
    if ("Notification" in window && Notification.permission === "granted") {
      const messages = {
        work: "Work session complete! Time for a break.",
        break: "Break complete! Ready to work?",
        "long-break": "Long break complete! Ready to work?",
      };

      new Notification("Focus Timer", {
        body: messages[this.currentMode],
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
      });
    }
  }

  updateDisplay() {
    const hours = Math.floor(this.timeLeft / 3600);
    const minutes = Math.floor((this.timeLeft % 3600) / 60);
    const seconds = this.timeLeft % 60;

    // Show/hide hours
    if (hours > 0) {
      this.hoursSegment.style.display = "flex";
      this.hoursSegment.classList.add("show");
      this.setDigitPosition(this.hoursTens, Math.floor(hours / 10));
      this.setDigitPosition(this.hoursOnes, hours % 10);
    } else {
      this.hoursSegment.style.display = "none";
      this.hoursSegment.classList.remove("show");
    }

    // Update minutes and seconds with animation
    this.setDigitPosition(this.minutesTens, Math.floor(minutes / 10));
    this.setDigitPosition(this.minutesOnes, minutes % 10);
    this.setDigitPosition(this.secondsTens, Math.floor(seconds / 10));
    this.setDigitPosition(this.secondsOnes, seconds % 10);
  }

  updateProgress() {
    const progress = (this.totalTime - this.timeLeft) / this.totalTime;
    const progressPercentage = Math.round(progress * 100);

    if (this.progressBar) {
      this.progressBar.style.width = `${progressPercentage}%`;
    }
  }

  toggleSettings() {
    this.settingsPanel.classList.toggle("open");

    if (this.settingsPanel.classList.contains("open")) {
      this.settingsPanel.classList.add("fade-in");
    } else {
      this.settingsPanel.classList.remove("fade-in");
    }
  }

  enterFullscreen() {
    this.timerContainer.classList.add("fullscreen");
  }

  exitFullscreen() {
    this.timerContainer.classList.remove("fullscreen");
  }
}

// Request notification permission
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

// Initialize the timer when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new FocusTimer();
});
