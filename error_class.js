Error.prototype.createInnerHtml = function() {
  return '天気情報が取得できませんでした。<br>時間をおいてから再度お試しください。';
}

class ClientError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }

  createInnerHtml() {
    return `天気情報が取得できませんでした。`;
  }
}

class ServerError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ErrorNoCity extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }

  createInnerHtml() {
    return 'お探しの都市の天気情報が見つかりませんでした。<br>別の都市名を入力し、再度お試しください。';
  }
}

class ErrorHandler {
  #error;

  constructor(error) {
    this.#error = error;
  }

  catchError(e) {
    this.#error = e;

    console.error(this.#error);

    const errorHtml = this.#error.createInnerHtml();
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
    const resultElm = document.querySelector('.weather__result');
    resultElm.innerHTML = errorMessHtml;
  }
}