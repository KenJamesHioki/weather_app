class Loader {
  #targetElement;
  #loaderType;
  
  constructor(targetElement, loaderType) {
    this.#targetElement = targetElement;
    this.#loaderType = loaderType
  }

  display() {
    this.#targetElement.classList.add(this.#loaderType);
  }

  hide() {
    this.#targetElement.classList.remove(this.#loaderType);
  }
}