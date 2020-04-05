document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('input');
  var output = document.getElementById('output');

  // Limit charactar input
  input.addEventListener('keypress',function (e) {
    if ($(this).text().length > 399) {
      e.preventDefault();
      $(this).text( $(this).text().substr(0,400) );
      return false;
    }
  });

  input.addEventListener('keyup', function () {
    output.innerHTML = tag(input.innerHTML);
    return false;
  });
});

tag = function (v) {
  console.log(v);
  v = v.replace('wink', '<span class="tag org">wink</span>');
  v = v.replace('sanjaya', '<span class="tag person">sanjaya</span>');
  v = v.replace('noida', '<span class="tag location">noida</span>');
  v = v.replace('work', '<span class="tag verb">work</span>');
  return v;
}
