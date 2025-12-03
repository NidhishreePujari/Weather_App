class PremiumWeatherApp {
    constructor() {
        this.apiKey = 'YOUR_API_KEY';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
        this.airPollutionUrl = 'https://api.openweathermap.org/data/2.5/air_pollution';
        this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

        // DOM Elements
        this.cityInput = document.getElementById('city-input');
        this.searchBtn = document.getElementById('search-btn');
        this.cityName = document.getElementById('city-name');
        this.date = document.getElementById('date');
        this.tempValue = document.getElementById('temp-value');
        this.weatherCondition = document.getElementById('weather-condition');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('wind-speed');
        this.weatherIcon = document.getElementById('weather-icon');
        this.loadingScreen = document.getElementById('loading');
        this.heroCard = document.getElementById('hero-card');
        this.aqiValue = document.getElementById('aqi-value');
        this.aqiLabel = document.getElementById('aqi-label');
        this.aqiAdvice = document.getElementById('aqi-advice');
        this.sunriseTime = document.getElementById('sunrise-time');
        this.sunsetTime = document.getElementById('sunset-time');
        this.timelineProgress = document.getElementById('timeline-progress');
        this.sunPosition = document.getElementById('sun-position');
        this.dayLength = document.getElementById('day-length');
        this.clothingSuggestion = document.getElementById('clothing-suggestion');
        this.activitySuggestion = document.getElementById('activity-suggestion');
        this.healthSuggestion = document.getElementById('health-suggestion');

        // Section elements
        this.sections = {
            hero: document.getElementById('hero-section'),
            aqi: document.getElementById('aqi-section'),
            forecast: document.getElementById('forecast-section'),
            sun: document.getElementById('sun-section'),
            suggestions: document.getElementById('suggestions-section')
        };

        this.currentWeatherData = null;
        this.currentAirPollutionData = null;
        this.forecastData = null;

        this.initEventListeners();
        this.initScrollAnimations();
        this.initTiltEffect();
        this.getCurrentLocationWeather();
    }

    initEventListeners() {
        this.searchBtn.addEventListener('click', () => this.searchWeather());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWeather();
        });

        // Update background theme based on time of day
        setInterval(() => this.updateThemeBasedOnTime(), 300000); // Every 5 minutes
    }

    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        // Observe all sections
        Object.values(this.sections).forEach(section => {
            observer.observe(section);
        });
    }

    initTiltEffect() {
        // Add mouse move effect to hero card
        this.heroCard.addEventListener('mousemove', (e) => {
            const rect = this.heroCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateY = (x - centerX) / 20;
            const rotateX = (centerY - y) / 20;

            this.heroCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });

        this.heroCard.addEventListener('mouseleave', () => {
            this.heroCard.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    }

    updateThemeBasedOnTime() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 18) {
            document.body.classList.remove('dark-theme');
        } else {
            document.body.classList.add('dark-theme');
        }
    }

    async getCurrentLocationWeather() {
        if (navigator.geolocation) {
            try {
                this.showLoading();
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });

                const { latitude, longitude } = position.coords;
                await this.getWeatherByCoords(latitude, longitude);
            } catch (error) {
                console.log("Geolocation error or denied");
                this.hideLoading();
            }
        }
    }

    async getWeatherByCoords(lat, lon) {
        try {
            const response = await fetch(
                `${this.baseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
            );
            const data = await this.handleResponse(response);
            await this.displayWeatherInfo(data);

            // Get additional data
            await this.getAirPollutionData(lat, lon);
            await this.getForecastData(lat, lon);
        } catch (error) {
            this.handleError(error);
        }
    }

    async searchWeather() {
        const city = this.cityInput.value.trim();
        if (!city) {
            this.showError("Please enter a city name");
            return;
        }

        try {
            this.showLoading();
            const response = await fetch(
                `${this.baseUrl}?q=${city}&appid=${this.apiKey}&units=metric`
            );
            const data = await this.handleResponse(response);
            await this.displayWeatherInfo(data);

            // Get additional data
            await this.getAirPollutionData(data.coord.lat, data.coord.lon);
            await this.getForecastData(data.coord.lat, data.coord.lon);
        } catch (error) {
            this.handleError(error);
        }
    }

    async handleResponse(response) {
        if (!response.ok) {
            if (response.status === 404) throw new Error('City not found');
            else throw new Error(`API error: ${response.status}`);
        }
        return await response.json();
    }

    async getAirPollutionData(lat, lon) {
        try {
            const response = await fetch(
                `${this.airPollutionUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}`
            );

            if (!response.ok) throw new Error('Failed to fetch air pollution data');

            const data = await response.json();
            this.currentAirPollutionData = data;
            this.updateAQISection(data);
            this.updateSuggestions();
        } catch (error) {
            console.error('Error fetching air pollution data:', error);
        }
    }

    async getForecastData(lat, lon) {
        try {
            const response = await fetch(
                `${this.forecastUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
            );

            if (!response.ok) throw new Error('Failed to fetch forecast data');

            const data = await response.json();
            this.forecastData = data;
            this.updateForecastSection(data);
        } catch (error) {
            console.error('Error fetching forecast data:', error);
        }
    }

    updateAQISection(data) {
        if (!data || !data.list || !data.list[0]) return;

        const aqi = data.list[0].main.aqi;
        const components = data.list[0].components;

        // Update AQI display
        this.aqiValue.textContent = aqi;

        // Set AQI label and color based on value
        let label, className;
        switch (aqi) {
            case 1:
                label = 'Good';
                className = 'good';
                break;
            case 2:
                label = 'Moderate';
                className = 'moderate';
                break;
            case 3:
                label = 'Poor';
                className = 'poor';
                break;
            case 4:
                label = 'Very Poor';
                className = 'very-poor';
                break;
            case 5:
                label = 'Hazardous';
                className = 'hazardous';
                break;
            default:
                label = 'Unknown';
                className = 'moderate';
        }

        this.aqiLabel.textContent = label;
        this.aqiLabel.className = `aqi-label ${className}`;

        // Generate health advice based on AQI
        let advice = '';
        switch (aqi) {
            case 1:
                advice = 'Air quality is satisfactory, and air pollution poses little or no risk.';
                break;
            case 2:
                advice = 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern.';
                break;
            case 3:
                advice = 'Members of sensitive groups should consider limiting prolonged outdoor exertion.';
                break;
            case 4:
                advice = 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.';
                break;
            case 5:
                advice = 'Health alert: everyone may experience more serious health effects.';
                break;
            default:
                advice = 'Air quality information is not available.';
        }

        this.aqiAdvice.textContent = advice;

        // Show AQI section after animation
        setTimeout(() => {
            this.sections.aqi.classList.add('active');
        }, 500);
    }

    updateForecastSection(data) {
        if (!data || !data.list) return;

        // Get 5 days of forecast (one per day at noon)
        const dailyForecasts = [];
        const now = new Date();

        for (let i = 0; i < 5; i++) {
            const targetDate = new Date();
            targetDate.setDate(now.getDate() + i);

            // Find forecast for around noon of each day
            const dayForecasts = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt * 1000);
                return forecastDate.getDate() === targetDate.getDate() &&
                    forecastDate.getHours() >= 11 && forecastDate.getHours() <= 13;
            });

            if (dayForecasts.length > 0) {
                dailyForecasts.push(dayForecasts[0]);
            } else {
                // Fallback: get any forecast for the day
                const fallbackForecasts = data.list.filter(forecast => {
                    const forecastDate = new Date(forecast.dt * 1000);
                    return forecastDate.getDate() === targetDate.getDate();
                });

                if (fallbackForecasts.length > 0) {
                    dailyForecasts.push(fallbackForecasts[0]);
                }
            }
        }

        dailyForecasts.forEach((forecast, index) => {
            if (forecast) {
                const dayElement = document.getElementById(`forecast-day-${index + 1}`);
                const date = new Date(forecast.dt * 1000);

                // Update day name
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                dayElement.querySelector('.day').textContent = dayNames[date.getDay()];

                // Update temperature
                dayElement.querySelector('.forecast-temp').textContent =
                    `${Math.round(forecast.main.temp)}°C`;

                // Update icon
                const iconElement = dayElement.querySelector('.forecast-icon');
                iconElement.src = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`;
                iconElement.alt = forecast.weather[0].description;
            }
        });

        // Show forecast section after animation
        setTimeout(() => {
            this.sections.forecast.classList.add('active');
        }, 700);
    }

    updateSunTimeline(data) {
        if (!data || !data.sys) return;

        const sunrise = new Date(data.sys.sunrise * 1000);
        const sunset = new Date(data.sys.sunset * 1000);
        const now = new Date();

        // Format sunrise and sunset times
        this.sunriseTime.textContent = sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.sunsetTime.textContent = sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Calculate day length
        const dayDuration = (sunset - sunrise) / (1000 * 60 * 60); // in hours
        const dayHours = Math.floor(dayDuration);
        const dayMinutes = Math.round((dayDuration - dayHours) * 60);
        this.dayLength.textContent = `${dayHours}h ${dayMinutes}m`;

        // Calculate current position in the day
        const dayStart = sunrise.getTime();
        const dayEnd = sunset.getTime();
        const dayLengthMs = dayEnd - dayStart;
        const nowTime = now.getTime();

        // Calculate percentage (0-100) of how far we are through the day
        let progressPercent = 0;
        if (nowTime < dayStart) {
            progressPercent = 0; // Before sunrise
        } else if (nowTime > dayEnd) {
            progressPercent = 100; // After sunset
        } else {
            progressPercent = ((nowTime - dayStart) / dayLengthMs) * 100;
        }

        // Update the timeline progress and sun position
        this.timelineProgress.style.width = `${progressPercent}%`;
        this.sunPosition.style.left = `${progressPercent}%`;

        // Show sun section after animation
        setTimeout(() => {
            this.sections.sun.classList.add('active');
        }, 900);
    }

    generateSuggestions(temperature, condition, humidity, windSpeed, aqi) {
        // Clothing suggestions based on temperature and condition
        let clothingSuggestion = '';
        if (temperature > 30) {
            clothingSuggestion = 'Light, breathable fabrics. Sun hat and sunglasses recommended.';
        } else if (temperature > 20) {
            clothingSuggestion = 'Light jacket or sweater. Comfortable casual wear.';
        } else if (temperature > 10) {
            clothingSuggestion = 'Warm jacket, long pants, and a light sweater.';
        } else if (temperature > 0) {
            clothingSuggestion = 'Winter coat, scarf, gloves, and warm layers.';
        } else {
            clothingSuggestion = 'Heavy winter coat, warm layers, insulated clothing.';
        }

        // Add weather-specific clothing
        if (condition.includes('rain') || condition.includes('shower')) {
            clothingSuggestion += ' Bring an umbrella and waterproof footwear.';
        } else if (condition.includes('snow')) {
            clothingSuggestion += ' Waterproof boots and cold-weather gear.';
        } else if (condition.includes('storm')) {
            clothingSuggestion += ' Stay dry with rain gear.';
        }

        // Activity suggestions
        let activitySuggestion = '';
        if (condition.includes('rain') || condition.includes('storm')) {
            activitySuggestion = 'Indoor activities recommended. Avoid outdoor exercise.';
        } else if (condition.includes('snow')) {
            activitySuggestion = 'Winter sports are possible, but take safety precautions.';
        } else if (temperature > 30 || temperature < 0) {
            activitySuggestion = 'Limit outdoor activities. Exercise indoors.';
        } else if (humidity > 80) {
            activitySuggestion = 'High humidity. Plan light activities and stay hydrated.';
        } else {
            activitySuggestion = 'Great day for outdoor activities. Enjoy responsibly.';
        }

        // Health suggestions based on AQI and temperature
        let healthSuggestion = '';
        if (aqi === 5) {
            healthSuggestion = 'Avoid all outdoor activities. Use air purifier indoors.';
        } else if (aqi === 4) {
            healthSuggestion = 'Wear N95 masks if going outside. Avoid prolonged outdoor exposure.';
        } else if (aqi === 3) {
            healthSuggestion = 'Sensitive individuals should limit outdoor activities.';
        } else if (temperature > 35) {
            healthSuggestion = 'Stay hydrated and avoid sun exposure during peak hours.';
        } else if (temperature < -5) {
            healthSuggestion = 'Protect yourself from frostbite. Dress warmly in layers.';
        } else {
            healthSuggestion = 'Weather conditions are generally safe. Enjoy your day.';
        }

        return { clothingSuggestion, activitySuggestion, healthSuggestion };
    }

    updateSuggestions() {
        if (!this.currentWeatherData) return;

        const { main, weather, wind } = this.currentWeatherData;
        const temperature = main.temp;
        const condition = weather[0].main.toLowerCase();
        const humidity = main.humidity;
        const windSpeed = wind.speed;

        // Get AQI value
        let aqi = 2; // Default to moderate if no data
        if (this.currentAirPollutionData && this.currentAirPollutionData.list[0]) {
            aqi = this.currentAirPollutionData.list[0].main.aqi;
        }

        const { clothingSuggestion, activitySuggestion, healthSuggestion } =
            this.generateSuggestions(temperature, condition, humidity, windSpeed, aqi);

        this.clothingSuggestion.textContent = clothingSuggestion;
        this.activitySuggestion.textContent = activitySuggestion;
        this.healthSuggestion.textContent = healthSuggestion;

        // Show suggestions section after animation
        setTimeout(() => {
            this.sections.suggestions.classList.add('active');
        }, 1100);
    }

    async displayWeatherInfo(data) {
        this.currentWeatherData = data;

        // Update UI with weather data
        this.cityName.textContent = `${data.name}, ${data.sys.country}`;
        this.tempValue.textContent = Math.round(data.main.temp);
        this.weatherCondition.textContent = data.weather[0].description;
        this.humidity.textContent = `${data.main.humidity}%`;
        this.windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;

        // Format date
        const now = new Date();
        this.date.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Set weather icon
        const iconCode = data.weather[0].icon;
        this.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        this.weatherIcon.alt = data.weather[0].description;

        // Update background based on weather condition
        this.updateBackground(data.weather[0].main.toLowerCase());

        // Update sun timeline
        this.updateSunTimeline(data);

        // Update suggestions
        this.updateSuggestions();

        // Hide loading after animation
        setTimeout(() => {
            this.hideLoading();
        }, 1000);
    }

    updateBackground(weatherCondition) {
        // Remove all weather classes first
        document.body.classList.remove('sunny', 'rainy', 'snowy', 'cloudy', 'thunderstorm');

        // Add appropriate class based on weather condition
        if (weatherCondition.includes('clear')) {
            document.body.classList.add('sunny');
        } else if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
            document.body.classList.add('rainy');
        } else if (weatherCondition.includes('snow')) {
            document.body.classList.add('snowy');
        } else if (weatherCondition.includes('cloud')) {
            document.body.classList.add('cloudy');
        } else if (weatherCondition.includes('thunderstorm')) {
            document.body.classList.add('thunderstorm');
        }
    }

    showLoading() {
        this.loadingScreen.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingScreen.classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        alert(message); // Simple error display for demo
    }

    handleError(error) {
        this.hideLoading();
        if (error.message === 'City not found') {
            this.showError('City not found. Please enter a valid city name.');
        } else {
            console.error('Error:', error);
            this.showError('An error occurred while fetching weather data. Please try again later.');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PremiumWeatherApp();
});