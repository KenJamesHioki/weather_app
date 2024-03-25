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
    searchForm.addEventListener('submit', () => this._checkLocation(event));
  }

  // ユーザーが入力した都市名を取得しそれをgetCoordinatesに渡す
  async _checkLocation(event) {
    event.preventDefault();
    const locationInput = document.querySelector('.weather__textbox').value;
    // 空の場合は何もしない
    if (!locationInput) {
      return;
    }
    await this._getCoordinates(locationInput);
  }

  // 都市名を元に緯度経度をAPIで取得する。緯度経度をgetWeatherに渡す
  async _getCoordinates(location) {
    try {
      this._startLoading();
      const coordResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=10&appid=${this.apiKey}`);

      // レスポンスが正常でない場合は例外を投げる
      if (!coordResponse.ok) {
        switch (coordResponse.status) {
          case 401:
            throw new Error400('401 error');
          case 404:
            throw new Error400('404 error');
          case 429:
            throw new Error400('429 error');
          case 500, 502, 503, 504:
            throw new Error('500~504 error');
          default:
            throw new Error('somthing went wrong');
        }
      }
      const coordArr = await coordResponse.json();

      // 配列が空だった場合は指定した都市の天気情報がなかったと表示
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
      console.error(`${e}`);
      if (e instanceof Error400) {
        const errorHtml = '天気情報が取得できませんでした。';
        this._displayError(errorHtml);
        return;
      } else {
        const errorHtml = '天気情報が取得できませんでした。<br>時間をおいてから再度お試しください。';
        this._displayError(errorHtml);
        return;
      }
    } finally {
      this._endLoading();
    }

  }

  // 都市の候補が複数ある場合は候補地を配列にまとめる
  _getMultiLocationNames(coordArr) {
    const multiLoc = [];
    coordArr.forEach(location => {
      if (location.local_names && location.local_names.ja) {
        const locInfo = {}
        locInfo.name = location.local_names.ja;
        locInfo.lat = location.lat;
        locInfo.lon = location.lon;
        multiLoc.push(locInfo);
      } else {
        const locInfo = {}
        locInfo.name = location.name;
        locInfo.lat = location.lat;
        locInfo.lon = location.lon;
        multiLoc.push(locInfo);
      }
    });

    const multiLocMap = Array.from(new Map(multiLoc.map(obj => [obj.name, obj])));
    const multiLocUni = [];
    multiLocMap.forEach(loc => {
      multiLocUni.push(loc[1]);
    });

    if (multiLocUni.length === 1) {
      this._getWeather(multiLocUni);
    } else {
      this._renderMultiLoc(multiLocUni);
    }
  }

  // 複数候補があった場合は表示する
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

  // 緯度経度を元に天気情報をAPIで取得する。気温、天気、風速を格納。
  async _getWeather(coordinates) {
    try {
      this._startLoading();
      const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=metric&lang=ja`);

      // レスポンスが正常でない場合は例外を投げる
      if (!weatherResponse.ok) {
        switch (weatherResponse.status) {
          case 401:
            throw new Error('401 error');
          case 404:
            throw new Error('404 error');
          case 429:
            throw new Error('429 error');
          case 500, 502, 503, 504:
            throw new Error('500~504 error');
          default:
            throw new Error('somthing went wrong');
        }
      }

      const weatherObj = await weatherResponse.json();
      this.weatherInfo = {
        temp: weatherObj.main.temp, //気温（摂氏）
        location: weatherObj.name, //都市名
        weatherDesc: weatherObj.weather[0].description, //天気概要
        weatherIcon: weatherObj.weather[0].icon, //天気アイコンの識別コード
        wind: weatherObj.wind.speed, //風速
      }
      this._renderWeatherInfos();

    } catch (e) {
      console.error(`${e}`);
      const errorHtml = '天気情報が取得できませんでした。<br>時間をおいてから再度お試しください。';
      this._displayError(errorHtml);
      return;
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
        <div class="weather-info-icon-container">
          <img class="weather-info-icon" src="https://openweathermap.org/img/wn/${this.weatherInfo.weatherIcon}@2x.png">
        </div>
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