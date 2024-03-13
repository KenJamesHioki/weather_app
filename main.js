class WeatherApp {
  constructor() {
    this.apiKey = '16806dd9a591b25a5beebeb69dd718b8';
    this.coordinates = {};
    this.weatherInfo = {};
    this._init();
  }
  
  // フォームの送信を発火イベントとする
  _init() {
    const searchForm = document.querySelector('.weather__search-form');
    searchForm.addEventListener('submit', () => this._updateLocation(event));
  }
  
  // ユーザーが入力した都市名を取得しそれをgetCoordinatesに渡す
  async _updateLocation(event) {
    event.preventDefault();
    console.log('initialize');
    const locationInput = document.querySelector('.weather__textbox').value;
    console.log(locationInput);
    await this._getCoordinates(locationInput);
  }
  
  // 都市名を元に緯度経度をAPIで取得する。緯度経度をgetWeatherに渡す
  async _getCoordinates(location) {
    const coordResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${this.apiKey}`);
    const coordObj = await coordResponse.json();
    console.log(coordObj);
    this.coordinates = {
      lat: coordObj[0].lat,
      lon: coordObj[0].lon,
    }
    await this._getWeather(this.coordinates);
  }
  
  // 緯度経度を元に天気情報をAPIで取得する。気温、天気、風速を格納。
  async _getWeather(coordinates) {
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=metric&lang=ja`);
    const weatherObj = await weatherResponse.json();
    console.log(weatherObj);
    this.weatherInfo = {
      temp: weatherObj.main.temp,
      location: weatherObj.name,
      weatherMain: weatherObj.weather[0].main,
      weatherDesc: weatherObj.weather[0].description,
      weatherIcon: weatherObj.weather[0].icon,
      wind: weatherObj.wind.speed,
    }
    console.log(this.weatherInfo);
    this._renderWeatherInfos();
  }

  _renderWeatherInfos() {
    const weatherResult = document.querySelector('.weather__result');
    const locationHtml =this._renderResultLocation();
    const tempHtml = this._renderTempInfo();
    const weatherHtml = this._renderWeatherInfo();
    const windHtml = this._renderWindInfo();
    weatherResult.innerHTML = locationHtml + tempHtml + weatherHtml + windHtml;
  }

  _renderResultLocation() {
    const locationHtml = `
    <p class="weather__result-location">
    ${this.weatherInfo.location}の天気
    </p>
    `
    return locationHtml;
  }

  _renderTempInfo() {
    const tempHtml = `
    <div class="weather-info" id="temp">
      <p class="weather-info-title">気温</p>
      <div class="weather-info-data">
        <p class="weather-info-main">${this.weatherInfo.temp}℃</p>
      </div>
    </div>
    `
    return tempHtml
  }

  _renderWeatherInfo() {
    const weatherHtml = `
    <div class="weather-info" id="weather">
      <p class="weather-info-title">天気</p>
      <div class="weather-info-data">
       <img class="weather-info-icon" src="https://openweathermap.org/img/wn/${this.weatherInfo.weatherIcon}@2x.png">
       <p class="weather-info-sub">${this.weatherInfo.weatherDesc}</p>
      </div>
    </div>
    `
    return weatherHtml;
  }

  _renderWindInfo() {
    const windHtml = `
    <div class="weather-info" id="wind">
      <p class="weather-info-title">風速</p>
      <div class="weather-info-data">
        <p class="weather-info-main">${this.weatherInfo.wind}m/s</p>
      </div>
    </div>
    `
    return windHtml;
  }


  
}

new WeatherApp();


// const apiKey = '16806dd9a591b25a5beebeb69dd718b8';
// let coordinates = {};
// let weatherInfo = {};

// // テキストボックスにユーザーが都市名を入力し、検索をクリックすると入力した都市名の文字列を取得する
// const searchForm = document.querySelector('.weather__search-form');
// searchForm.addEventListener('submit', () => init(event));

// async function init(event) {
//   event.preventDefault();
//   console.log('initialize');
//   const locationInput = document.querySelector('.weather__textbox').value;
//   console.log(locationInput);
//   await getCoordinates(locationInput);
// };

// // 都市名をgetCoordinatesに渡し、緯度経度をAPIで取得する（緯度経度をreturn）
// async function getCoordinates(location) {
//   const coordResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${apiKey}`);
//   const coordObj = await coordResponse.json();
//   console.log(coordObj);
//   coordinates = {
//     lat: coordObj[0].lat,
//     lon: coordObj[0].lon,
//   }
//   await getWeather(coordinates);
// }

// //緯度経度をgetWeatherに渡し、天気情報をAPIで取得する（気温、天気、風速をreturn）
// async function getWeather(coordinates) {
//   const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${apiKey}&units=metric&lang=ja`);
//   const weatherObj = await weatherResponse.json();
//   console.log(weatherObj);
//   weatherInfo = {
//     temp: weatherObj.main.temp,
//     weather: weatherObj.weather[0].main,
//     wind: weatherObj.wind.speed,
//   }
//   console.log(weatherInfo);
// }

// // getWeatherで取得した天気情報とユーザーが入力した都市名をDOMに反映する