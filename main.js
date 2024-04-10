class WeatherApp {
  constructor() {
    this.errorHandler = new ErrorHandler();
    this.loader = new Loader(document.querySelector('.loader'), 'loading');
  }

  async trigger(location) {
    this.loader.display();

    try {
      const locationDetails = await this.#fetchLocationDetails(location)
      const uniqueLocationInfos = this.#removeDuplicateLocations(locationDetails.map(location => this.#extractLocationInfo(location)));

      if (!uniqueLocationInfos.length) {
        throw new NoCityError('都市が見つかりませんでした。');
      }

      if (uniqueLocationInfos.length === 1) {
        const coordinates = {
          lat: uniqueLocationInfos[0].lat,
          lon: uniqueLocationInfos[0].lon,
        }

        this.#renderWeather(coordinates);

      } else {
        this.#renderLocationSuggestions(uniqueLocationInfos);
      }

    } catch (e) {
      this.#resetHtml();
      this.errorHandler.trigger(e);

    } finally {
      this.loader.hide();
    }
  }

  async #fetchLocationDetails(location) {
    const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=10&appid=${APIKEY}`);
    if (!response.ok) {
      this.#throwNewError(response.status);
    }

    return await response.json();
  }

  //都市の日本語名が表示可能な場合は日本語名の表示を優先し、なければ英語名を表示する
  #extractLocationInfo(location) {
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
  #removeDuplicateLocations(allLocations) {
    const uniqueLocations = Array.from(new Map(allLocations.map(location => [location.name, location])));

    return uniqueLocations.map(location => location[1]);
  }

  #renderLocationSuggestions(locations) {
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
    this.#resetHtml();
    const parentElm = document.querySelector('.location-suggestions');
    parentElm.appendChild(title);
    parentElm.appendChild(ul);

    this.#onClickSuggestedLocation();
  }

  #onClickSuggestedLocation() {
    const suggestions = document.querySelectorAll('.location-suggestions__li');
    suggestions.forEach(suggestion => {
      suggestion.addEventListener('click', this.#renderWeather.bind(this, {
        lat: suggestion.dataset.lat,
        lon: suggestion.dataset.lon,
      }));
    });
  }

  async #renderWeather(coordinates) {
    this.loader.display();

    try {
      const weatherDetails = await this.#fetchWeatherDetails(coordinates);
      this.#renderWeatherInfos(weatherDetails);

    } catch (e) {
      this.#resetHtml();
      this.errorHandler.trigger(e);

    } finally {
      this.loader.hide();
    }
  }

  async #fetchWeatherDetails(coordinates) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${APIKEY}&units=metric&lang=ja`);
    if (!response.ok) {
      this.#throwNewError(response.status)
    }

    return await response.json();
  }

  #renderWeatherInfos(weatherDetails) {
    const temperature = weatherDetails.main.temp;
    const location = weatherDetails.name;
    const description = weatherDetails.weather[0].description;
    const iconId = weatherDetails.weather[0].icon;
    const wind = weatherDetails.wind.speed;

    const weatherResult = document.querySelector('.weather__result');
    const locationHtml = this.#createLocationHtml(location);
    const temperatureHtml = this.#createTemperatureHtml(temperature);
    const weatherHtml = this.#createWeatherHtml(description, iconId);
    const windHtml = this.#createWindHtml(wind);

    this.#resetHtml();
    weatherResult.innerHTML = locationHtml + temperatureHtml + weatherHtml + windHtml;
  }

  #createLocationHtml(locationName) {
    return `
    <p class="weather__result-location">
    ${locationName}の天気
    </p>
    `;
  }

  #createTemperatureHtml(temperature) {
    return `
    <div class="weather-info" id="temperature">
      <p class="weather-info-title">気温</p>
      <div class="weather-info-data">
        <p class="weather-info-main">${temperature}℃</p>
      </div>
    </div>
    `;
  }

  #createWeatherHtml(description, icon) {
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

  #createWindHtml(wind) {
    return `
    <div class="weather-info" id="wind">
      <p class="weather-info-title">風速</p>
      <div class="weather-info-data">
        <p class="weather-info-main">${wind}m/s</p>
      </div>
    </div>
    `;
  }

  #throwNewError(status) {
    switch (status) {
      case 400:
      case 401:
      case 404:
      case 429:
        throw new ClientError(`エラーコード：${status}`);

      case 500:
      case 502:
      case 503:
      case 504:
        throw new ServerError(`エラーコード：${status}`);
        
      default:
        throw new Error(`予期せぬエラーが発生しました。エラーコード：${status}`);
    }
  }

  #resetHtml() {
    const locationSuggestions = document.querySelector('.location-suggestions');
    const weatherResult = document.querySelector('.weather__result');
    locationSuggestions.innerHTML = '';
    weatherResult.innerHTML = '';
  }
}

const APIKEY = CONFIG.APIKEY;
const weatherApp = new WeatherApp();

const searchForm = document.querySelector('.weather__search-form');
searchForm.addEventListener('submit', event => {
  const locationInput = document.querySelector('.weather__textbox').value;
  event.preventDefault();
  if (!locationInput) return;
  weatherApp.trigger(locationInput);
});