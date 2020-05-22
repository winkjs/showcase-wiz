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
    getInfo(input.innerHTML);
    return false;
  });
});

renderInfo = function (info) {
  console.log(info);
  var output = document.getElementById('output');
  var entities = document.getElementById('entities');
  var wordFreq = document.getElementById('word-freq');
  var sentimentTable = document.getElementById('sentiment-table');

  // Marked up
  output.innerHTML = info.taggedText;

  // Entitiy list
  entities.innerHTML = '';
  info.entities.forEach( function (e) {
    entities.innerHTML += '<li class="' + e.type + '">' + e.value + '</li>';
  } );

  // Document info
  document.getElementById('sentences-stat').innerHTML = info.documentInfo.sentences;
  document.getElementById('words-stat').innerHTML = info.documentInfo.words;
  document.getElementById('tokens-stat').innerHTML = info.documentInfo.tokens;

  // Word frequency
  wordFreq.innerHTML = ''
  info.wordFreq.forEach(function (f) {
    wordFreq.innerHTML += '<tr>' +
      '<td>' + f[0] + '</td>' +
      '<td>' + f[1] + '</td>' +
      '</tr>';
  })

  // Sentiment
  sentimentTable.innerHTML = '';
  info.sentiments.forEach(function (s) {
    sentimentTable.innerHTML += '<tr>' +
      '<td>' + getSentimentEmoji(s.sentiment) + '</td>' +
      '<td class="sentence-text">' + s.sentence + '</td>' +
      '<td>' + s.sentiment + '</td>' +
      '</tr>';
  })
}

getSentimentEmoji = function (s) {
  if( s > 1 ) return '😃';
  if( s > 0 ) return '😊';
  if( s < -1 ) return '😢';
  if( s < 0 ) return '☹️';
  if( s === 0 ) return '😶';


}

getInfo = function (v) {
  // TODO: Figure out encoding issues
  v = v.replace('#', '%23'); // Hashtags are becoming fragments
  v = v.replace('%', '%25'); // Encode % sign
  fetch('https://showcase-serverless.herokuapp.com/pos-tagger?sentence='+v)
    .then(function (res) {
      return res.json();
    }).then(function (info) {
      renderInfo(info);
    })


  return;
  // TODO: This is a mock function and should be replaced by an API call
  var info = {
    taggedText: tag(v),
    entities: entities(v),
    documentInfo: documentInfo(v),
    wordFreq: wordFreq(v),
    sentiments: sentiment(v)
  }

  window.setTimeout( function () {
    renderInfo(info);
  }, 2000);

}

// TODO: These are all mock functions and should be removed
tag = function (v) {
  v = v.replace('wink', '<span class="tag org">wink</span>');
  v = v.replace('sanjaya', '<span class="tag person">sanjaya</span>');
  v = v.replace('noida', '<span class="tag location">noida</span>');
  v = v.replace('work', '<span class="tag verb">work</span>');
  return v;
}

entities = function (v) {
  var entities = [];
  if (v.indexOf('wink') > -1 ) entities.push({entity: 'wink', type: 'org'});
  if (v.indexOf('noida') > -1 ) entities.push({entity: 'noida', type: 'location'});
  if (v.indexOf('sanjaya') > -1 ) entities.push({entity: 'sanjaya', type: 'person'});
  return entities;
}

documentInfo = function (v) {
  return {
    sentences: v.split('.').length,
    words: v.split(' ').length,
    tokens: (v.split('.').length + v.split(' ').length)
  };
}

wordFreq = function (v) {
  return [
    ['Life', 42],
    ['Universe', 21],
    ['Everything', 7]
  ];
}

sentiment = function (v) {
  var sentiments = [];
  v.split('.').forEach( function (s) {
    sentiments.push({
      sentence: s,
      sentiment: Math.floor(Math.random() * 5) - 2
    })
  } );
  return sentiments;
}
