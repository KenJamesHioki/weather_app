//TODO:変数、メソッドをプライベート化するのかが中途半端になっている。意思決定をして修正する。

class WeatherApp {
  constructor(locationInput) {
    this.locationInput = locationInput;
    this.errorHandler = new ErrorHandler();
    this._init(this.locationInput);
  }

  async _init(location) {
    this._displayLoader();

    try {
      const locationDetails = await this._fetchLocationDetails(location)
      this._checkLocationNumbers(locationDetails);

    } catch (e) {
      this._resetHtml();
      this.errorHandler.catchError(e);

    } finally {
      this._hideLoader();
    }
  }

  async _fetchLocationDetails(location) {
    const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=10&appid=${APIKEY}`);
    if (!response.ok) {
      this._throwNewError(response.status);
    }

    return await response.json();
  }

  //もうちょっといいメソッド名がありそう
  _checkLocationNumbers(locationDetails) {
    if (!locationDetails.length) {
      throw new ErrorNoCity('都市が見つかりませんでした。')
    }

    if (locationDetails.length === 1) {
      const coordinates = {
        lat: locationDetails[0].lat,
        lon: locationDetails[0].lon,
      }
      this._getWeather(coordinates);
    }

    if (locationDetails.length >= 2) {
      const allLocations = this._getAllLocation(locationDetails);
      const uniqueLocations = this._removeDuplicateLocations(allLocations);

      if (uniqueLocations.length === 1) {
        this._getWeather(uniqueLocations);

      } else {
        this._renderLocationSuggestions(uniqueLocations);
      }
    }
  }

  _getAllLocation(locationDetails) {
    return locationDetails.map(location => this._extractLocationInfo(location));
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

  //都市名が重複してAPIから返却される場合があるので、事前に重複を排除する
  _removeDuplicateLocations(allLocations) {
    const uniqueLocations = Array.from(new Map(allLocations.map(location => [location.name, location])));

    return uniqueLocations.map(location => location[1]);
  }

  _renderLocationSuggestions(locations) {
    const ul = document.createElement('ul');
    ul.classList.add('location-suggestions__ul');

    const title = document.createElement('p');
    title.classList.add('location-suggestions__title');
    title.textContent = '候補が複数見つかりました：'

    let liHtml = '';
    locations.forEach(location => {
      liHtml += `
      <li class="location-suggestions__li" data-lon="${location.lon}" data-lat="${location.lat}"><a href="#">${location.name}</a></li>
      `
    });

    ul.innerHTML = liHtml;
    this._resetHtml();
    const parentElm = document.querySelector('.location-suggestions');
    parentElm.appendChild(title);
    parentElm.appendChild(ul);

    this._onSuggestedLocationClick();
  }

  _onSuggestedLocationClick() {
    const suggestions = document.querySelectorAll('.location-suggestions__li');
    suggestions.forEach(suggestion => {
      suggestion.addEventListener('click', this._getWeather.bind(this, {
        lat: suggestion.dataset.lat,
        lon: suggestion.dataset.lon,
      }));
    });
  }

  async _getWeather(coordinates) {
    this._displayLoader();

    try {
      const weatherDetails = await this._fetchWeatherDetails(coordinates);
      this._renderWeatherInfos(weatherDetails);

    } catch (e) {
      this._resetHtml();
      this.errorHandler.catchError(e);

    } finally {
      this._hideLoader();
    }
  }

  async _fetchWeatherDetails(coordinates) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${APIKEY}&units=metric&lang=ja`);
    if (!response.ok) {
      this._throwNewError(response.status)
    }

    return await response.json();
  }

  _renderWeatherInfos(weatherDetails) {
    const temperature = weatherDetails.main.temp;
    const location = weatherDetails.name;
    const description = weatherDetails.weather[0].description;
    const iconId = weatherDetails.weather[0].icon;
    const wind = weatherDetails.wind.speed;
    
    const weatherResult = document.querySelector('.weather__result');
    const locationHtml = this._createLocationHtml(location);
    const temperatureHtml = this._createTemperatureHtml(temperature);
    const weatherHtml = this._createWeatherHtml(description, iconId);
    const windHtml = this._createWindHtml(wind);

    this._resetHtml();
    weatherResult.innerHTML = locationHtml + temperatureHtml + weatherHtml + windHtml;
  }

  _createLocationHtml(locationName) {
    return `
    <p class="weather__result-location">
    ${locationName}の天気
    </p>
    `;
  }

  _createTemperatureHtml(temperature) {
    return `
    <div class="weather-info" id="temperature">
      <p class="weather-info-title">気温</p>
      <div class="weather-info-data">
        <p class="weather-info-main">${temperature}℃</p>
      </div>
    </div>
    `;
  }

  _createWeatherHtml(description, icon) {
    return `
    <div class="weather-info" id="weather">
      <p class="weather-info-title">天気</p>
      <div class="weather-info-data">
        <div class="weather-info-icon-container">
          <img class="weather-info-icon" src="https://openweathermap.org/img/wn/${icon}@2x.png">
        </div>
        <p class="weather-info-sub">${description}</p>
      </div>
    </div>
    `;
  }

  _createWindHtml(wind) {
    return `
    <div class="weather-info" id="wind">
      <p class="weather-info-title">風速</p>
      <div class="weather-info-data">
        <p class="weather-info-main">${wind}m/s</p>
      </div>
    </div>
    `;
  }

  _throwNewError(status) {
    switch (status) {
      case 400:
        throw new ClientError('エラーコード：400');
      case 401:
        throw new ClientError('エラーコード：401');
      case 404:
        throw new ClientError('エラーコード：404');
      case 429:
        throw new ClientError('エラーコード：429');
      case 500, 502, 503, 504:
        throw new ServerError('エラーコード：500~504');
      default:
        throw new Error('処理ができませんでした。');
    }
  }

  _resetHtml() {
    const multiLocEml = document.querySelector('.location-suggestions');
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

const searchForm = document.querySelector('.weather__search-form');
searchForm.addEventListener('submit', event => {
  const locationInput = document.querySelector('.weather__textbox').value;
  event.preventDefault();
  if (!locationInput) return;
  new WeatherApp(locationInput);
});