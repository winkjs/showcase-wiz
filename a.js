document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('input');
  var output = document.getElementById('output');

  input.addEventListener('keyup', function () {
    output.innerHTML = tag(input.innerHTML);
  });
});

tag = function (v) {
  return v.replace('this', '<u title="lol">this</u>');
}
