document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const languageDirection = document.getElementById('languageDirection');
    const startBtn = document.getElementById('start');
    const stopBtn = document.getElementById('stop');
    const sourceTextArea = document.getElementById('sourceText');
    const targetTextArea = document.getElementById('targetText');
    const downloadSourceBtn = document.getElementById('downloadSource');
    const downloadTargetBtn = document.getElementById('downloadTarget');
    const downloadAudioBtn = document.getElementById('downloadAudio');
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const sourceLabel = document.getElementById('sourceLabel');
    const targetLabel = document.getElementById('targetLabel');
    const backendStatus = document.getElementById('backendStatus');

    // State variables
    let recognition;
    let mediaRecorder;
    let audioChunks = [];
    let fullSourceText = '';
    let translatedText = '';

    // Initialize UI
    updateUI();

    // Update UI based on language direction
    function updateUI() {
        const direction = languageDirection.value;
        if (direction === 'fr-en') {
            heroTitle.textContent = 'Live French to English Translator';
            heroSubtitle.textContent = 'Real-time speech transcription, translation, and recording for seamless communication.';
            sourceLabel.innerHTML = '<span class="emoji">🎧</span> French Transcript';
            targetLabel.innerHTML = '<span class="emoji">🌐</span> English Translation';
            downloadSourceBtn.textContent = 'Download French Transcript';
            downloadTargetBtn.textContent = 'Download English Translation';
        } else {
            heroTitle.textContent = 'Live English to French Translator';
            heroSubtitle.textContent = 'Transcription, traduction et enregistrement en temps réel pour une communication fluide.';
            sourceLabel.innerHTML = '<span class="emoji">🎧</span> English Transcript';
            targetLabel.innerHTML = '<span class="emoji">🌐</span> French Translation';
            downloadSourceBtn.textContent = 'Download English Transcript';
            downloadTargetBtn.textContent = 'Download French Translation';
        }
    }

    // Initialize speech recognition
    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = languageDirection.value === 'fr-en' ? 'fr-FR' : 'en-US';

            recognition.onresult = (event) => {
                let interimTranscript = '';
                fullSourceText = ''; // Reset full text to avoid duplication
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        fullSourceText += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                sourceTextArea.value = fullSourceText + interimTranscript;
                
                if (fullSourceText.trim()) {
                    translateText(fullSourceText);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                stopListening();
                alert('Speech recognition error: ' + event.error);
            };

            recognition.onend = () => {
                if (startBtn.disabled) {
                    // If stopped unexpectedly, restart
                    startListening();
                }
            };

            return true;
        } else {
            alert('Speech recognition not supported in this browser. Try Chrome or Edge.');
            return false;
        }
    }

    // Translate text using MyMemory API
    function translateText(text) {
        if (!text.trim()) return;
        
        const direction = languageDirection.value;
        const langPair = direction === 'fr-en' ? 'fr-FR|en-GB' : 'en-GB|fr-FR';
        
        targetTextArea.placeholder = 'Translating...';
        
        fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`)
            .then(res => res.json())
            .then(data => {
                if (data.responseData) {
                    targetTextArea.value = data.responseData.translatedText;
                } else {
                    targetTextArea.value = 'Translation error: No response from server';
                }
                targetTextArea.placeholder = 'Translation';
            })
            .catch(error => {
                console.error('Translation error:', error);
                targetTextArea.value = 'Translation error: ' + error.message;
                targetTextArea.placeholder = 'Translation';
            });
    }

    // Start recording and speech recognition
    function startListening() {
        if (!recognition && !initSpeechRecognition()) {
            return;
        }
        
        // Request microphone permission
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = (e) => {
                    audioChunks.push(e.data);
                };
                
                mediaRecorder.start();
                recognition.start();
                
                startBtn.disabled = true;
                stopBtn.disabled = false;
                backendStatus.textContent = 'Status: Listening...';
                backendStatus.className = 'online';
            })
            .catch(err => {
                console.error('Microphone access error:', err);
                alert('Could not access microphone. Please ensure you have granted microphone permissions.');
            });
    }

    // Stop recording and speech recognition
    function stopListening() {
        if (recognition) {
            recognition.stop();
        }
        
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        backendStatus.textContent = 'Status: Ready';
    }

    // Language direction change handler
    languageDirection.addEventListener('change', () => {
        updateUI();
        fullSourceText = '';
        translatedText = '';
        sourceTextArea.value = '';
        targetTextArea.value = '';
        
        stopListening();
    });

    // Download handlers
    downloadSourceBtn.addEventListener('click', () => {
        downloadText(sourceTextArea.value, 
                   languageDirection.value === 'fr-en' ? 'french_transcript.txt' : 'english_transcript.txt');
    });

    downloadTargetBtn.addEventListener('click', () => {
        downloadText(targetTextArea.value, 
                   languageDirection.value === 'fr-en' ? 'english_translation.txt' : 'french_translation.txt');
    });

    downloadAudioBtn.addEventListener('click', () => {
        if (audioChunks.length > 0) {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'recording.webm';
            a.click();
            URL.revokeObjectURL(url);
        } else {
            alert('No audio recorded yet!');
        }
    });

    // Helper function to download text
    function downloadText(content, filename) {
        if (!content.trim()) {
            alert('No content to download!');
            return;
        }
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Event listeners for buttons
    startBtn.addEventListener('click', startListening);
    stopBtn.addEventListener('click', stopListening);

    // Initialize backend status
    backendStatus.textContent = 'Status: Ready';
    backendStatus.className = 'online';
});