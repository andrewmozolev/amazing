(function(){
  // var title = document.querySelector('.page-header__title');

  /**
   * Throttle
   * @param  {function} callback  Функция которую нужно оптимизировать
   * @param  {number} timeDelay   Кол-во миллисекунд вызова функции
   * @return {function}           Оптимизированная функция
   */
  function throttle(callback, timeDelay) {
    var lastCall = Date.now();
    return function() {
      if (Date.now() - lastCall >= timeDelay) {
        callback();
        lastCall = Date.now();
      }
    };
  }

  /**
   * Проверка видимости элемента
   * @param  {HTMLElement} element  Элемент который проверяем
   * @return {Boolean}
   */
  function isVisible(element) {
    var elementPosition = element.getBoundingClientRect();
    return elementPosition.bottom > 0;
  }

  function moveHeadersElements() {
    var header = document.querySelector('.page-header');
    var logoElement = document.querySelector('.page-header__logo');
    var titleElement = document.querySelector('.page-header__title');
    var textElement = document.querySelector('.page-header__text');
    var headerPosition = header.getBoundingClientRect();
    logoElement.style.top = 0 - headerPosition.top / 5 + 'px';
    titleElement.style.top = 0 - headerPosition.top / 4 + 'px';
    titleElement.style.opacity = - 100 / (headerPosition.top);
    textElement.style.top = 0 - headerPosition.top / 3 + 'px';
    textElement.style.opacity = - 200 / (headerPosition.top);
  }

  var setScroll = throttle(function() {
    var headerElement = document.querySelector('.page-header');
    if (isVisible(headerElement)) {
      window.addEventListener('scroll', moveHeadersElements);
      console.log('add');
    } else {
      window.removeEventListener('scroll', moveHeadersElements);
      console.log('remove');
    }
  }, 100);

  window.addEventListener('scroll', setScroll);
}());
