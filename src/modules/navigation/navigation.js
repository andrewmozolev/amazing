(function(){
  var btn = document.querySelector('#btn-menu');
  var menu = document.querySelector('#menu');
  btn.addEventListener('click', function(evt) {
    menu.classList.toggle('js-show');
  });
}());
