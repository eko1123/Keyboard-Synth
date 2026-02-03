document.addEventListener("DOMContentLoaded", function(event) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const keyboardFrequencyMap = {
    '90': 261.625565300598634,  //Z - C
    '83': 277.182630976872096, //S - C#
    '88': 293.664767917407560,  //X - D
    '68': 311.126983722080910, //D - D#
    '67': 329.627556912869929,  //C - E
    '86': 349.228231433003884,  //V - F
    '71': 369.994422711634398, //G - F#
    '66': 391.995435981749294,  //B - G
    '72': 415.304697579945138, //H - G#
    '78': 440.000000000000000,  //N - A
    '74': 466.163761518089916, //J - A#
    '77': 493.883301256124111,  //M - B
    '81': 523.251130601197269,  //Q - C
    '50': 554.365261953744192, //2 - C#
    '87': 587.329535834815120,  //W - D
    '51': 622.253967444161821, //3 - D#
    '69': 659.255113825739859,  //E - E
    '82': 698.456462866007768,  //R - F
    '53': 739.988845423268797, //5 - F#
    '84': 783.990871963498588,  //T - G
    '54': 830.609395159890277, //6 - G#
    '89': 880.000000000000000,  //Y - A
    '55': 932.327523036179832, //7 - A#
    '85': 987.766602512248223,  //U - B
    '73': 1046.502261202394538 //I - C
    };

    const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    let currentTemperament = "et"; //et, well, ji
    let currentRoot = 0;

    const rootSelect = document.getElementById("rootSelect");
    const tuningStatus = document.getElementById("tuningStatus");
    const rootContainer = document.getElementById("rootContainer");

    //root note options
    if (rootSelect && tuningStatus && rootContainer) {
        for (let i = 0; i < NOTE_NAMES.length; i++) {
            const opt = document.createElement("option");
            opt.value = String(i);
            opt.textContent = NOTE_NAMES[i];
            rootSelect.appendChild(opt);
        }
        rootSelect.value = "0";

        rootSelect.addEventListener("change", () => {
            currentRoot = Number(rootSelect.value);
            updateTuningStatus();
        });

        for (const btn of document.querySelectorAll("button.temp")) {
            btn.addEventListener("click", () => {
                currentTemperament = btn.dataset.temp;
                updateTuningStatus();
            });
        }

        function updateTuningStatus() {
            const tempName = {
                et: "Equal (12-TET)",
                well: "Well (Werckmeister III)",
                ji: "Pure (Just Intonation)"
            }[currentTemperament];

            if (currentTemperament == "ji") {
                rootContainer.style.display = "inline";
                tuningStatus.textContent = `Tuning: ${tempName}, Root: ${NOTE_NAMES[currentRoot]}`;
            } else {
                rootContainer.style.display = "none";
                tuningStatus.textContent = `Tuning: ${tempName}`;
            }
        }
        updateTuningStatus();
    }
    // tuning functions
    const keycodeInPitchOrder = [
        '90', '83', '88', '68', '67', '86', '71', '66', '72', '78', '74', '77',
        '81', '50', '87', '51', '69', '82', '53', '84', '54', '89', '55', '85', '73'
    ];
    const keyToMidi = {};
    for (let i = 0; i < keycodeInPitchOrder.length; i++) {
        keyToMidi[keycodeInPitchOrder[i]] = 60 + i; // C4 = MIDI 60
    }

    const WELL_RATIOS = [0, 96.090, 203.910, 300.000, 396.090, 503.910, 600.000, 701.955, 792.180, 900.000, 1001.955, 1098.045].map(c => Math.pow(2, c / 1200));
    const JI_RATIOS = [1/1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 9/5, 15/8];

    function tunedFrequency(midi) {
        let ratios;
        if (currentTemperament === "well") {
            ratios = WELL_RATIOS;
        } else if (currentTemperament === "ji") {
            ratios = JI_RATIOS;
        }

        const rootMidi = 60 + currentRoot;
        const rootHz = 440 * Math.pow(2, (rootMidi - 69) / 12);
        const diff = midi - rootMidi;
        const octaveShift = Math.floor(diff / 12);
        const degree = (diff % 12 + 12) % 12; 
        return rootHz * ratios[degree] * Math.pow(2, octaveShift);
    }

    function getFrequencyForKey(key) {
        if (currentTemperament === "et") {
            return keyboardFrequencyMap[key];
        }

        const midi = keyToMidi[key];
        return tunedFrequency(midi);
    }

    // wave types
    
    const waveTypes = ['sine', 'square', 'sawtooth', 'triangle'];
    let currentWaveTypeIndex = 0;
    const waveTypeButton = document.getElementById('waveTypeButton');
    waveTypeButton.addEventListener('click', () => {
        currentWaveTypeIndex = (currentWaveTypeIndex + 1) % waveTypes.length;
        waveTypeButton.textContent = `Change Wave Type: (currently ${waveTypes[currentWaveTypeIndex]})`;
    });

    // audio

    const globalGain = audioCtx.createGain();
    globalGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    globalGain.connect(audioCtx.destination);

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);
    const activeOscillators = {};
    const activeGainNodes = {};

    function updateMasterGain() {
        const n = Object.keys(activeOscillators).length;
        const targetGain = n > 0 ? Math.min(0.3 / Math.sqrt(n), 0.3) : 0.3;
        globalGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.01);
    }

    function keyDown(event) {
        if (event.repeat) return;
        const key = (event.detail || event.which).toString();
        if (keyToMidi[key] === undefined) return;
        if (!activeOscillators[key]) {
            playNote(key);
        }
    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyToMidi[key] === undefined) return;
        if (activeOscillators[key]) {
            const now = audioCtx.currentTime;
            const gainNode = activeGainNodes[key];
            const osc = activeOscillators[key];

            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05); // release

            osc.stop(now + 0.06);
            osc.onended = function() {
                osc.disconnect();
                gainNode.disconnect();
                delete activeOscillators[key];
                delete activeGainNodes[key];
                updateMasterGain();
            };
        }
    }

    function playNote(key) {
        // create oscillator
        const osc = audioCtx.createOscillator();
        const freq = getFrequencyForKey(key);
        if (freq === undefined) return;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.type = waveTypes[currentWaveTypeIndex];
        // create gain node for envelope
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        osc.connect(gainNode).connect(globalGain);
        // store references to active oscillator and gain node
        activeOscillators[key] = osc;
        activeGainNodes[key] = gainNode;
        // adjust master gain based on number of active notes
        updateMasterGain();
        // start oscillator and apply envelope
        osc.start();
        gainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.01); // attack
        gainNode.gain.setTargetAtTime(0.65, audioCtx.currentTime + 0.01, 0.05); // decay to sustain
    }

});

