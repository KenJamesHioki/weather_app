class WeatherApp {
  constructor() {
    this.coordinates = {};
    this.weatherInfos = {};
    this._init();
  }

  _init() {
    const searchForm = document.querySelector('.weather__search-form');
    searchForm.addEventListener('submit', event => {
      const locationInput = document.querySelector('.weather__textbox').value;
      event.preventDefault();
      if (!locationInput) return;
      this._getCoordinates(locationInput);
    });
  }

  async _getCoordinates(location) {
    try {
      this._displayLoader();
      //TODO：Fetchを別のメソッドに切り出す
      const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=10&appid=${APIKEY}`);

      if (!response.ok) {
        this._errorThower(response.status);
      }

      const locationDetailsArray = await response.json();

      if (locationDetailsArray.length === 0) {
        throw new ErrorNoCity('都市が見つかりませんでした。')
      }

      if (locationDetailsArray.length >= 2) {
        this._getAllLocationNames(locationDetailsArray);
        return;
      }

      this.coordinates = {
        lat: locationDetailsArray[0].lat,
        lon: locationDetailsArray[0].lon,
      }

      await this._getWeather(this.coordinates);

    } catch (e) {
      this._resetHtml();
      new ErrorHandler(e);

    } finally {
      this._hideLoader();
    }

  }

  _getAllLocationNames(coordArr) {
    const allLocations = coordArr.map(location => this._extractLocationInfo(location));
    const uniqueLocations = this._discardIdenticalNamedLocations(allLocations)

    if (uniqueLocations.length === 1) {
      this._getWeather(uniqueLocations);

    } else {
      this._renderLocationSuggestions(uniqueLocations);
    }
  }

  //都市の日本語名が表示可能な場合は日本語名の表示を優先し、なければ英語名を表示する
  _extractLocationInfo(location) {
    const locationInfo = {
      name: location.name,
      lat: location.lat,
      lon: location.lon,
    }
    if (location.local_names && location.local_names.ja) {
      locationInfo.name = location.local_names.ja;
    }
    return locationInfo;
  }

  //重複した都市名を排除する
  _discardIdenticalNamedLocations(multiLoc) {
    const uniqueLocationsMap = Array.from(new Map(multiLoc.map(location => [location.name, location])));
    return uniqueLocationsMap.map(location => location[1]);
  }

  _renderLocationSuggestions(locations) {
    const ul = document.createElement('ul');
    ul.classList.add('weather__ul');

    const title = document.createElement('p');
    title.classList.add('weather__multi-location-message');
    title.textContent = '候補が複数見つかりました：'

    let liHtml = '';
    locations.forEach(location => {
      liHtml += `
      <li class="weather__li" data-lon="${location.lon}" data-lat="${location.lat}"><a href="#">${location.name}</a></li>
      `
    });

    ul.innerHTML = liHtml;
    this._resetHtml();
    const parentElm = document.querySelector('.weather__multi-locations');
    parentElm.appendChild(title);
    parentElm.appendChild(ul);

    this._chooseSuggestion();
  }

  _chooseSuggestion() {
    const suggestions = document.querySelectorAll('.weather__li');
    suggestions.forEach(suggestion => {
      const suggestionLat = suggestion.dataset.lat;
      const suggestionLon = suggestion.dataset.lon;
      suggestion.addEventListener('click', this._getWeather.bind(this, {
        lat: suggestionLat,
        lon: suggestionLon,
      }));
    });
  }

  async _getWeather(coordinates) {
    try {
      this._displayLoader();

      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${APIKEY}&units=metric&lang=ja`);

      if (!response.ok) {
        this._errorThower(response.status)
      }

      const weatherDetails = await response.json();
      this.weatherInfos = {
        temperature: weatherDetails.main.temperature,
        location: weatherDetails.name,
        weatherDescription: weatherDetails.weather[0].description,
        weatherIconId: weatherDetails.weather[0].icon,
        wind: weatherDetails.wind.speed,
      }
      this._renderWeatherInfos();

    } catch (e) {
      this._resetHtml();
      new ErrorHandler(e);

    } finally {
      this._hideLoader();
    }
  }

  _renderWeatherInfos() {
    this._resetHtml();
    const weatherResult = document.querySelector('.weather__result');
    const locationHtml = this._createLocationHtml();
    const temperatureHtml = this._createTemperatureHtml();
    const weatherHtml = this._createWeatherHtml();
    const windHtml = this._createWindHtml();
    weatherResult.innerHTML = locationHtml + temperatureHtml + weatherHtml + windHtml;
  }

  _createLocationHtml() {
    return `
    <p class="weather__result-location">
    ${this.weatherInfos.location}の天気
    </p>
    `;
  }

  _createTemperatureHtml() {
    return `
    <div class="weather-info" id="temperature">
      <p class="weather-info-title">気温</p>
      <div class="weather-info-data">
        <p class="weather-info-main">${this.weatherInfos.temperature}℃</p>
      </div>
    </div>
    `;
  }

  _createWeatherHtml() {
    return `
    <div class="weather-info" id="weather">
      <p class="weather-info-title">天気</p>
      <div class="weather-info-data">
        <div class="weather-info-icon-container">
          <img class="weather-info-icon" src="https://openweathermap.org/img/wn/${this.weatherInfos.weatherIconId}@2x.png">
        </div>
        <p class="weather-info-sub">${this.weatherInfos.weatherDescription}</p>
      </div>
    </div>
    `;
  }

  _createWindHtml() {
    return `
    <div class="weather-info" id="wind">
      <p class="weather-info-title">風速</p>
      <div class="weather-info-data">
        <p class="weather-info-main">${this.weatherInfos.wind}m/s</p>
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

  _displayLoader() {
    const loader = document.querySelector('.loader');
    loader.classList.add('loading');
  }

  _hideLoader() {
    const loader = document.querySelector('.loader');
    loader.classList.remove('loading');
  }
}

const APIKEY = CONFIG.APIKEY;

new WeatherApp();