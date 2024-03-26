class WeatherApp {
  constructor() {
    this.APIKEY = '16806dd9a591b25a5beebeb69dd718b8';
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
      const coordResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=10&appid=${this.APIKEY}`);

      // TODO:400系ごとのハンドリングを分ける
      if (!coordResponse.ok) {
        this._throwError(coordResponse.status);
      }

      const coordArr = await coordResponse.json();

      if (coordArr.length === 0) {
        const noCityHtml = 'お探しの都市の天気情報が見つかりませんでした。<br>別の都市名を入力し、再度お試しください。'
        this._displayError(noCityHtml);
        return;
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
      this._catchError(e);

    } finally {
      this._endLoading();
    }

  }

  _getMultiLocationNames(coordArr) {
    const multiLoc = [];
    coordArr.forEach((location, i) => {
      //都市の日本語名が表示可能な場合は日本語名の表示を優先するための分岐
      if (location.local_names && location.local_names.ja) {
        const locInfo = this._extractLocInfo(location.local_names.ja, location);
        multiLoc[i] = locInfo;

      } else {
        const locInfo = this._extractLocInfo(location.name, location);
        multiLoc[i] = locInfo;
      }
    });

    const multiLocMap = Array.from(new Map(multiLoc.map(obj => [obj.name, obj])));
    const multiLocUni = [];
    multiLocMap.forEach((loc, i) => {
      multiLocUni[i] = loc[1];
    });

    if (multiLocUni.length === 1) {
      this._getWeather(multiLocUni);

    } else {
      this._renderMultiLoc(multiLocUni);
    }
  }

  _extractLocInfo(locName, locInfo) {
    return {
      name: locName,
      lat: locInfo.lat,
      lon: locInfo.lon,
    }
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

      const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.APIKEY}&units=metric&lang=ja`);

      // TODO:400系ごとのハンドリングを分ける
      if (!weatherResponse.ok) {
        this._throwError(weatherResponse.status)
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
      this._catchError(e);

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

  _throwError(status) {
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

  _catchError(e) {
    console.error(`${e}`);

    if (e instanceof Error400) {
      const errorHtml = `天気情報が取得できませんでした。(${e.message})`;
      this._displayError(errorHtml);
      return;

    } else {
      const errorHtml = '天気情報が取得できませんでした。<br>時間をおいてから再度お試しください。';
      this._displayError(errorHtml);
      return;
    }
  }

  _displayError(errorHtml) {
    this._resetHtml();
    const errorMessHtml = `
    <div class="weather__error-message">
      <p class="error-message">
      ${errorHtml}
      </p>
    </div>
    `
    const weatherResult = document.querySelector('.weather__result');
    weatherResult.innerHTML = errorMessHtml;
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

new WeatherApp();