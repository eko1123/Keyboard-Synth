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
    const synthType = document.getElementById("synthTypeSelect");
    const additiveSynthTypeSelect = document.getElementById("additiveSynthTypeSelect");

    const amContainer = document.getElementById("amContainer");
    const fmContainer = document.getElementById("fmContainer");

    const amFreq = document.getElementById("amFreq");
    const amIndex = document.getElementById("amIndex");
    const fmFreq = document.getElementById("fmFreq");
    const fmIndex = document.getElementById("fmIndex");

    const amFreqVal = document.getElementById("amFreqValue");
    const amIndexVal = document.getElementById("amIndexValue");
    const fmFreqVal = document.getElementById("fmFreqValue");
    const fmIndexVal = document.getElementById("fmIndexValue");

    function updateAmFmUI() {
        amContainer.style.display = synthType.value === "am" ? "inline" : "none";
        fmContainer.style.display = synthType.value === "fm" ? "inline" : "none";
    }
    function updateAmFmValues() {
        amFreqVal.textContent = Number(amFreq.value).toFixed(1);
        amIndexVal.textContent = Number(amIndex.value).toFixed(2);
        fmFreqVal.textContent = Number(fmFreq.value).toFixed(1);
        fmIndexVal.textContent = Number(fmIndex.value).toFixed(2);
    }

    synthType.addEventListener("change", () => {
        updateAmFmUI();
        updateAmFmValues();
    });

    [amFreq, amIndex, fmFreq, fmIndex].forEach(elem => {
        elem.addEventListener("input", updateAmFmValues);
    });

    updateAmFmUI();
    updateAmFmValues();

    //change LFO UI text based on whether it's on or off
    const lfoButton = document.getElementById('lfoButton');
    const lfoContainer = document.getElementById('lfoContainer');
    const lfoFreqSlider = document.getElementById('lfoFreq');
    const lfoDepthSlider = document.getElementById('lfoDepth');
    const lfoFreq = Number(lfoFreqSlider.value);
    const lfoDepth = Number(lfoDepthSlider.value);

    let lfoOn = false;
    let lfoOscillator = audioCtx.createOscillator();
    let lfoGain = audioCtx.createGain();
    let tremoloGain = audioCtx.createGain();
    tremoloGain.gain.setValueAtTime(1, audioCtx.currentTime);
    tremoloGain.connect(audioCtx.destination);

    lfoOscillator.type = 'sine';
    lfoOscillator.frequency.setValueAtTime(Number(lfoFreqSlider.value), audioCtx.currentTime);
    lfoGain.gain.setValueAtTime(0, audioCtx.currentTime);
    lfoOscillator.connect(lfoGain).connect(tremoloGain.gain);
    lfoOscillator.start();

    if (lfoButton && lfoContainer && lfoFreqSlider && lfoDepthSlider) {
        lfoButton.addEventListener('click', () => {
            lfoOn = !lfoOn;
            lfoContainer.style.display = lfoOn ? 'inline' : 'none';
            lfoButton.textContent = `Toggle LFO: (currently ${lfoOn ? 'on' : 'off'})`;
            setLFO();
        });
        lfoDepthSlider.addEventListener('input', () => {
            if (lfoOn) {
                lfoGain.gain.setValueAtTime(Number(lfoDepthSlider.value), audioCtx.currentTime);
            }
        });
        lfoFreqSlider.addEventListener('input', () => {
            if (lfoOn) {
                lfoOscillator.frequency.setValueAtTime(Number(lfoFreqSlider.value), audioCtx.currentTime);
            }
        });
    }

    function setLFO() {
        if (lfoOn) {
            let lfoFreq = Number(lfoFreqSlider.value);
            let lfoDepth = Number(lfoDepthSlider.value);
            lfoOscillator.frequency.setValueAtTime(lfoFreq, audioCtx.currentTime);
            lfoGain.gain.setValueAtTime(lfoDepth, audioCtx.currentTime);
        } else {
            lfoGain.gain.setValueAtTime(0, audioCtx.currentTime);
        }
    }

    //if synth type is changed to additive, show options for different types of additive synthesis (odd, even, all partials, or presets like clarinet, flute, violin)
    if (synthType && additiveSynthTypeSelect) { 
        const additiveOptions = document.getElementById("additiveOptions"); 
        additiveOptions.style.display = "none"; // hide by default
        synthType.addEventListener("change", () => {
            if (synthType.value === "additive") {
                additiveOptions.style.display = "block";
            } else {
                additiveOptions.style.display = "none";
            }
        });
    }

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
    if (waveTypeButton) {
        waveTypeButton.addEventListener('click', () => {
            currentWaveTypeIndex = (currentWaveTypeIndex + 1) % waveTypes.length;
            waveTypeButton.textContent = `Change Wave Type: (currently ${waveTypes[currentWaveTypeIndex]})`;
        });
    }

    // audio

    const globalGain = audioCtx.createGain();
    globalGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    globalGain.connect(tremoloGain);

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);
    const activeOscillators = {};
    const activeGainNodes = {};
    const keyGainNodes = {}; // gain node for each key to control overall level of that key's oscillators

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
            const gainNodes = activeGainNodes[key];
            const oscs = activeOscillators[key];
            const keyGainNode = keyGainNodes[key];

            keyGainNode.gain.cancelScheduledValues(now);
            keyGainNode.gain.setValueAtTime(keyGainNode.gain.value, now);
            keyGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05); // release
            let endedCount = 0;
            oscs.forEach((osc, index) => {
                osc.stop(now + 0.06);
                osc.onended = function() {
                    endedCount ++;
                    if (endedCount === oscs.length) {
                        oscs.forEach((osc, index) => {
                            osc.disconnect();
                            gainNodes[index].disconnect();
                        });
                        keyGainNode.disconnect();

                        delete activeOscillators[key];
                        delete activeGainNodes[key];
                        delete keyGainNodes[key];
                        updateMasterGain();
                    }
                };
            });
        }
    }

    function playNote(key) {
        // create oscillator
        const freq = getFrequencyForKey(key);
        if (freq === undefined) return;
        const [oscs, gainNodes, keyGainNode] = createSynth(freq);
        // store references to lists of oscillators and gain nodes for this key
        activeOscillators[key] = oscs;
        activeGainNodes[key] = gainNodes;
        keyGainNodes[key] = keyGainNode;
        // adjust master gain based on number of active notes
        updateMasterGain();
        // start oscillator and apply envelope
        oscs.forEach((osc, index) => {
            osc.start();
        });
        keyGainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.01); // attack
        keyGainNode.gain.setTargetAtTime(0.65, audioCtx.currentTime + 0.01, 0.05); // decay to sustain
    }

    // function to choose what type of synth (single, additive, am, fm, etc) and return arrays of oscillators and gain nodes
    // depends on current synth type selected by user
    function createSynth(freq) {
        const synthType = document.getElementById("synthTypeSelect").value;
        const keyGainNode = audioCtx.createGain();
        keyGainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        keyGainNode.connect(globalGain);
        if (synthType === "single") {
            //return two arrays, one of oscillators and one of gain nodes
            return singleSynth(freq, keyGainNode);
        } else if (synthType === "additive") {
            const additiveSynthType = document.getElementById("additiveSynthTypeSelect").value;
            let partialFreqs = [];
            let partialAmps = [];
            if (additiveSynthType === "odd") {
                for (let i = 1; i <= 10; i += 1) {
                    partialFreqs.push(freq * (2*i + 1));
                    partialAmps.push(1 / (i+1))
                }
            } else if (additiveSynthType === "even") {
                for (let i = 1; i <= 10; i += 1) {
                    partialFreqs.push(freq * (2*i));
                    partialAmps.push(1 / (i+1))
                }
            } else if (additiveSynthType === "all") {
                for (let i = 1; i <= 10; i += 1) {
                    partialFreqs.push(freq * (i+1));
                    partialAmps.push(1 / (i+1))
                }
            }
            return additiveSynth(freq, partialFreqs, partialAmps, keyGainNode);
        } else if (synthType === "am") {
            const modFreq = freq * Number(amFreq.value);
            const modIndex = Number(amIndex.value);
            return amSynth(freq, modFreq, modIndex, keyGainNode);
        } else if (synthType === "fm") {
            const modFreq = freq * Number(fmFreq.value);
            const modIndex = Number(fmIndex.value);
            return fmSynth(freq, modFreq, modIndex, keyGainNode);
        }

    }



    // function to create and return an oscillator and gainNode for a given frequency
    function singleSynth(freq, keyGainNode) {
        const osc = audioCtx.createOscillator();
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.type = waveTypes[currentWaveTypeIndex];

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
        osc.connect(gainNode).connect(keyGainNode);

        return [[osc], [gainNode], keyGainNode];
    }

    function additiveSynth(carrierFreq, partialFreqs, partialAmps, keyGainNode) {
        // carrier oscillator
        const oscs = [];
        const gainNodes = [];

        let sumAmps = 1.0; // start with carrier amplitude
        for (const a of partialAmps) {
            sumAmps += a;
        }
        const headroom = 1;
        const scale = headroom / sumAmps;

        const carrierOsc = audioCtx.createOscillator();
        carrierOsc.frequency.setValueAtTime(carrierFreq, audioCtx.currentTime);
        carrierOsc.type = waveTypes[currentWaveTypeIndex];

        // gain node for carrier
        const carrierGain = audioCtx.createGain();
        carrierGain.gain.setValueAtTime(1.0 * scale, audioCtx.currentTime);
        carrierOsc.connect(carrierGain).connect(keyGainNode);

        oscs.push(carrierOsc);
        gainNodes.push(carrierGain);

        // partial oscillators
        for (let i = 0; i < partialFreqs.length; i++) {
            const partialOsc = audioCtx.createOscillator();
            partialOsc.frequency.setValueAtTime(partialFreqs[i], audioCtx.currentTime);
            partialOsc.type = waveTypes[currentWaveTypeIndex];
            const partialGain = audioCtx.createGain();
            partialGain.gain.setValueAtTime(partialAmps[i] * scale, audioCtx.currentTime);
            partialOsc.connect(partialGain).connect(keyGainNode);
            oscs.push(partialOsc);
            gainNodes.push(partialGain);
        }
        return [oscs, gainNodes, keyGainNode];
    }

    function amSynth(carrierFreq, modFreq, modIndex, keyGainNode) {
        const oscs = [];
        const gainNodes = [];
        
        const carrierOsc = audioCtx.createOscillator();
        carrierOsc.frequency.setValueAtTime(carrierFreq, audioCtx.currentTime);
        carrierOsc.type = waveTypes[currentWaveTypeIndex];

        const carrierGain = audioCtx.createGain();
        carrierGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        carrierOsc.connect(carrierGain).connect(keyGainNode);

        const modOsc = audioCtx.createOscillator();
        modOsc.frequency.setValueAtTime(modFreq, audioCtx.currentTime);
        modOsc.type = 'sine';

        const modGain = audioCtx.createGain();
        modGain.gain.setValueAtTime(modIndex * carrierFreq / modFreq, audioCtx.currentTime);
        modOsc.connect(modGain);
        modGain.connect(carrierGain.gain);

        oscs.push(carrierOsc, modOsc);
        gainNodes.push(carrierGain, modGain);
        return [oscs, gainNodes, keyGainNode];
    }

    function fmSynth(carrierFreq, modFreq, modIndex, keyGainNode) {
        const oscs = [];
        const gainNodes = [];

        const carrierOsc = audioCtx.createOscillator();
        carrierOsc.frequency.setValueAtTime(carrierFreq, audioCtx.currentTime);
        carrierOsc.type = waveTypes[currentWaveTypeIndex];

        const carrierGain = audioCtx.createGain();
        carrierGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        carrierOsc.connect(carrierGain).connect(keyGainNode);

        const modOsc = audioCtx.createOscillator();
        modOsc.frequency.setValueAtTime(modFreq, audioCtx.currentTime);
        modOsc.type = 'sine';

        const modGain = audioCtx.createGain();
        modGain.gain.setValueAtTime(modIndex * modFreq, audioCtx.currentTime);
        modOsc.connect(modGain);
        modGain.connect(carrierOsc.frequency);

        oscs.push(carrierOsc, modOsc);
        gainNodes.push(carrierGain, modGain);
        return [oscs, gainNodes, keyGainNode];
    }


});

