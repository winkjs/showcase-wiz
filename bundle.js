(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var tcat = require( './token-categories.js' );

var feature = function ( config, lang, featuresData ) {
  const rgxLC = /^[a-z](?:[-–—.]?[a-z]+)*\.?$/;
  const rgxUC = /^[A-Z](?:[-–—.]?[A-Z]+)*\.?$/;
  const rgxTC = /^[A-Z](?:[-–—.]?[a-z]+)*\.?$/;

  // The Regex, Category  pair goes in to this array for category detection &
  // assignment.
  var rgxCatDetectors = [];
  // Extract the regexes required for lexicographer. Note, `lang` & `featuresData`
  // can be `undefined` or `null` when called from wink-nlp.
  var regexes = ( lang ) ? lang.trex.lex : null;
  // Helpers for regex management.
  var imax = ( lang ) ? regexes.length : 0;
  var i;
  // Features data used for pos & lemma.
  const fd = featuresData;
  // Returned!
  var methods = Object.create( null );

  var shape = function ( word ) {
    return (
      word
        .replace( /[A-Z]{4,}/g, 'XXXX' )
        // Handle <4 Caps
        .replace( /[A-Z]/g, 'X' )
        // Same logic for small case.
        .replace( /[a-z]{4,}/g, 'xxxx' )
        .replace( /[a-z]/g, 'x' )
        // and for digits.
        .replace( /\d{4,}/g, 'dddd' )
        .replace( /\d/g, 'd' )
    );
  }; // shape()

  var lutCase = function ( word ) {
    if ( rgxLC.test( word ) ) return 1;
    if ( rgxUC.test( word ) ) return 2;
    if ( rgxTC.test( word ) ) return 3;
    return 0;
  }; // lutCase()

  var suffix = function ( word ) {
    return word.slice( -config.suffix );
  }; // suffix()

  var prefix = function ( word ) {
    return word.slice( 0, config.prefix );
  }; // suffix()

  var lexeme = function ( word ) {
    return word;
  }; // lexeme()

  var lexemeCID = function ( word ) {
    return word;
  }; // lexemeCID()

  var partOfSpeech = function ( word ) {
    // Get the array of pos tags.
    const tags = fd.pos.hash[ word ];
    if ( !tags ) return lang.xpos.hash.UNK;
    // Return the pos tag's index, if it is unique otherwise `UNK`!
    return  lang.xpos.hash[ ( tags && tags.length === 1 ) ? tags[ 0 ] : tags[ 0 ] ];
  }; // partOfSpeech()

  var isSPoS = function ( word ) {
    // Get the array of pos tags.
    const tags = fd.pos.hash[ word ];
    return  ( tags && tags.length === 1 ) ? 1 : 0;
  }; // isSPoS()

  var lemma = function ( word ) {
    // For OOV word, always return 0;
    if ( fd.lexeme.hash[ word ] === 0 ) return 0;
    // Lemmas array for word.
    const lmh = fd.lemma.hash[ word ];
    // Print error if `lemma` is missing from lexicon!
    if ( lmh === undefined || fd.lexeme.hash[ lmh[ 0 ] ] === undefined ) {
      // `\x1b[41m` highlights in red & `\x1b[0m` resets the display.
      console.log( '\x1b[41m%s\x1b[0m entry is missing! (feature.lemma)', JSON.stringify( lmh[ 0 ] ) ); // eslint-disable-line no-console
      return 0;
    }
    return fd.lexeme.hash[ lmh[ 0 ] ];
  }; // lemma()

  var isSLemma = function ( word ) {
    // For OOV word, always return false;
    if ( fd.lexeme.hash[ word ] === 0 ) return 0;
    // Lemmas array for word.
    const lmh = fd.lemma.hash[ word ];
    return ( lmh && fd.lexeme.hash[ lmh[ 0 ] ] && lmh.length === 1 ) ? 1 : 0;
  }; // isSLemma()

  var isAbbrev = function ( word ) {
    return ( /[a-z].*\.$/i ).test( word ) ? 1 : 0;
  }; // isAbbrev()

  var normal = function ( word ) {
    // Hash of lowercased word.
    const lcwHash = fd.lexeme.hash[ word.toLowerCase() ];
    // Print error if `word.lowercase` is missing from lexicon!
    if ( lcwHash === undefined ) {
      // `\x1b[41m` highlights in red & `\x1b[0m` resets the display.
      console.log( '\x1b[41m%s\x1b[0m entry is missing! (feature.normal)', JSON.stringify( word.toLowerCase() ) ); // eslint-disable-line no-console
      // Error means offset is 0 i.e. the word === normal!!
      return 0;
    }
    const offset = lcwHash - fd.lexeme.hash[ word ];
    // Throw error if `offset` is outside the acceptable range.
    if ( offset < 0 || offset > 3 ) throw new Error( 'feature.normal: offset of ' + offset + ' for ' + JSON.stringify( word ) );
    return ( offset );
  }; // normal()

  var tokenType = function ( word ) {
    var cat;
    for ( cat = 0; cat < rgxCatDetectors.length; cat += 1 ) {
      // Test the category of word against the current `cat`egory.
      if ( rgxCatDetectors[ cat ][ 0 ].test( word ) ) return rgxCatDetectors[ cat ][ 1 ];
    }
    console.log( '\x1b[41m%s\x1b[0m has unknown token type! (feature.tokenType)', JSON.stringify( word ) ); // eslint-disable-line no-console
    // Detection failed – assume it to be word!
    return tcat.hash.word;
  }; // tokenType()

  // Compile the required trex.
  for ( i = 0; i < imax; i += 1 ) {
    // Push `[ regex, category ]` pair. This is similar to what is contained in `compile-trex.js` in `wink-nlp`.
    rgxCatDetectors.push( [ ( new RegExp( regexes[ i ][ 0 ], regexes[ i ][ 1 ] ) ), regexes[ i ][ 2 ] ] );
  }
  // Setup `methods`.
  methods.shape = shape;
  methods.suffix = suffix;
  methods.prefix = prefix;
  methods.lexeme = lexeme;
  methods.lexemeCID = lexemeCID;
  methods.isAbbrev = isAbbrev;
  methods.normal = normal;
  methods.tokenType = tokenType;
  methods.pos = partOfSpeech;
  methods.isSPoS = isSPoS;
  methods.lemma = lemma;
  methods.isSLemma = isSLemma;
  methods.lutCase = lutCase;

  return methods;
}; // extract();


module.exports = feature;

},{"./token-categories.js":3}],2:[function(require,module,exports){
(function (Buffer){
/* eslint-disable no-console */
/* eslint-disable no-sync */
/* eslint-disable guard-for-in */

const HeaderSize = 48;
const HeaderBufferSize = HeaderSize * 4;

var fs = require( 'fs' );

var readModel = function ( file ) {
  // File Descriptor.
  var fd;
  // Header block.
  var header = new Uint32Array( HeaderSize );
  // Packing information block.
  var packing;
  // Lexicon block.
  var lexicon;
  // Features data block.
  var featuresData;
  // `xpansions` of contractions.
  var xpansions;
  // Token Categories.
  var tcat;
  // Part Of Speech.
  var pos;
  // Tokenizer Regexes.
  var trex;
  // Returned: model.
  var model = Object.create( null );


  var readBlock = function ( target, targetSize, targetName, parse ) {
    var size = -1;
    var parsed = null;
    try {
      size = fs.readSync( fd, target, 0, targetSize );
    } catch ( ex ) {
      throw Error( 'Read Model: incorrect input – read failure at: ' + targetName + '\n\t' + ex.message );
    }
    if ( size !== targetSize ) throw Error( 'Read Model: incorrect input length found for: ' + targetName );

    if ( parse ) {
      try {
        parsed = JSON.parse( target.toString( 'utf8' ) );
      } catch ( ex ) {
        throw Error( 'Read Model: incorrect format – parse failure at: ' + targetName + '\n\t' + ex.message );
      }
    }

    return ( ( parsed ) ? parsed : target );
  }; // readBlock()

  // Open the model file in read mode.
  try {
    fd = fs.openSync( file, 'r' );
  } catch ( ex ) {
    throw Error( 'Read Model: file open failure\n\t' + ex.message );
  }

  // Read the header block first.
  header = readBlock( header, HeaderBufferSize, 'header', false );

  // Read the packing information block.
  packing = readBlock( ( Buffer.alloc( header[ 2 ] ) ), header[ 2 ], 'packing', true );

  // With header in hand, can allocate memory to lexicon.
  lexicon = new Uint32Array( header[ 3 ] / 4 );
  // Read the lexicon block.
  lexicon = readBlock( lexicon, header[ 3 ], 'lexicon', false );

  // Read the features data block.
  featuresData = readBlock( ( Buffer.alloc( header[ 4 ] ) ), header[ 4 ], 'features', true );
  // Rebuild hash from list for the required features.
  for ( const f in packing.layout ) {
    if ( packing.layout[ f ][ 3 ] === 0 ) {
      featuresData[ f ].hash = Object.create( null );
      for ( let k = 0; k < featuresData[ f ].list.length; k += 1 ) featuresData[ f ].hash[ featuresData[ f ].list[ k ] ] = k;
    }
  }
  // Rebuilding hash from lexeme is mandatory.
  featuresData.lexeme.hash = Object.create( null );
  for ( let k = 0; k < featuresData.lexeme.list.length; k += 1 ) featuresData.lexeme.hash[ featuresData.lexeme.list[ k ] ] = k;

  // Read `tcat`.
  tcat = readBlock( ( Buffer.alloc( header[ 5 ] ) ), header[ 5 ], 'tcat', true );
  // Read `pos`.
  pos = readBlock( ( Buffer.alloc( header[ 6 ] ) ), header[ 6 ], 'pos', true );
  // Read `trex`.
  trex = readBlock( ( Buffer.alloc( header[ 7 ] ) ), header[ 7 ], 'trex', true );
  // Read `xpansions` of contractions; treatment is similar to `lexicon` (above).
  xpansions = new Uint32Array( header[ 8 ] / 4 );
  xpansions = readBlock( xpansions, header[ 8 ], 'xpansions', false );

  model.packing = packing;
  model.lexicon = lexicon;
  model.features = featuresData;
  model.tcat = tcat;
  model.pos = pos;
  model.trex = trex;
  model.xpansions = xpansions;
  return model;
}; // readModel()

module.exports = readModel;

}).call(this,require("buffer").Buffer)
},{"buffer":14,"fs":12}],3:[function(require,module,exports){
const tcat = Object.create( null );
tcat.hash = Object.create( null );

tcat.list = [
  'unk',          // 0
  'word',         // 1
  'number',       // 2
  'url',          // 3
  'email',        // 4
  'mention',      // 5
  'hashtag',      // 6
  'emoji',        // 7
  'emoticon',     // 8
  'time',         // 9
  'ordinal',      // 10
  'currency',     // 11
  'punctuation',  // 12
  'symbol',       // 13
  'tabCRLF',      // 14
  'wordRP',       // 15 – word with Right Punctuation
  'alpha',        // 16 – pure alphabets
  'apos',         // 17
  'decade',       // 18 – 1990s kind
  'shortForm'     // 19 – Initialism, where each letter is separated by a period
];

tcat.hash.unk = 0;
tcat.hash.word = 1;
tcat.hash.number = 2;
tcat.hash.url = 3;
tcat.hash.email = 4;
tcat.hash.mention = 5;
tcat.hash.hashtag = 6;
tcat.hash.emoji = 7;
tcat.hash.emoticon = 8;
tcat.hash.time = 9;
tcat.hash.ordinal = 10;
tcat.hash.currency = 11;
tcat.hash.punctuation = 12;
tcat.hash.symbol = 13;
tcat.hash.tabCRLF = 14;
tcat.hash.wordRP = 15;
tcat.hash.alpha = 16;
tcat.hash.apos = 17;
tcat.hash.decade = 18;
tcat.hash.shortForm = 19;

module.exports = tcat;

},{}],4:[function(require,module,exports){
//     wink-nlp
//     Production-ready Natural Language Processing
//
//     Copyright (C) 2017-19  GRAYPE Systems Private Limited
//
//     This file is part of “wink-nlp”.
//
//     Permission is hereby granted, free of charge, to any
//     person obtaining a copy of this software and
//     associated documentation files (the "Software"), to
//     deal in the Software without restriction, including
//     without limitation the rights to use, copy, modify,
//     merge, publish, distribute, sublicense, and/or sell
//     copies of the Software, and to permit persons to
//     whom the Software is furnished to do so, subject to
//     the following conditions:
//
//     The above copyright notice and this permission notice
//     shall be included in all copies or substantial
//     portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//     ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//     TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//     PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
//     THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
//     DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
//     CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
//     CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//     DEALINGS IN THE SOFTWARE.

//

var featureFn = require( '../../wink-nlp-model-builder/src/feature.js' );
var constants = require( './constants.js' );
var xnMask = constants.xnMask;
var bits4PrecedingSpace = constants.bits4PrecedingSpace;
var xcMask = 0x1F;
var bits4xpPointer = 14;

// ## cache
/**
 *
 * Creates an instance of `cache`. It is typically instantiated in each `winkNLP`
 * instance and there it is responsible for caching token properties acrosss the
 * documents i.e. the `doc()`.
 *
 * @param {Array} model containing language model.
 * @return {object} of methods.
 * @private
*/
var cache = function ( model ) {
  const fTokenType = 'tokenType';
  // Returned!
  var methods = Object.create( null );
  // Extract frequently used properties.
  var lexemesHash = model.features.lexeme.hash;
  var lxm = model.features.lexeme;
  var lexemeIntrinsicSize = model.features.lexeme.intrinsicSize;
  var layout = model.packing.layout;
  var pkSize = model.packing.size;
  var efSize = model.packing.efSize;
  var efList = model.packing.efList;
  var efListSize = efList.length;
  var lexicon = model.lexicon;
  var xpansions = model.xpansions;
  // Contains quantas of UInt32Array of size `model.packing.size`. A quanta
  // at an `index` contains the features of the corresponding OOV lexeme loacted
  // at `model.features.lexeme.list[ index ]`. This simplifies information access,
  // as it remains identical to the **intrinsic lexicon** with the only difference
  // that this not a continuous array of UInt32s. It follows
  // `[ normal, lemma, <extractable features> ]` structure. The extractable
  // features will be dynamically determined using the language model.
  var extrinsicLexicon = [];
  // Packing size for eact lexeme in `extrinsicLexicon`.
  var elPackingSize = 4;
  // Extractable Features temp storage; eventually its contents will be pushed
  // inside `extrinsicLexicon`. Space is allocated right in the beginning to save
  // time. Its contents are filled i.e. initialized with 0 whenever needed.
  var efArray = new Uint32Array( efSize );

  var feature = featureFn( model.packing.config );

  // ## getFeaturesIndex
  /**
   *
   * Returns the `index` of `value` from the feature `name`. If the value is
   * missing then it is added and its `index` is returned accordingly alongwith
   * a flag indicating that it is a new value.
   *
   * @param {string} name i.e. the value of the token to be added.
   * @param {string} value of the token i.e. `word(0)` or `number(1)`, etc.
   * @return {number[]} `[ newValue, index ]`.
   * @private
  */
  var getFeaturesIndex = function ( name, value ) {
    // Extract the named feature.
    var f = model.features[ name ];
    // And its hash & list.
    var h = f.hash;
    var l = f.list;
    // New `value` flag.
    var newlyAddedValue = 0;
    // Check if `value` is present.
    var index = h[ value ];
    if ( index === undefined ) {
      // Missing — add `value`.
      index = h[ value ] = f.index;
      // No need to increment index because push returns the required value!
      f.index = l.push( value );
      // Set new value flag.
      newlyAddedValue = 1;
    }

    return [ newlyAddedValue, index ];
  }; // getFeaturesIndex()

  // ## add
  /**
   *
   * Adds a token in the cache corresponding to the **text**. If the same is
   * present in the cache then a pointer to its cached value is retured; otherwise
   * a new entry is made in the cache and the same is returned.
   *
   * Whenever a new entry is made, all its extractable features are also
   * extracted & packed; and if an extractable feature is also new, its entry
   * is also made via `getFeaturesIndex()` api.
   *
   * @param {string} text i.e. the value of the token to be added.
   * @param {number} category of the token i.e. `word(0)` or `number(1)`, etc.
   * @return {number[]} index (or hash) of the `text` added.
   * @private
  */
  var add = function ( text, category ) {
    // Lowercased `text`.
    var normText = text.toLowerCase();
    var normIndex = getFeaturesIndex( 'lexeme', normText );
    var textIndex = ( normText === text ) ? normIndex : getFeaturesIndex( 'lexeme', text );
    // Hepers: cfg of feature, feature, feature's value, feature's value for
    // packing & loop index.
    var cfg, f, fv, fv4p, k;

    if ( textIndex[ 0 ] ) {
      // NOTE: This block of code is repeated below.
      // Intialize extractable featires' array with all 0s.
      efArray.fill( 0 );
      // For every extractable feature, extract & pack.
      for ( k = 0; k < efListSize; k += 1 ) {
        f = efList[ k ];
        cfg = layout[ f ];
        fv = feature[ f ]( text );
        fv4p = ( cfg[ 3 ] ) ? fv : getFeaturesIndex( f, fv )[ 1 ];
        efArray[ cfg[ 0 ] ] |= ( fv4p << cfg[ 2 ] ); // eslint-disable-line no-bitwise
      } // for
      // Pack token type now.
      f = fTokenType;
      cfg = layout[ f ];
      efArray[ cfg[ 0 ] ] |= ( category << cfg[ 2 ] ); // eslint-disable-line no-bitwise
      // Push all the details i.e. `[ normal, lemma, <extractable features> ]`
      // into `extrinsicLexicon`.
      extrinsicLexicon.push( normIndex[ 1 ], normIndex[ 1 ], ...efArray );
    } // if ( >= lexemeIntrinsicSize )

    // If the normalized text is not same as the original text then the original
    // also needs to go in the dictionary.
    if ( textIndex[ 1 ] !== normIndex[ 1 ] ) {
      if ( normIndex[ 0 ] ) {
        // NOTE: This block of code is same as above.
        // Intialize extractable featires' array with all 0s.
        efArray.fill( 0 );
        // For every extractable feature, extract & pack.
        for ( k = 0; k < efListSize; k += 1 ) {
          f = efList[ k ];
          cfg = layout[ f ];
          fv = feature[ f ]( text );
          fv4p = ( cfg[ 3 ] ) ? fv : getFeaturesIndex( f, fv )[ 1 ];
          efArray[ cfg[ 0 ] ] |= ( fv4p << cfg[ 2 ] ); // eslint-disable-line no-bitwise
        } // for
        // Pack token type now.
        f = fTokenType;
        cfg = layout[ f ];
        efArray[ cfg[ 0 ] ] |= ( category << cfg[ 2 ] ); // eslint-disable-line no-bitwise
        // Push all the details i.e. `[ normal, lemma, <extractable features> ]`
        // into `extrinsicLexicon`.
        extrinsicLexicon.push( normIndex[ 1 ], normIndex[ 1 ], ...efArray );
      } // if ( >= lexemeIntrinsicSize )
    } // if ( textIndex !== normIndex )

    // Return the `textIndex` only – this can be sued to extract properties.
    return ( textIndex[ 1 ] );
  }; // add()

  // ## lookup
  /**
   *
   * Looks up for the `text` in the cache and returns its index. If the input
   * text is a contraction then its expansions are returned.
   *
   * @param {string} text to be searched in the cache.
   * @return {number[]} contains either a single element (i.e. `index`) indicating
   * that it is NOT a contraction or multiple elements indication that the text
   * is a contraction. Each contraction expands into 4 elements viz. `lexeme`,
   * `normal`, `lemma` , and `pos`.
   * @private
  */
  var lookup = function ( text ) {
    // `layout.isContraction` for multiple use later.
    var layout4isContraction = layout.isContraction;
    var layout4lemma = layout.lemma;
    // `index` to `text`.
    var index = lexemesHash[ text ];
    // Holds lemma extracted in case of contraction.
    var lemma;
    // Contraction Count, Contraction Index, Loop Index.
    var cc, cx, cxi;

    // If the text is not found, return `null`.
    if ( index === undefined ) return null;
    // `text` is found – need to check for contraction if `text` is not an OOV.
    var tokens = [];
    var isContraction;
    if ( index < lexemeIntrinsicSize ) {
      // Not an OOV, check it it is a contraction.
      isContraction = ( lexicon[ layout4isContraction[ 0 ] + ( index * pkSize ) ] & layout4isContraction[ 1 ] ) >>> layout4isContraction[ 2 ]; // eslint-disable-line no-bitwise
      if ( isContraction ) {
        // It is a contraction, process its expansions.
        // Start by extracting lemma, as it contains pointer to `expansions` and their count.
        lemma  = ( lexicon[ layout4lemma[ 0 ] + ( index * pkSize ) ] & layout4lemma[ 1 ] ) >>> layout4lemma[ 2 ]; // eslint-disable-line no-bitwise
        // Extract pointer (i.e. index) to expansions and their count.
        cx = lemma & 0x3FFF; // eslint-disable-line no-bitwise
        cc = ( lemma & ( xcMask << bits4xpPointer ) ) >> bits4xpPointer; // eslint-disable-line no-bitwise
        // Iterate through `cc` times to push details into the `tokens`.
        for ( cxi = 0; cxi < cc; cxi += 4 ) {
          tokens.push(
            xpansions[ cx + cxi ],      // lexeme
            cx + cxi + 1,               // normal (pointer to xpansion & not to lexicon)
            xpansions[ cx + cxi + 2 ],  // lemma
            xpansions[ cx + cxi + 3 ]   // pos
          );
        }
      } else {
        // Not a contraction, simply add `text`'s `index` to `tokens`.
        tokens.push( index );
      }
    } else {
      // An OOV, only add `text`'s `index` to `tokens`.
      tokens.push( index );
    }
    return tokens;
  }; // lookup()

  // ## value
  /**
   *
   * Returns the value corresponding to the `index`.
   *
   * @param {number} index for the value.
   * @return {string} value corresponding to the `index`.
   * @private
  */
  var value = function ( index ) {
    return lxm.list[ index ];
  }; // value()

  // ## normal
  /**
   *
   * Returns the index of normal of the input `index` (of required lexeme) after
   * taking into account mapping of spelling, if any.
   *
   * @param {number} index of the required lexeme.
   * @return {string} index to the normal.
   * @private
  */
  var normal = function ( index ) {
    // Temps for `layput.normal`, `layout.isSpellingMapped`, etc.
    var layout4normal = layout.normal;
    var layout4mapped = layout.isSpellingMapped;
    var layout4lemma =  layout.lemma;
    // Used to remap if its value is `1`. In this case lemma becomes the `normIndex`.
    var isSpellingMapped;
    // Index for OOVs i.e. when `index > lexemeIntrinsicSize`.
    var oovIdx;
    // Returned: normal's index.
    var normIndex;

    // Processing is different for native and OOV words or lexemes. For OOVs
    // properties have to be extracted from `extrinsicLexicon`, whereas for
    // native words they are exracted from `lexicon`.
    if ( index < lexemeIntrinsicSize ) {
      normIndex = ( lexicon[ layout4normal[ 0 ] + ( index * pkSize ) ] & layout4normal[ 1 ] ) >>> layout4normal[ 2 ]; // eslint-disable-line no-bitwise
      isSpellingMapped = ( lexicon[ layout4mapped[ 0 ] + ( index * pkSize ) ] & layout4mapped[ 1 ] ) >>> layout4mapped[ 2 ]; // eslint-disable-line no-bitwise
      if ( isSpellingMapped ) {
        // Mapped, pick up the lemma portion as this points to normal in case of
        // mapped spellings.
        normIndex = ( lexicon[ layout4lemma[ 0 ] + ( index * pkSize ) ] & layout4lemma[ 1 ] ) >>> layout4lemma[ 2 ]; // eslint-disable-line no-bitwise
      } else {
        // Compute actual index from the relative index.
        normIndex += index;
      }
    } else {
      oovIdx = index - lexemeIntrinsicSize;
      // Refer to `extrinsicLexicon` structure at the top of `cache()`.
      normIndex = extrinsicLexicon[ oovIdx * elPackingSize ];
      // This `normIndex` may point to an intrinsic lexeme, in which case
      // mapping needs to be checked.
      if ( normIndex < lexemeIntrinsicSize ) {
        isSpellingMapped = ( lexicon[ layout4mapped[ 0 ] + ( normIndex * pkSize ) ] & layout4mapped[ 1 ] ) >>> layout4mapped[ 2 ]; // eslint-disable-line no-bitwise
        if ( isSpellingMapped ) {
          normIndex = ( lexicon[ layout4lemma[ 0 ] + ( normIndex * pkSize ) ] & layout4lemma[ 1 ] ) >>> layout4lemma[ 2 ]; // eslint-disable-line no-bitwise
        }
      }
    }

    return normIndex;
  }; // normal()

  // ## nox
  /**
   *
   * Returns the index of normal of the expansion.
   *
   * @param {number} binaryWord containing pointer to `xpansions` and `precedingSpaces`;
   * It is the 2nd (relative) element of a single token's packet of 4-words.
   * @return {number} index to the normal, whoes value can be found via `value()`.
   * @private
  */
  var nox = function ( binaryWord ) {
    return xpansions[ ( binaryWord & xnMask) >>> bits4PrecedingSpace ];  // eslint-disable-line no-bitwise
  }; // nox()

  // ## property
  /**
   *
   * Extracts the property – `prop` of a lexeme (or word) specified by `index`.
   *
   * @param {number} index of the lexeme whoes properties are required to be extracted.
   * @param {string} prop (name) that needs to be extracted.
   * @return {string} extracted property.
   * @private
  */
  var property = function ( index, prop ) {
    // A property and its value
    var propValue;
    // Index for OOVs i.e. when `index > lexemeIntrinsicSize`.
    var oovIdx;
    // Temp for `layput[ p ]`
    var layout4Prop;

    // Processing is different for native and OOV words or lexemes. For OOVs
    // properties have to be extracted from `extrinsicLexicon`, whereas for
    // native words they are exracted from `lexicon`.
    if ( index < lexemeIntrinsicSize ) {
      layout4Prop = layout[ prop ];
      propValue  = ( lexicon[ layout4Prop[ 0 ] + ( index * pkSize ) ] & layout4Prop[ 1 ] ) >>> layout4Prop[ 2 ]; // eslint-disable-line no-bitwise
      // Use hash/list to update value if required.
      if ( layout4Prop[ 3 ] === 0 || layout4Prop[ 5 ] === 1 ) propValue = model.features[ prop ].list[ propValue ];
    } else {
        // Compute index into `extrinsicLexicon`.
        oovIdx = index - lexemeIntrinsicSize;
        layout4Prop = layout[ prop ];
        // Use `extrinsicLexicon`.
        propValue  = ( extrinsicLexicon[ efSize + layout4Prop[ 0 ] + ( oovIdx * elPackingSize ) ] & layout4Prop[ 1 ] ) >>> layout4Prop[ 2 ]; // eslint-disable-line no-bitwise
        // Use hash/list to update value if required.
        if ( layout4Prop[ 3 ] === 0 || layout4Prop[ 5 ] === 1 ) propValue = model.features[ prop ].list[ propValue ];
    }
    return propValue;
  }; // property()

  // ## properties
  /**
   *
   * Extracts the properties mentioned in the `list`, of a lexeme (or word)
   * specified by `index`.
   *
   * @param {number} index of the lexeme whoes properties are required to be extracted.
   * @param {string[]} list of properties (name) that need to be extracted.
   * @return {string[]} extracted properties in the same sequence as `list`.
   * @private
  */
  var properties = function ( index, list ) {
    // A property and its value
    var prop, propValue;
    // Index for OOVs i.e. when `index > lexemeIntrinsicSize`.
    var oovIdx;
    // Temp for `layput[ p ]`
    var layout4Prop;
    // Helpers: Loop index and its max.
    var k,
        kmax = list.length;
    // Returned: extracted properties.
    var extractedProps = [];

    // Processing is different for native and OOV words or lexemes. For OOVs
    // properties have to be extracted from `extrinsicLexicon`, whereas for
    // native words they are exracted from `lexicon`.
    if ( index < lexemeIntrinsicSize ) {
      for ( k = 0; k < kmax; k += 1 ) {
        prop = list[ k ];
        layout4Prop = layout[ prop ];
        propValue  = ( lexicon[ layout4Prop[ 0 ] + ( index * pkSize ) ] & layout4Prop[ 1 ] ) >>> layout4Prop[ 2 ]; // eslint-disable-line no-bitwise
        // Use hash/list to update value if required.
        if ( layout4Prop[ 3 ] === 0 || layout4Prop[ 5 ] === 1 ) propValue = model.features[ prop ].list[ propValue ];
        extractedProps.push( propValue );
      } // for
    } else {
      for ( k = 0; k < kmax; k += 1 ) {
        // Compute index into `extrinsicLexicon`.
        oovIdx = index - lexemeIntrinsicSize;
        prop = list[ k ];
        layout4Prop = layout[ prop ];
        // Use `extrinsicLexicon`.
        propValue  = ( extrinsicLexicon[ efSize + layout4Prop[ 0 ] + ( oovIdx * elPackingSize ) ] & layout4Prop[ 1 ] ) >>> layout4Prop[ 2 ]; // eslint-disable-line no-bitwise
        // Use hash/list to update value if required.
        if ( layout4Prop[ 3 ] === 0 || layout4Prop[ 5 ] === 1 ) propValue = model.features[ prop ].list[ propValue ];
        extractedProps.push( propValue );
      } // for
    }
    return extractedProps;
  }; // properties()


  methods.add = add;
  methods.lookup = lookup;
  methods.value = value;
  methods.property = property;
  methods.properties = properties;
  methods.normal = normal;
  methods.nox = nox;

  return methods;
}; // cache()

module.exports = cache;


// Test code to be removed later ——————>
/*
var c = cache();
c.add( 'The', 1 );
c.add( 'cat', 2 );
c.add( 'mouse', 3 );
c.add( 'cat', 2 );
c.add( 'Cat', 2 );
c.add( 'cat', 2 );
c.print();
console.log( c.lookup( 'the' ) ); // eslint-disable-line no-console
console.log( c.lookup( 'Cat' ) ); // eslint-disable-line no-console
*/

},{"../../wink-nlp-model-builder/src/feature.js":1,"./constants.js":6}],5:[function(require,module,exports){
/* eslint-disable no-sync */


var makeRegexes = function ( config ) {
  var rgx = [];
  var imax = config.length;
  var i;

  for ( i = 0; i < imax; i += 1 ) {
    rgx.push( [ ( new RegExp( config[ i ][ 0 ], config[ i ][ 1 ] ) ), config[ i ][ 2 ] ] );
  }
  return rgx;
}; // makeRegexes()

var compileTRex =  function ( trex ) {
  var rtc;
  var ltc;
  var helpers = Object.create( null );

  try {
    rtc = makeRegexes( trex.rtc );

    ltc = makeRegexes( trex.ltc );

    // Helper regexes.
    for ( const h in trex.helpers ) { // eslint-disable-line guard-for-in
      helpers[ h ] = new RegExp( trex.helpers[ h ][ 0 ], trex.helpers[ h ][ 1 ] );
    }

    // file = path.join( __dirname, 'languages', language, 'normalization-map.json' );
    // nmap = JSON.parse( fs.readFileSync( file, 'utf8' ) );
  } catch ( ex ) {
    throw Error( 'wink-nlp: Invalid trex.\n\nDetails:\n' + ex.message );
  }
  return  { rtc: rtc, ltc: ltc, helpers: helpers };
}; // readLangConfig()

module.exports = compileTRex;

},{}],6:[function(require,module,exports){
var consts = Object.create( null );
// Unknown or the UNK!
consts.UNK = 0;
// Bits reserved for `precedingSpaces`.
consts.bits4PrecedingSpace = 16;
// Bits reserved for `lemma`.
consts.bits4lemma = 20;
// Mask for preceding spaces.
consts.psMask = 0xFFFF;
// Mask for pointer to normal in `xpansions`.
consts.xnMask = 0x3FFF000;
// Size of a single token.
consts.tkSize = 4;
// Size of a single expansion.
consts.xpSize = 4; // can't: ca can can MD i.e. expansion, normal, lemma, pos.
// Expansion count mask.
consts.xcMask = 0x1F;
// Bits reserved for point to expansions in `lemma` space.
consts.bits4xpPointer = 14;

module.exports = consts;

},{}],7:[function(require,module,exports){
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */

var constants = require( './constants.js' );

var doc = function ( cache ) {
  // Document's tokens; each token is represented as an array of numbers:
  // [
  //   value,       // index used to access the properties
  //   normal,      //
  //   lemma,       //
  //   annotations  //
  // ]
  var tokens = [];
  // Size of a single token.
  var tkSize = constants.tkSize;
  // Bits reserved for `precedingSpaces`.
  var bits4PrecedingSpace = constants.bits4PrecedingSpace;
  // Mask for preceding spaces.
  var psMask = constants.psMask;
  // Size of a single expansion.
  var xpSize = constants.xpSize;
  // Bits reserved for `lemma`.
  var bits4lemma = constants.bits4lemma;

  // The UNK!
  var UNK = constants.UNK;
  // Returned!
  var methods = Object.create( null );
  var value = cache.value;

  // Methods:

  var addToken = function ( text, category, precedingSpaces ) {
    tokens.push( cache.add( text, category ), precedingSpaces, 0, 0 );
    return true;
  };

  // ## count
  /**
   *
   * Returns the number of tokens present in the document.
   *
   * @returns {number} number of tokens in the document.
   * @private
  */
  var count = function () {
    return ( tokens.length / tkSize );
  };

  var tokens1 = function () {
    var imax = tokens.length;
    var i;
    var t;
    var list = [];
    for ( i = 0; i < imax; i += tkSize ) {
      t = tokens[ i ];
      list.push( value( t ) );
    }
    return list;
  }; // tokens()

  // Extracts the property – `prop` of token at `index`.
  var tokenProp = function ( index, prop ) {
    return cache.property( tokens[ index * tkSize ], prop );
  }; // tokenProp();

  var printTokens = function () {
    var imax = tokens.length;
    var i, j;
    var t, tv;
    var pad = '                         ';
    var str;
    var props;
    // Print token and properties.
    console.log( '\n\ntoken      p-spaces   suffix  prefix  shape   case    pos     type     normal' );
    console.log( '—————————————————————————————————————————————————————————————————————————————' );
    for ( i = 0; i < imax; i += tkSize ) {
      str = '';
      t = tokens[ i ];
      tv = value( t );
      str += ( JSON.stringify( tv ).replace( /"/g, '' )  + pad ).slice( 0, 18 );
      str += ( ( tokens[ i + 1 ] & psMask ) + pad ).slice( 0, 4 );  // eslint-disable-line no-bitwise
      props = cache.properties( t, [ 'suffix', 'prefix', 'shape', 'lutCase', 'pos', 'tokenType' ] );
      for ( j = 0; j < props.length; j += 1 ) {
        str += ( JSON.stringify( props[ j ] ).replace( /"/g, '' ) + pad ).slice( 0, 8 );
      }
      if ( tokens[ i + 1 ] > 65535 ) {
        str += ' ' + value( cache.nox( tokens[ i + 1 ] ) ); // eslint-disable-line no-bitwise
      } else {
        str += ' ' + JSON.stringify( value( cache.normal( t ) ) ).replace( /"/g, '' );
      }
      console.log( str );
    }

    // Print total number of tokens.
    console.log( '\n\ntotal number of tokens: %d', count() );
  };

  var out = function () {
    var dt = [];
    var imax = tokens.length;
    var i;
    var t;

    for ( i = 0; i < imax; i += tkSize ) {
      t = tokens[ i ];
      dt.push( ''.padEnd( tokens[ i + 1 ] & psMask ), value( t ) );  // eslint-disable-line no-bitwise
    }

    return dt.join( '' );
  };

  // ## addTokenIfInCache
  /**
   *
   * Adds a token corresponding to the input `text` if it is found in cache i.e.
   * not an OOV. The addition process ensures the following:
   * 1. Preceding spaces are added.
   * 2. If text is a contraction, it expansions are added. Since expansins
   * consists of lexeme, normal, lemma and pos, all of these are added to the
   * token structure.
   *
   * @param {string} text to be added as token.
   * @param {number} precedingSpaces to the `text` as parsed by tokenizer.
   * @returns {boolean} `truthy` if `text` is found in cache otherwise `falsy`.
   * @private
  */
  var addTokenIfInCache = function ( text, precedingSpaces ) {
    // The array `tokenIndex` will contain 1-element if `text` is not a predefined
    // contraction; otherwise it will contain `n x 4` elements, where `n` is the
    // number of expansions.
    var tokenIndex = cache.lookup( text );
    // Temp for preceding space in case of contarction.
    var ps;
    // Temp for lemma & pos.
    var lemma, pos;

    // `UNK` means 0 or `falsy`; it flags that token has not been added.
    if ( tokenIndex === null ) return UNK;

    if ( tokenIndex.length === 1 ) {
      tokens.push( tokenIndex[ 0 ], precedingSpaces, 0, 0 );
    } else {
      // Contraction, itereate through each expansion.
      for ( let k = 0; k < tokenIndex.length; k += xpSize ) {
        // The `precedingSpaces` will be 0 except for the first expansion.
        ps = ( k === 0 ) ? precedingSpaces : 0;
        // Concatenate pointer to normal contained in `xpansions` with preceding
        // spaces.
        ps |= ( tokenIndex[ k + 1 ] << bits4PrecedingSpace ); // eslint-disable-line no-bitwise
        // Lemma & POS are fixed mostly for all contractions.
        lemma = tokenIndex[ k + 2 ];
        pos   = tokenIndex[ k + 3 ];
        // Add token; annotations may be filled later in the pipeline.
        tokens.push( tokenIndex[ k ], ps, ( lemma | ( pos << bits4lemma ) ), 0 ); // eslint-disable-line no-bitwise
      }
    }
    // Return `truthy`, indicating that token(s) has been added successfully.
    return 99;
  };

  var isLexeme = function ( text ) {
    // Return `truthy` if the word is found. Note for `$%^OOV^%$`, it returns
    // `0` i.e. `falsy`!
    return cache.lookup( text );
  };

  // Private methods.
  methods._addToken = addToken;
  methods._addTokenIfInCache = addTokenIfInCache;

  // Public methods.
  methods.count = count;
  methods.isLexeme = isLexeme;
  methods.printTokens = printTokens;
  methods.out = out;
  methods.tokens = tokens1;
  methods.tokenProp = tokenProp;


  return methods;
};

module.exports = doc;

},{"./constants.js":6}],8:[function(require,module,exports){
(function (process){
/* eslint-disable no-console */

var winkNLP = require( './wink-nlp.js' );
var sentence;

sentence = '    🎉@superman: हिंदी   🎉समाचार,  3rd \n hit ... 1st 1st me me \n up on my e-mail:  r2d2@gmail.com, 2.0,, of us plan party 🎉🎉, tom at 3pm :) #fun  .';
// sentence = '   @superman: 1st me up on my email r2d2@gmail.com; & we will   plan:) 🎉party🎉🎉 🎉 🎉  <34pm:D  🎉 tom at 3pm:) :) my 1st #fun';
// sentence = '1st 1st 1st 1st 1st 1st 23rd 24th';
// sentence = '      🎉@superman:';

// sentence = 'The Iraqi government has agreed to let U.S. Rep. Tony Hall visit the country next week to assess a humanitarian crisis that has festered since the Gulf War of 1990, Hall\'s office said Monday.';
// sentence = '   @superman: 1st हिंदी me up on my email r2d2@gmail.com; & \t we\t\r will plan party 🎉 🎉 🎉 🎉\n\r    \t <34pm:D 🎉 tom at 3pm :) :) my 1st #fun';
sentence = '@superman:हिंदी,  3rd hit... 1st 1st me   up on my e-mail:r2d2@gmail.com, 2.0,, of us plan party🎉🎉, tom at \'3pm:)#fun.';
// sentence = 'bcoz because cuz';

// var fs = require( 'fs' );
//
// sentence = fs.readFileSync( './test-input.txt', 'utf8' ); // eslint-disable-line no-sync

// sentence = 'I. L.L.Beans is (Jr.) Ff-1   \n pappu@gmail.com  (I.I.T.) I.I.T\'s  a "great\'s" Person O\'Hara,! ("well-being") I.I.T.\'s canteen.';
// sentence = 'In addition, Citi and American Airlines introduced enhanced benefits on the Citi®/ AAdvantage® Platinum Select® and the CitiBusiness®/AAdvantage® Platinum Select® World Mastercard®.';
// sentence = '"Oh, no," she\'s saying, "our $400 blender can\'t handle something this hard!"';
// sentence = 'fjmott|colinw|biesg@ldc.upenn.edu; at9a@york.ac.uk';
// sentence = 'The rise of "Not X" anonymous blogs and comments, where X=someone well-known, seems to me to be a particularly pernicious form of anonymity.';
// sentence = 'F-16/F-15 were manufactured by AT&T; whereas 1/5 is one by five:p#fun! And how about: ‘I’m a—I’m a—’ – and ’90s English –– well-done!';
// sentence = 'Diff. b\'tween James\' dog with a "\'" and James\'s dogs.  1st is pl. &2nd is possess\'ve. "Wink-nlp" tokenizes -- 1.5 m. tokens in \'1/5th\' of the Raby\'s \'tool:-)';
// sentence = '"Co.," met "F.A.A\'s" issue [met] at 3/2/5 r4ch-n4.';
// sentence = '("Trump Dr.\'s")';
// sentence = '🎉Mr.-:)';
// sentence = 'U.N.-sponsored';
// sentence = 'U.N.-U.N.-sanctioned';
// sentence = '‘I—I hardly know  ‘I’m a—I’m a—’  Cat. ‘I’d nearly forgotten to ask.’';
// sentence = 'The 80s 20,000.00 98-730-10459 http://www.islamonline.net/Arabic/news/2004-12/05/images/pic05b.jpg http://www.mofa.gov.sa/detail.asp?InNewsItemID=59090&InTemplateKey=printrayhanenajib@menara.ma x';
// sentence = 'I met her in (* - \'80s- *) \"and/or) -\'cause\'';
// sentence = 'Here is a great news — Pappu pass ho gaya — HaHaHaHa. Recognise this? can\'t i\'ll\'ve';
sentence = 'Pappu pass ho gaya — HaHaHa. Recognise it? I *can\'t* do! i\'ll\'ve to do!';
sentence = 'Wolfgang Amadeus Mozart (27 January 1756 – 5 December 1791), baptised as Johannes Chrysostomus Wolfgangus Theophilus Mozart, was a prolific and influential composer of the classical era.';
console.log();
console.log( JSON.stringify( sentence ) );
console.log();

if ( process.argv[ 3 ] ) sentence = process.argv[ 3 ];

var nlp = winkNLP( );

nlp.load( 'en' );
console.time( 'perf' );
var doc = nlp.readDoc( sentence  );
console.timeEnd( 'perf' );

doc.printTokens();

console.log( sentence.split( /[ ]+/ ).length );
console.log( doc.out() === sentence );

}).call(this,require('_process'))
},{"./wink-nlp.js":11,"_process":16}],9:[function(require,module,exports){
/* eslint-disable no-underscore-dangle */

// Used in accessing the regex and its category from `rgxs`.
const RGX = 0;
const CAT = 1;
// Regexes to handle short forms or abbreviations.
var rgxShortForm = /^(?:(?:[A-Z])(?:\.))+$/i;

// ### tokenizer
/**
 *
 * Creates an instance of `tokenizer`.
 *
 * @param {object} categories token categories, as obtained via the language model.
 * @return {function} for recursive tokenization.
 * @private
*/
var tokenizer = function ( categories ) {
  // Function to add tokens to the `doc()`.
  var addToken;
  var addTokenIfInCache;
  // Function to test if lexeme exists via `doc()`.
  var isLexeme;
  // Preceding Spaces — special need for recursive tokenizer.
  var ps = 0;

  // ### tokenizeTextUnit
  /**
   *
   * Attempts to tokenize the input `text` using the `rgxSplit`. The tokenization
   * is carried out by combining the regex matches and splits in the right sequence.
   * The matches are the *real tokens*, whereas splits are text units that are
   * tokenized in later rounds! The real tokens (i.e. matches) are pushed as
   * `object` and splits as `string`.
   *
   * @param {string} text unit that is to be tokenized.
   * @param {object} rgxSplit object containing the regex and it's category.
   * @return {array} of tokens.
   * @private
  */
  var tokenizeTextUnit = function ( text, rgxSplit ) {
    // Regex matches go here; note each match is a token and has the same tag
    // as of regex's category.
    var matches = text.match( rgxSplit[ RGX ] );
    // Balance is "what needs to be tokenized".
    var balance = text.split( rgxSplit[ RGX ] );
    // The result, in form of combination of tokens & matches, is captured here.
    var tokens = [];
    // The tag;
    var tag = rgxSplit[ CAT ];
    // Helper variables.
    var i,
        imax,
        k,
        t, // Temp token.
        tp; // Temp token with a period sign in end.

    // console.log( matches, balance, text, tag, balance[ 1 ] ); // eslint-disable-line no-console
    // A `null` value means it is equivalent to no matches i.e. an empty array.
    matches = ( matches ) ? matches : [];
    // Handle cases where the word is ending with period for **word category**.
    // Iterate in [ m0 b1 m1 ... ] pattern as `b0` has no value here.
    k = 0;
    if ( tag === categories.word ) {
      for ( i = 1, imax = balance.length; i < imax; i += 1 ) {
        t = balance[ i ];
        if ( k < matches.length && t[ 0 ] === '.' ) {
          tp = matches[ k ] + '.';
          if ( isLexeme( tp ) || rgxShortForm.test( tp ) ) {
            matches[ k ] = tp;
            balance[ i ] = t.slice( 1 );
          }
        }
        k += 1;
      }
    }
    // console.log( matches, balance, text, tag, balance[ 1 ] ); // eslint-disable-line no-console
    // Combine tokens & matches in the following pattern [ b0 m0 b1 m1 ... ]
    k = 0;
    for ( i = 0, imax = balance.length; i < imax; i += 1 ) {
      t = balance[ i ];
      t = t.trim();
      if ( t ) tokens.push( t );
      if ( k < matches.length ) {
        tokens.push( [ matches[ k ], tag ] );
      }
      k += 1;
    }

    return ( tokens );
  }; // tokenizeTextUnit()

  // ### tokenizeTextRecursively
  /**
   *
   * Tokenizes the input text recursively using the array of `regexes` and then
   * the `tokenizeTextUnit()` function. If (or whenever) the `regexes` becomes
   * empty, it simply splits the text on non-word characters instead of using
   * the `tokenizeTextUnit()` function.
   *
   * @param {string} text unit that is to be tokenized.
   * @param {object} regexes object containing the regex and it's category.
   * @return {undefined} nothing!
   * @private
  */
  var tokenizeTextRecursively = function ( text, regexes ) {
    var sentence = text.trim();
    var tokens = [];
    // Helpers – for loop variables & token category.
    var i, imax;
    var cat;

    if ( !regexes.length ) {
      // No regex left, this is the true **unk**.
      // Becuase it is `UNK`, we can use `addToken` instead of attempting
      // `addTokenIfInCache`.
      addToken( text, categories.unk, ps );
      ps = 0;
      return;
    }

    var rgx = regexes[ 0 ];
    tokens = tokenizeTextUnit( sentence, rgx );

    for ( i = 0, imax = tokens.length; i < imax; i += 1 ) {
      if ( typeof tokens[ i ] === 'string' ) {
        // Strings become candidates for further tokenization.
        tokenizeTextRecursively( tokens[ i ], regexes.slice( 1 ) );
      } else {
        // Use the passed value of preceding spaces only once!
        // First try cache, otherwise make a direct addition. This ensures
        // processing of expansions.
        cat = addTokenIfInCache( tokens[ i ][ 0 ], ps );
        if ( cat === categories.unk ) addToken( tokens[ i ][ 0 ], tokens[ i ][ 1 ], ps );
        // Reset `ps` to **0** as there can never be spaces in a text passed to
        // this tokenizer.
        ps = 0;
      }
    }
  }; // tokenizeTextRecursively()

  // ### tokenize
  /**
   *
   * Tokenizes the input `sentence` using the function `tokenizeTextRecursively()`.
   * This acts as the fall back tokenizer to the **linear tokenizer**.
   *
   * @method Tokenizer#tokenize
   * @param {RegExp} rgxs containg regexes for parsing.
   * @param {string} text the input sentence.
   * @param {number} precedingSpaces to the text
   * @param {object} doc contains the document; used here for adding tokens.
   * @return {void} nothing!
   * `value` and its `tag` identifying the type of the token.
   * @private
  */
  var tokenize = function ( rgxs, text, precedingSpaces, doc ) {
    // Cache frequently used doc methods.
    addToken = doc._addToken;
    addTokenIfInCache = doc._addTokenIfInCache;
    isLexeme = doc.isLexeme;
    // Set `ps` to the passed value of preceding spaces, it will be reset to **0**
    // after first use during recursion.
    ps = precedingSpaces;
    tokenizeTextRecursively( text, rgxs, precedingSpaces );
  }; // tokenize()

  return tokenize;
};

module.exports = tokenizer;

},{}],10:[function(require,module,exports){
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */

var recTokenizer = require( './recursive-tokenizer.js' );

// This is inspired by `wink-tokenizer`, which is regex driven and
// used recursion. While this still driven by regexes, it does not use recursion.
// The algorithm is outlined below:
// 1. First split on a **single space** character to obtain all the tokens including
//    extra spaces between the tokens (if any). Remember, the extra spaces will
//    appear as empty strings in the array.
// 2. Test each token with `categoryRgxs` and tag its category accordingly. Each regex in
//    this array tests one unique token category, viz. **word**, **number**, or
//    **email**. This array is sorted in the decreasing order of the probability
//    of occurence of token type that it tests — this ensures higher
//    execution speed.

var tokenizer = function ( trex, categories ) {
  // Maximum number of preceding spaces allowed.
  var maxPrecedingSpaces = 65535;
  var processFunctions = [];
  var rgxCatDetectors = trex.ltc;
  var tokenizeRecursively = recTokenizer( categories );
  // Initialize helper regexes.
  var rgxAnyWithRP = trex.helpers.anyWithRP;
  var rgxAnyWithLP = trex.helpers.anyWithLP;
  var rgxLPanyRP = trex.helpers.LPanyRP;
  var rgxSplitter = trex.helpers.splitter;

  var detectTokenCategory = function ( token ) {
    // console.log( token );
    var cat;
    for ( cat = 0; cat < rgxCatDetectors.length; cat += 1 ) {
      // console.log( token, rgxCatDetectors[ cat ][ 0 ].test( token ),  rgxCatDetectors[ cat ][ 1 ] )
      if ( rgxCatDetectors[ cat ][ 0 ].test( token ) ) return rgxCatDetectors[ cat ][ 1 ];
    }
    return categories.unk;
  }; // detectTokenCategory()


  var processUnk = function ( text, cat, precedingSpaces, doc ) {
    // Match is captured here.
    var match;
    // Splitted non-punctuation portion's category.
    var splitCat;

    // Match with any thing followed by a **right** punctuation.
    match = text.match( rgxAnyWithRP );
    // Non-null indicates that there was a right punctuation in the end.
    if ( match ) {
      // Safely add the text prior to punkt if in cache.
      splitCat = doc._addTokenIfInCache( match[ 1 ], precedingSpaces );
      if ( splitCat === categories.unk ) {
        // Try detecting token category before falling back to recursion.
        splitCat = detectTokenCategory( match[ 1 ] );
        if ( splitCat  === categories.unk ) {
          // Still 'unk', handle it via recursive tokenizer.
          tokenizeRecursively( trex.rtc, text, precedingSpaces, doc );
        } else {
          // Because it is a detected category use `processFunctions()`.
          processFunctions[ splitCat ]( match[ 1 ], splitCat, precedingSpaces, doc );
          doc._addToken( match[ 2 ], categories.punctuation, 0 );
        }
      } else {
        // The split is a added via `addTokenIfInCache()`, simply add the balance.
        doc._addToken( match[ 2 ], categories.punctuation, 0 );
      }
      // All done so,
      return;
    }
    // Match with any thing followed by a **left** punctuation.
    match = text.match( rgxAnyWithLP );
    // Now non-null indicates that there was a left punctuation in the beginning.
    if ( match ) {
      // If match 2 is a valid lexeme, can safley add tokens. Notice insertion
      // sequence has reversed compared to the previous if block.
      if ( doc.isLexeme( match[ 2 ] ) ) {
        doc._addToken( match[ 1 ], categories.punctuation, precedingSpaces );
        doc._addTokenIfInCache( match[ 2 ], 0 );
      } else {
        // Try detecting token category before falling bac k to recursion.
        splitCat = detectTokenCategory( match[ 2 ] );
        if ( splitCat  === categories.unk ) {
          // Still 'unk', handle it via recursive tokenizer.
          tokenizeRecursively( trex.rtc, text, precedingSpaces, doc );
        } else {
          // Because it is a detected category use `processFunctions()`.
          doc._addToken( match[ 1 ], categories.punctuation, precedingSpaces );
          processFunctions[ splitCat ]( match[ 2 ], splitCat, 0, doc );
        }
      }
      // All done so,
      return;
    }
    // Punctuation on both sides!
    match = text.match( rgxLPanyRP );
    if ( match ) {
      // If match 2 is a valid lexeme, can safley add tokens.
      if ( doc.isLexeme( match[ 2 ] ) ) {
        doc._addToken( match[ 1 ], categories.punctuation, precedingSpaces );
        doc._addTokenIfInCache( match[ 2 ], 0 );
        doc._addToken( match[ 3 ], categories.punctuation, 0 );
      } else {
        // Try detecting token category before falling bac k to recursion.
        splitCat = detectTokenCategory( match[ 2 ] );
        if ( splitCat  === categories.unk ) {
          // Still 'unk', handle it via recursive tokenizer.
          tokenizeRecursively( trex.rtc, text, precedingSpaces, doc );
        } else {
          // Because it is a detected category use `processFunctions()`.
          doc._addToken( match[ 1 ], categories.punctuation, precedingSpaces );
          processFunctions[ splitCat ]( match[ 2 ], splitCat, 0, doc );
          doc._addToken( match[ 3 ], categories.punctuation, 0 );
        }
      }
      // All done so,
      return;
    }

    // Nothing worked, treat the whole thing as `unk` and fallback to recursive tokenizer.
    tokenizeRecursively( trex.rtc, text, precedingSpaces, doc );
  }; // processUnk()

  // var processWord = function ( token, cat, precedingSpaces, doc ) {
  //   doc._addToken( token, cat, precedingSpaces );
  // }; // processWord()

  var processWordRP = function ( token, cat, precedingSpaces, doc ) {
    // Handle **special case**, `^[a-z]\.$` will arrive here instead of `shortForm`!
    var tl = token.length;
    if ( tl > 2 ) {
      doc._addToken( token.slice( 0, -1 ), categories.word, precedingSpaces );
      doc._addToken( token.slice( -1 ), categories.punctuation, 0 );
    } else if ( tl === 2 && token[ tl - 1 ] === '.' ) {
        doc._addToken( token, categories.word, precedingSpaces );
      } else {
        doc._addToken( token.slice( 0, -1 ), categories.word, precedingSpaces );
        doc._addToken( token.slice( -1 ), categories.punctuation, 0 );
      }
  }; // processWordRP()

  var processDefault = function ( token, cat, precedingSpaces, doc ) {
    doc._addToken( token, cat, precedingSpaces );
  }; // processDefault()

  var tokenize = function ( doc, text ) {
    // Raw tokens, obtained by splitting them on spaces.
    var rawTokens = [];
    // Contains the number of spaces preceding a token.
    var precedingSpaces = 0;
    // Pointer to the `rawTokens`, whereas `pp` is the previous pointer!
    var p;
    // Token category as detected by the `detectTokenCategory()` function.
    var cat;
    // A temporary token!
    var t;

    rawTokens = text.split( rgxSplitter );

    // Now process each raw token.
    for ( p = 0; p < rawTokens.length; p += 1 ) {
      t = rawTokens[ p ];
      // Skip empty (`''`) token.
      if ( !t ) continue; // eslint-disable-line no-continue
      // Non-empty token:
      if ( t[ 0 ] === ' ' ) {
        // This indicates spaces: count them.
        precedingSpaces = t.length;
        // Cap precedingSpaces to a limit if it exceeds it.
        if ( precedingSpaces > maxPrecedingSpaces ) precedingSpaces = maxPrecedingSpaces;
      } else {
        // A potential token: process it.
        cat = doc._addTokenIfInCache( t, precedingSpaces );
        if ( cat === categories.unk ) {
          cat = detectTokenCategory( t );
          processFunctions[ cat ]( t, cat, precedingSpaces, doc );
        }
        precedingSpaces = 0;
      }
    } // for
  }; // tokenize()

  // Main Code:
  // Specific Processes.
  processFunctions[ categories.unk ] = processUnk;
  processFunctions[ categories.wordRP ] = processWordRP;

  // Default process.
  processFunctions[ categories.emoji ] = processDefault;
  processFunctions[ categories.word ] = processDefault;
  processFunctions[ categories.shortForm ] = processDefault;
  processFunctions[ categories.number ] = processDefault;
  processFunctions[ categories.url ] = processDefault;
  processFunctions[ categories.email ] = processDefault;
  processFunctions[ categories.mention ] = processDefault;
  processFunctions[ categories.hashtag ] = processDefault;
  processFunctions[ categories.emoticon ] = processDefault;
  processFunctions[ categories.time ] = processDefault;
  processFunctions[ categories.ordinal ] = processDefault;
  processFunctions[ categories.currency ] = processDefault;
  processFunctions[ categories.punctuation ] = processDefault;
  processFunctions[ categories.symbol ] = processDefault;
  processFunctions[ categories.tabCRLF ] = processDefault;
  processFunctions[ categories.apos ] = processDefault;
  processFunctions[ categories.alpha ] = processDefault;
  processFunctions[ categories.decade ] = processDefault;

  return tokenize;
}; // tokenizer()

module.exports = tokenizer;


/*
0. value
1. normal
2. lemma
3. tag
4. pos
5. cpos
6. stop
7. sentiment
8. shape
9. prob
10. suffix
11. prefix
*/

},{"./recursive-tokenizer.js":9}],11:[function(require,module,exports){
// var Doc = require( './doc-without-cache.js' );
var Doc = require( './doc.js' );
var Cache = require( './cache.js' );
var tokenizer = require( './tokenizer.js' );
var compileTRex = require( './compile-trex.js' );
// var readModel = require( '/Users/neilsbohr/dev/vocabulary/src/create/read-model.js' );
// Use **relative path** to keep things flexible.
var readModel = require( '../../wink-nlp-model-builder/src/read-model.js' );

/**
 * @class NLP
 * @classdesc Describes the methods of NLP instance created via `nlp()`.
 * @hideconstructor
*/

/**
 * Creates an instance of {@link NLP}.
 *
 * @returns {NLP} object conatining set of API methods for natural language processing.
 * @example
 * const nlp = require( 'wink-nlp' );
 * var myNLP = nlp();
*/
var nlp = function ( ) {

  var methods = Object.create( null );
  // Token Regex; compiled from `model`
  var trex;
  // wink-nlp language `model`.
  var model;
  // Holds instance of `cache` created using the `model`.
  var cache;
  // Configured tokenize.
  var tokenize;

  var load = function (  ) {

    // model = readModel( '/Users/neilsbohr/dev/my-nlp/src/en-wink-nlp.bin' );
    model = readModel( '../wink-nlp-model-builder/src/languages/en/model/en-wink-nlp.bin' );
    // Capture intrinsic size of chosen features i.e. the ones that have
    // `model.packing.layout[ f ][ 3 ]` set to `0`. Also initialize their
    // index, required for new value addition. The access methods differ
    // if indexes > intrinsic size of a feature.
    // ALSO build the efList here itself.
    model.packing.efList = [];
    for ( const f in model.packing.layout ) { // eslint-disable-line guard-for-in
      // Capture intrinsic size.
      if ( model.packing.layout[ f ][ 3 ] === 0 ) {
        model.features[ f ].intrinsicSize = model.features[ f ].list.length;
        model.features[ f ].index = model.features[ f ].list.length;
      }
      // Build the efList.
      if ( model.packing.layout[ f ][ 4 ] === 1 ) {
        model.packing.efList.push( f );
      }
    }
    // Finally the `lexeme` as it is not really counted as a feature.
    model.features.lexeme.intrinsicSize = model.features.lexeme.list.length;
    model.features.lexeme.index = model.features.lexeme.list.length;
    // With `intrinsicSize` captured, instantiate cache etc.
    cache = Cache( model ); // eslint-disable-line new-cap
    trex = compileTRex( model.trex );

    tokenize = tokenizer( trex, model.tcat.hash );
  }; // load()

  /**
   * Loads a single document to be processed.
   *
   * @method NLP#readDoc
   * @param {string} document The document that you want to process.
   * @returns {Collection} the document.
   * @example
   * const DOC = "The quick brown fox jumps over the lazy dog";
   * myNLP.readDoc(DOC);
  */
  var readDoc = function ( document ) {
    var doc = Doc( cache ); // eslint-disable-line new-cap
    tokenize( doc, document );

    return doc;
  }; // process()

  methods.load = load;
  methods.readDoc = readDoc;

  return methods;
}; // wink

module.exports = nlp;

},{"../../wink-nlp-model-builder/src/read-model.js":2,"./cache.js":4,"./compile-trex.js":5,"./doc.js":7,"./tokenizer.js":10}],12:[function(require,module,exports){

},{}],13:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],14:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":13,"ieee754":15}],15:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],16:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[8]);
