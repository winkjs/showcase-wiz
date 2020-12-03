# winkNLP Wizard

[![built with winkNLP](https://img.shields.io/badge/built%20with-winkNLP-blueviolet)](https://github.com/winkjs/wink-nlp) [![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/winkjs/Lobby) [![Follow on Twitter](https://img.shields.io/twitter/follow/winkjs_org?style=social)](https://twitter.com/winkjs_org)

## All NLP Features from Text

[<img align="right" src="https://decisively.github.io/wink-logos/logo-title.png" width="100px" >](https://winkjs.org/)

This demo takes text and annotates it in real-time:
- It tags all the Part of Speech tags and Entities in the text using the [`markup`](https://winkjs.org/wink-nlp/visualizing-markup.html) method.
- It shows over-all statistics like number of tokens, words and sentences. To calculate the number of words it [`filter`](https://winkjs.org/wink-nlp/visualizing-markup.html)s out all the tokens that have `its.type` as `word`.
- For [sentiment analysis](https://winkjs.org/wink-nlp/how-to-sentiment-analysis-javascript.html) it uses the `its.sentiment` helper.
- Using the [`as` helper](https://winkjs.org/wink-nlp/its-as-helper.html#codeascode-helper) it generates a table of all the words and their frequency of occurence

[<img src="https://user-images.githubusercontent.com/9491/100614781-ad17bb00-333c-11eb-87ab-2ae41aa21285.png" alt="Wink Wizard Showcase">](https://winkjs.org/showcase-wiz/)

### How to build this

```javascript
const winkNLP = require('wink-nlp');
const its = require( 'wink-nlp/src/its.js' );
const as = require( 'wink-nlp/src/as.js' );
const model = require('wink-eng-lite-model');
const nlp = winkNLP(model);

var text = `Yesterday at 3am I was surfing http://twitter.com. I won a 100$ lottery for the first time. I spent 100% of it in just 1 hour :P Can you imagine that 😅? #yolo`;
var doc = nlp.readDoc(text);

// Entities
var entities = doc.entities().out(its.detail);

// Counts
var sentences = doc.sentences().length();
var tokens = doc.tokens().length();
var words = doc.tokens().filter( (token) => {
  return token.out(its.type) === 'word'
} ).length();

// Tagged text
var seenEntities = new Set();
doc.tokens().each( (token) => {
  var entity = token.parentEntity();
  if (entity === undefined) {
    if (token.out(its.type) === 'word') {
      token.markup('<span class=\"tag '+ token.out(its.pos) +'\">','</span>');
    }
  } else {
    if (!seenEntities.has(entity.index())) {
      entity.markup('<span class=\"tag '+ entity.out(its.type) +'\">', "</span>");
    }
    seenEntities.add(entity.index());
  }
} )

// Word frequency
var wordFreq = doc.tokens().filter((token) => {
  return token.out(its.type) === 'word' && !token.out(its.stopWordFlag);
}).out(its.normal, as.freqTable);
wordFreq = wordFreq.slice(0, 5)

// Sentiment
var sentiments = [];
doc.sentences().each((s) => {
  sentiments.push({
    sentence: s.out(),
    sentiment: s.out(its.sentiment)
  })
})

console.log(entities)
console.log(sentiments);
console.log(wordFreq);
console.log(doc.out(its.markedUpText));
```
