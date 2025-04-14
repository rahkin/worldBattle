export class AudioSystem {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.currentTrack = null;
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.volume = 0.2;
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = this.volume;
        this.jamendoClientId = 'a44cf13c';
        this.jamendoClientSecret = 'c41d02841c1f66597447b72454855a9a';
        this.jamendoBaseUrl = 'https://api.jamendo.com/v3.0';
        this.accessToken = null;
        this.audioBuffer = null;
    }

    async authenticate() {
        try {
            const response = await fetch('https://api.jamendo.com/v3.0/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.jamendoClientId,
                    client_secret: this.jamendoClientSecret
                })
            });

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            console.log('Successfully authenticated with Jamendo API');
        } catch (error) {
            console.error('Error authenticating with Jamendo API:', error);
            throw error;
        }
    }

    async fetchJamendoPlaylist(genre, limit = 10) {
        try {
            // Stop any currently playing track before fetching new playlist
            this.stopTrack();
            
            console.log(`Fetching playlist for genre: ${genre}`);
            const response = await fetch(
                `${this.jamendoBaseUrl}/tracks/?client_id=${this.jamendoClientId}&format=json&limit=${limit}&tags=${genre}&include=musicinfo&groupby=artist_id`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                console.warn('No tracks found for genre:', genre);
                return [];
            }
            
            this.playlist = data.results.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artist_name,
                url: track.audio,
                duration: track.duration
            }));
            
            return this.playlist;
        } catch (error) {
            console.error('Error fetching Jamendo playlist:', error);
            return [];
        }
    }

    async playTrack(index) {
        if (index < 0 || index >= this.playlist.length) {
            return;
        }

        try {
            // Stop any currently playing track
            this.stopTrack();

            // Fetch and decode the audio
            const track = this.playlist[index];
            const response = await fetch(track.url);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Create and start the new track
            this.currentTrack = this.audioContext.createBufferSource();
            this.currentTrack.buffer = this.audioBuffer;
            this.currentTrack.connect(this.gainNode);
            
            // Set up track end handler
            this.currentTrack.onended = () => {
                if (this.isPlaying) {
                    const nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
                    this.playTrack(nextIndex);
                }
            };
            
            // Start playback
            this.currentTrack.start(0);
            this.isPlaying = true;
            this.currentTrackIndex = index;
        } catch (error) {
            console.error('Error playing track:', error);
            this.stopTrack();
        }
    }

    stopTrack() {
        if (this.currentTrack) {
            try {
                this.currentTrack.stop();
            } catch (e) {
                // Ignore errors from stopping already stopped tracks
            }
            this.currentTrack = null;
            this.audioBuffer = null;
            this.isPlaying = false;
        }
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }
} 