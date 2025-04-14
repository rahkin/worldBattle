export class OpenWeatherMapService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
        this.lastUpdate = 0;
        this.updateInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.currentWeather = null;
    }

    async getWeather(latitude, longitude) {
        const now = Date.now();
        
        // Only fetch new data if enough time has passed since last update
        if (now - this.lastUpdate < this.updateInterval && this.currentWeather) {
            return this.currentWeather;
        }

        try {
            const response = await fetch(
                `${this.baseUrl}?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.currentWeather = this.mapWeatherData(data);
            this.lastUpdate = now;
            
            return this.currentWeather;
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return null;
        }
    }

    mapWeatherData(data) {
        // Map OpenWeatherMap weather codes to our weather types
        const weatherCode = data.weather[0].id;
        let weatherType = 'clear';
        
        if (weatherCode >= 200 && weatherCode < 300) {
            weatherType = 'storm';
        } else if (weatherCode >= 300 && weatherCode < 600) {
            weatherType = 'rain';
        } else if (weatherCode >= 600 && weatherCode < 700) {
            weatherType = 'snow';
        } else if (weatherCode >= 700 && weatherCode < 800) {
            weatherType = 'foggy';
        } else if (weatherCode >= 800) {
            if (weatherCode === 800) {
                weatherType = 'clear';
            } else if (weatherCode === 801) {
                weatherType = 'cloudy';
            } else {
                weatherType = 'cloudy';
            }
        }

        return {
            type: weatherType,
            temperature: data.main.temp,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            windDirection: data.wind.deg,
            description: data.weather[0].description
        };
    }
} 