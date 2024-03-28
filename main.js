class WeatherApp {
  constructor() {
    this.coordinates = {};
    this.weatherInfo = {};
    this._init();
  }

  _init() {
    const searchForm = document.querySelector('.weather__search-form');
    searchForm.addEventListener('submit', () => this._checkLocation(event));
  }

  async _checkLocation(event) {
    event.preventDefault();
    const locationInput = document.querySelector('.weather__textbox').value;

    if (!locationInput) {
      return;
    }

    await this._getCoordinates(locationInput);
  }

  async _getCoordinates(location) {
    try {
      this._startLoading();
      const coordResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=10&appid=${APIKEY}`);

      if (!coordResponse.ok) {
        this._errorThower(coordResponse.status);
      }

      const coordArr = await coordResponse.json();

      if (coordArr.length === 0) {
        throw new ErrorNoCity('都市が見つかりませんでした。')
      }

      if (coordArr.length >= 2) {
        this._getMultiLocationNames(coordArr);
        return;
      }

      this.coordinates = {
        lat: coordArr[0].lat,
        lon: coordArr[0].lon,
      }

      await this._getWeather(this.coordinates);

    } catch (e) {
      this._resetHtml();
      new ErrorHandler(e);

    } finally {
      this._endLoading();
    }

  }

  _getMultiLocationNames(coordArr) {
    const multiLoc = coordArr.map(location => this._extractLocInfo(location));
    const multiLocUnique = this._removeDuplicateLocs(multiLoc)

    if (multiLocUnique.length === 1) {
      this._getWeather(multiLocUnique);

    } else {
      this._renderMultiLoc(multiLocUnique);
    }
  }

  //都市の日本語名が表示可能な場合は日本語名の表示を優先し、なければ英語名を表示する
  _extractLocInfo(location) {
    const locInfo = {
      name: location.name,
      lat: location.lat,
      lon: location.lon,
    }
    if (location.local_names && location.local_names.ja) {
      locInfo.name = location.local_names.ja;
    }
    return locInfo;
  }

  _removeDuplicateLocs(multiLoc) {
    const multiLocMap = Array.from(new Map(multiLoc.map(location => [location.name, location])));
    return multiLocMap.map(location => location[1]);
  }

  _renderMultiLoc(locations) {
    const ul = document.createElement('ul');
    ul.classList.add('weather__ul');

    const multiLocMessage = document.createElement('p');
    multiLocMessage.classList.add('weather__multi-location-message');
    multiLocMessage.textContent = '候補が複数見つかりました：'

    let liHtml = '';
    locations.forEach(location => {
      liHtml += `
      <li class="weather__li" data-lon="${location.lon}" data-lat="${location.lat}"><a href="#">${location.name}</a></li>
      `
    });

    ul.innerHTML = liHtml;
    this._resetHtml();
    const multiLocElm = document.querySelector('.weather__multi-locations');
    multiLocElm.appendChild(multiLocMessage);
    multiLocElm.appendChild(ul);
    this._chooseLocation();
  }

  _chooseLocation() {
    const weatherLis = document.querySelectorAll('.weather__li');
    weatherLis.forEach(li => {
      const liLat = li.dataset.lat;
      const liLon = li.dataset.lon;
      li.addEventListener('click', this._getWeather.bind(this, {
        lat: liLat,
        lon: liLon,
      }));
    });
  }

  async _getWeather(coordinates) {
    try {
      this._startLoading();

      const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${APIKEY}&units=metric&lang=ja`);

      if (!weatherResponse.ok) {
        this._errorThower(weatherResponse.status)
      }

      const weatherObj = await weatherResponse.json();
      this.weatherInfo = {
        temp: weatherObj.main.temp,
        location: weatherObj.name,
        weatherDesc: weatherObj.weather[0].description,
        weatherIcon: weatherObj.weather[0].icon,
        wind: weatherObj.wind.speed,
      }
      this._renderWeatherInfos();

    } catch (e) {
      this._resetHtml();
      new ErrorHandler(e);

    } finally {
      this._endLoading();
    }
  }

  _renderWeatherInfos() {
    this._resetHtml();
    const weatherResult = document.querySelector('.weather__result');
    const locationHtml = this._renderResultLocation();
    const tempHtml = this._renderTempInfo();
    const weatherHtml = this._renderWeatherInfo();
    const windHtml = this._renderWindInfo();
    weatherResult.innerHTML = locationHtml + tempHtml + weatherHtml + windHtml;
  }

  _renderResultLocation() {
    return `
    <p class="weather__result-location">
    ${this.weatherInfo.location}の天気
    </p>
    `;
  }

  _renderTempInfo() {
    return `
    <div class="weather-info" id="temp">
      <p class="weather-info-title">気温</p>
      <div class="weather-info-data">
        <p class="weather-info-main">${this.weatherInfo.temp}℃</p>
      </div>
    </div>
    `;
  }

  _renderWeatherInfo() {
    return `
    <div class="weather-info" id="weather">
      <p class="weather-info-title">天気</p>
      <div class="weather-info-data">
        <div class="weather-info-icon-container">
          <img class="weather-info-icon" src="https://openweathermap.org/img/wn/${this.weatherInfo.weatherIcon}@2x.png">
        </div>
        <p class="weather-info-sub">${this.weatherInfo.weatherDesc}</p>
      </div>
    </div>
    `;
  }

  _renderWindInfo() {
    return `
    <div class="weather-info" id="wind">
      <p class="weather-info-title">風速</p>
      <div class="weather-info-data">
        <p class="weather-info-main">${this.weatherInfo.wind}m/s</p>
      </div>
    </div>
    `;
  }

  //TODOエラー系のメソッドはWeatherAppクラスから出せそう
  _errorThower(status) {
    switch (status) {
      case 401:
        throw new Error400('エラーコード：401');
      case 404:
        throw new Error400('エラーコード：404');
      case 429:
        throw new Error400('エラーコード：429');
      case 500, 502, 503, 504:
        throw new Error('エラーコード：500~504');
      default:
        throw new Error('処理ができませんでした。');
    }
  }

  _resetHtml() {
    const multiLocEml = document.querySelector('.weather__multi-locations');
    const resultElm = document.querySelector('.weather__result');
    multiLocEml.innerHTML = '';
    resultElm.innerHTML = '';
  }

  _startLoading() {
    const loader = document.querySelector('.loader');
    loader.classList.add('loading');
  }

  _endLoading() {
    const loader = document.querySelector('.loader');
    loader.classList.remove('loading');
  }
}

const APIKEY = CONFIG.APIKEY;

new WeatherApp();