Error.prototype.createInnerHtml = function() {
  return '天気情報が取得できませんでした。<br>時間をおいてから再度お試しください。';
}

class ClientError extends Error {
  constructor(message) {
    super(message);
  }

  createInnerHtml() {
    return `天気情報が取得できませんでした。`;
  }
}

class ServerError extends Error {
  constructor(message) {
    super(message);
  }
}

class NoCityError extends Error {
  constructor(message) {
    super(message);
  }

  createInnerHtml() {
    return 'お探しの都市の天気情報が見つかりませんでした。<br>別の都市名を入力し、再度お試しください。';
  }
}

class ErrorHandler {
  trigger(e) {
    console.error(e);

    const errorHtml = e.createInnerHtml();
    this.#display(errorHtml);
  }

  #display(errorHtml) {
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