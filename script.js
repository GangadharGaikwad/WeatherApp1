const apiKey = '';
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const weatherIcon = document.querySelector('.weather-icon');
const temperature = document.querySelector('.temperature');
const description = document.querySelector('.description');
const city = document.querySelector('.city');
const humidity = document.querySelector('.humidity');
const windSpeed = document.querySelector('.wind-speed');
const dateTime = document.querySelector('.date-time');
const feelsLike = document.querySelector('.feels-like');
const pressure = document.querySelector('.pressure');
const recentList = document.querySelector('.recent-list');
const forecastContainer = document.querySelector('.forecast-container');
const unitButtons = document.querySelectorAll('.unit-btn');
const themeBtn = document.querySelector('.theme-btn');
const aqi = document.querySelector('.aqi');
const aqiText = document.querySelector('.aqi-text');
const mainWeather = document.querySelector('.main-weather');
const sunrise = document.querySelector('.sunrise');
const sunset = document.querySelector('.sunset');

// Air quality
const AQI_LEVELS = {
    GOOD: { range: [0, 50], level: 'Good', color: '#00b894' },
    MODERATE: { range: [51, 100], level: 'Moderate', color: '#7bed9f' },
    UNHEALTHY_SENSITIVE: { range: [101, 150], level: 'Unhealthy', color: '#fdcb6e' },
    UNHEALTHY: { range: [151, 200], level: 'Poor', color: '#e17055' },
    VERY_UNHEALTHY: { range: [201, 300], level: 'Very Poor', color: '#d63031' },
    HAZARDOUS: { range: [301, 500], level: 'Hazardous', color: '#6c5ce7' }
};

let currentTemp = 0;
let currentFeelsLike = 0;
let currentUnit = 'celsius';
const MAX_RECENT_SEARCHES = 5;

let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
let currentTheme = localStorage.getItem('theme') || 'dark';

// Theme
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
}

function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
}

function updateRecentSearches(cityName) {
    if (!recentSearches.includes(cityName)) {
        recentSearches.unshift(cityName);
        if (recentSearches.length > MAX_RECENT_SEARCHES) {
            recentSearches.pop();
        }
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
        displayRecentSearches();
    }
}

function displayRecentSearches() {
    recentList.innerHTML = recentSearches
        .map(city => `<li onclick="getWeather('${city}')">${city}</li>`)
        .join('');
}

function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    dateTime.textContent = now.toLocaleDateString('en-US', options);
}

function convertTemperature(temp, unit) {
    if (unit === 'fahrenheit') {
        return (temp * 9/5) + 32;
    }
    return temp;
}

function updateTemperatureDisplay() {
    const temp = convertTemperature(currentTemp, currentUnit);
    const feels = convertTemperature(currentFeelsLike, currentUnit);
    const unit = currentUnit === 'celsius' ? '°C' : '°F';
    
    temperature.textContent = `${Math.round(temp)}${unit}`;
    feelsLike.textContent = `${Math.round(feels)}${unit}`;
}

async function getForecast(cityName) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=metric&appid=${apiKey}`
        );
        
        if (!response.ok) throw new Error('Forecast data not available');
        
        const data = await response.json();
        const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));
        
        forecastContainer.innerHTML = dailyForecasts
            .slice(0, 5)
            .map(day => {
                const temp = convertTemperature(day.main.temp, currentUnit);
                const unit = currentUnit === 'celsius' ? '°C' : '°F';
                const date = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
                
                return `
                    <div class="forecast-card">
                        <p>${date}</p>
                        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="weather icon">
                        <p class="forecast-temp">${Math.round(temp)}${unit}</p>
                        <p class="forecast-desc">${day.weather[0].description}</p>
                    </div>
                `;
            })
            .join('');
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
}

function getAQILevel(aqi) {
    for (const [level, data] of Object.entries(AQI_LEVELS)) {
        if (aqi >= data.range[0] && aqi <= data.range[1]) {
            return { level: data.level, color: data.color };
        }
    }
    return { level: 'Unknown', color: '#666' };
}

async function getAirQuality(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        
        if (!response.ok) throw new Error('Air quality data not available');
        
        const data = await response.json();
        const pollutants = data.list[0].components;
        const pm25 = pollutants.pm2_5;
        let aqiValue;
        
        // PM2.5 to AQI conversion
        if (pm25 <= 12.0) {
            aqiValue = Math.round((50 - 0) * (pm25 - 0) / (12.0 - 0) + 0);
        } else if (pm25 <= 35.4) {
            aqiValue = Math.round((100 - 51) * (pm25 - 12.1) / (35.4 - 12.1) + 51);
        } else if (pm25 <= 55.4) {
            aqiValue = Math.round((150 - 101) * (pm25 - 35.5) / (55.4 - 35.5) + 101);
        } else if (pm25 <= 150.4) {
            aqiValue = Math.round((200 - 151) * (pm25 - 55.5) / (150.4 - 55.5) + 151);
        } else if (pm25 <= 250.4) {
            aqiValue = Math.round((300 - 201) * (pm25 - 150.5) / (250.4 - 150.5) + 201);
        } else {
            aqiValue = Math.round((500 - 301) * (pm25 - 250.5) / (500.4 - 250.5) + 301);
        }
        
        const aqiInfo = getAQILevel(aqiValue);
        
        aqi.textContent = aqiValue;
        aqiText.textContent = aqiInfo.level;
        aqi.style.color = aqiInfo.color;
        aqiText.style.color = aqiInfo.color;
        
    } catch (error) {
        console.error('Error fetching air quality:', error);
        aqi.textContent = 'N/A';
        aqiText.textContent = 'Unavailable';
        aqi.style.color = '#666';
        aqiText.style.color = '#666';
    }
}

function updateWeatherAnimation(weatherCode) {
    const existingAnimation = mainWeather.querySelector('.weather-animation');
    if (existingAnimation) {
        existingAnimation.remove();
    }

    const animation = document.createElement('div');
    animation.className = 'weather-animation';

    if (weatherCode.includes('rain') || weatherCode.includes('drizzle')) {
        animation.classList.add('rain');
    } else if (weatherCode.includes('clear')) {
        animation.classList.add('clear');
    } else if (weatherCode.includes('cloud')) {
        animation.classList.add('clouds');
    } else if (weatherCode.includes('snow')) {
        animation.classList.add('snow');
    }

    mainWeather.appendChild(animation);
}

// Function to format time from Unix timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

async function getWeather(cityName) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${apiKey}`
        );
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        const data = await response.json();

        currentTemp = data.main.temp;
        currentFeelsLike = data.main.feels_like;

        updateTemperatureDisplay();
        description.textContent = data.weather[0].description;
        city.textContent = data.name;
        humidity.textContent = `${data.main.humidity}%`;
        windSpeed.textContent = `${data.wind.speed} m/s`;
        pressure.textContent = `${data.main.pressure} hPa`;

        sunrise.textContent = formatTime(data.sys.sunrise);
        sunset.textContent = formatTime(data.sys.sunset);
        
        const iconCode = data.weather[0].icon;
        weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        
        updateWeatherAnimation(data.weather[0].main.toLowerCase());
        
        await getAirQuality(data.coord.lat, data.coord.lon);
        
        updateRecentSearches(data.name);
        
        getForecast(cityName);

        updateDateTime();

        searchInput.value = '';
        
    } catch (error) {
        alert('Please enter a valid city name');
    }
}

// Event listeners
searchButton.addEventListener('click', () => {
    const cityName = searchInput.value.trim();
    if (cityName) {
        getWeather(cityName);
    }
});

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const cityName = searchInput.value.trim();
        if (cityName) {
            getWeather(cityName);
        }
    }
});

unitButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (button.dataset.unit !== currentUnit) {
            currentUnit = button.dataset.unit;
            unitButtons.forEach(btn => btn.classList.toggle('active'));
            updateTemperatureDisplay();
            // Update forecast display
            const cityName = city.textContent;
            if (cityName) {
                getForecast(cityName);
            }
        }
    });
});

themeBtn.addEventListener('click', toggleTheme);

// Initialize
window.addEventListener('load', () => {
    initTheme();
    getWeather('London');
    displayRecentSearches();
    setInterval(updateDateTime, 60000);
}); 
