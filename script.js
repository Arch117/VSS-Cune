// Created by Archimedes

const musicButton = document.getElementById("musicButton");
const musicControl = document.querySelector(".music-control");
const musicLabel = document.getElementById("musicLabel");

let audioContext = null;
let masterGain = null;
let musicTimer = null;
let musicPlaying = false;
let nextNoteTime = 0;
let step = 0;

const tempo = 100;
const beat = 60 / tempo;

// A mellow electronic chord progression.
const chords = [
    [130.81, 164.81, 196.00], // C major
    [110.00, 130.81, 164.81], // A minor
    [87.31, 110.00, 130.81],  // F major
    [98.00, 123.47, 146.83]   // G major
];

function createTone(frequency, startTime, duration, volume, type = "sine") {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(
        Math.max(volume, 0.0002),
        startTime + 0.15
    );

    gain.gain.setValueAtTime(
        Math.max(volume, 0.0002),
        startTime + duration * 0.65
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + duration
    );

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
}

function scheduleMusic() {
    while (nextNoteTime < audioContext.currentTime + 0.5) {
        const chordIndex = Math.floor(step / 8) % chords.length;
        const chord = chords[chordIndex];

        // Soft background pad.
        if (step % 8 === 0) {
            chord.forEach((frequency) => {
                createTone(
                    frequency * 2,
                    nextNoteTime,
                    beat * 7,
                    0.035,
                    "sine"
                );
            });
        }

        // Gentle bass pulse.
        if (step % 4 === 0) {
            createTone(
                chord[0],
                nextNoteTime,
                beat * 2,
                0.12,
                "triangle"
            );
        }

        // A repeating high-pitched futuristic melody.
        if (step % 2 === 0) {
            const melody = [2, 1, 2, 0, 1, 2, 1, 0];
            const noteIndex = melody[(step / 2) % melody.length];

            createTone(
                chord[noteIndex] * 4,
                nextNoteTime,
                beat * 1.5,
                0.025,
                "sine"
            );
        }

        nextNoteTime += beat / 2;
        step++;
    }
}

async function startMusic() {
    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        musicLabel.textContent = "Audio not supported";
        return;
    }

    if (!audioContext) {
        audioContext = new AudioContextClass();

        masterGain = audioContext.createGain();
        masterGain.gain.value = 2.2;
        masterGain.connect(audioContext.destination);
    }

    await audioContext.resume();

    musicPlaying = true;
    nextNoteTime = audioContext.currentTime + 0.1;
    step = 0;

    musicTimer = window.setInterval(scheduleMusic, 100);

    scheduleMusic();

    musicButton.textContent = "Ⅱ Pause music";
    musicLabel.textContent = "Now playing";
    musicControl.classList.add("playing");
}

async function stopMusic() {
    musicPlaying = false;

    if (musicTimer !== null) {
        clearInterval(musicTimer);
        musicTimer = null;
    }

    if (audioContext && audioContext.state !== "closed") {
        await audioContext.suspend();
    }

    musicButton.textContent = "♫ Play music";
    musicLabel.textContent = "Ambient soundtrack";
    musicControl.classList.remove("playing");
}

musicButton.addEventListener("click", async () => {
    try {
        if (musicPlaying) {
            await stopMusic();
        } else {
            await startMusic();
        }
    } catch (error) {
        console.error("Unable to play the soundtrack:", error);
        musicLabel.textContent = "Audio unavailable";
    }
});