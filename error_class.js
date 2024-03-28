class Error400 extends Error {
  constructor(message) {
    super(message);
    this.name = "Error400";
    this.message = message;
  }
}

class ErrorNoCity extends Error {
  constructor(message) {
    super(message);
    this.name = "ErrorNoCity";
    this.message = message;
  }
}

class ErrorHandler {
  #error;

  constructor(error) {
    this.#error = error;
    this.#catchError(this.#error);
  }

  #catchError(e) {
    console.error(`${e}`);

    //TODO：各エラークラスにerrorHtmlプロパティを作り、HTMLの内容を格納しておく。
    let errorHtml = '';
    if (e instanceof ErrorNoCity) {
      errorHtml = 'お探しの都市の天気情報が見つかりませんでした。<br>別の都市名を入力し、再度お試しください。'

    } else if (e instanceof Error400) {
      errorHtml = `天気情報が取得できませんでした。(${e.message})`;

    } else {
      errorHtml = '天気情報が取得できませんでした。<br>時間をおいてから再度お試しください。';
    }

    this.#displayError(errorHtml);
  }

  #displayError(errorHtml) {
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
}