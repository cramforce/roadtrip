let position;
let manualPosition = false;
let map;
let locationData;
let cancelSpeaking;
let skipThisParagraph;
const state = {
  playing: false,
  loading: false,
  paused: false,
};
const pollSeconds = 30;

const seen = {};

const interestingTypes = [
  'point_of_interest',
  'natural_feature',
  'neighborhood',
  'sublocality',
  'locality',
];

const languageMap = {
  'English (US)': {wikiTag: 'en', speechTag: 'en-US', welcomeMsg: 'Welcome to your road trip.'},
  'English (UK)': {wikiTag: 'en', speechTag: 'en-GB', welcomeMsg: 'Welcome to your road trip.'},
  'Français': {wikiTag: 'fr', speechTag: 'fr-FR', welcomeMsg: 'Bienvenue dans votre voyage.'},
  'Cebuano': {wikiTag: 'ceb', speechTag: 'ceb', welcomeMsg: 'Welcome sa imong pagbiyahe sa dalan.'},
  'Svenska': {wikiTag: 'sv', speechTag: 'sv-SE', welcomeMsg: 'Välkommen till din vägresa.'},
  'Deutsch': {wikiTag: 'de', speechTag: 'de-DE', welcomeMsg: 'Willkommen zu Ihrem Roadtrip.'},
  'Nederlands	': {wikiTag: 'nl', speechTag: 'nl-NL', welcomeMsg: 'Welkom bij je roadtrip.'},
  'русский': {wikiTag: 'ru', speechTag: 'ru-RU', welcomeMsg: 'Добро пожаловать в свою поездку.'},
  'Italiano': {wikiTag: 'it', speechTag: 'it-IT', welcomeMsg: 'Benvenuto nel tuo viaggio.'},
  'Español': {wikiTag: 'es', speechTag: 'es', welcomeMsg: 'Bienvenido a tu viaje.'},
  'Polski': {wikiTag: 'pl', speechTag: 'pl-PL', welcomeMsg: 'Witamy w podróży.'},
  'Tiếng Việt': {wikiTag: 'vi', speechTag: 'vi-VN', welcomeMsg: 'Chào mừng bạn đến với chuyến đi của bạn.'},
  '日本語': {wikiTag: 'ja', speechTag: 'ja-JP', welcomeMsg: 'あなたのロードトリップへようこそ。'},
  '中文': {wikiTag: 'ch', speechTag: 'zh-CN', welcomeMsg: '欢迎来到您的公路旅行。'},
  'Português (PT)': {wikiTag: 'pt', speechTag: 'pt-PT', welcomeMsg: 'Bem-vindo à sua viagem.'},
  'Português (BR)': {wikiTag: 'pt', speechTag: 'pt-BR', welcomeMsg: 'Bem-vindo à sua viagem.'},
  'українська': {wikiTag: 'uk', speechTag: 'uk-UA', welcomeMsg: 'Ласкаво просимо до дорожньої подорожі.'},
  'فارسی': {wikiTag: 'fa', speechTag: 'fa-IR', welcomeMsg: 'به سفر جاده ای شما خوش آمدید'},
  'српски': {wikiTag: 'sr', speechTag: 'sr-BA', welcomeMsg: 'Добродошли на путовање.'},
  'Català': {wikiTag: 'ca', speechTag: 'ca-ES', welcomeMsg: 'Benvingut al vostre viatge.'},
  'العربية': {wikiTag: 'ar', speechTag: 'ar', welcomeMsg: 'مرحبا بك في رحلتك'},
};

function wikiUrl(path, api, mobile) {
  let url = 'https://' + state.lang.wikiTag;
  if (mobile) url += '.m';
  return url + '.wikipedia.org/' + (api ? 'w/api.php?' : 'wiki/') + path
}

function startWatchLocation() {
  return new Promise(resolve => {
    navigator.geolocation.watchPosition(pos => {
      if (!manualPosition) {
        console.info('Updated position', pos);
        position = pos;
        if (map) {
          map.setCenter({lat: pos.coords.latitude, lng: pos.coords.longitude});
        }
      }
      resolve();
    }, error => {
      console.error('WatchPosition error.', error.message, error);
      alert('Failed to find your current location.')
    }, {
      enableHighAccuracy: false,
      maximumAge: 15000,
    });
  });
}

async function geoCode(position) {
  const response = await fetchWithTimeout('https://roadtrip-api.glitch.me/geocode?latlng='
      + position.coords.latitude + ',' + position.coords.longitude);
  if (response.ok) {
    const json = await response.json();
    //console.info('Geo coding result: ' + JSON.stringify(json));
    if (json.status == 'OK') {
      return json.results;
    } else {
      throw new Error('Reverse geocoding failed: ' + JSON.stringify(json));
    }
  } else {
    const text = await response.text();
    throw new Error('Reverse geocoding failed: ' + text);
  }
}

function processResult(results) {
  return results.filter(result => {
    let found = false ;
    result.types.forEach(type => {
      let index = interestingTypes.indexOf(type);
      if (index == -1) {
        return;
      }
      if (!result.interestingness || result.interestingness > index) {
        result.interestingness = index;
        console.info('Location candidate', result.formatted_address, result.types);
        found = true;
      }
    });
    return found;
  }).sort((a, b) => a.interestingness - b.interestingness);
}

async function searchWikipedia(term) {
  const response = await fetchWithTimeout(wikiUrl('action=opensearch&format=json&origin=*&limit=1&search=' + encodeURIComponent(term), true));
  if (!response.ok) {
    console.error('Wikipedia call failed', response)
    throw new Error('Wikipedia search is down');
  }
  const json = await response.json();
  console.info('Search response', term, json);
  const title = json[1][0]
  if (title) {
    return title;
  }
  const parts = term.split(/\,\s+/);
  parts.pop();
  const newTerm = parts.join(', ');
  if (newTerm) {
    return searchWikipedia(newTerm);
  }
  return null;
}

async function getContent(title) {
  console.info('Getting content');
  const response = await fetchWithTimeout(wikiUrl('redirects=true&format=json&origin=*&action=query&prop=extracts&titles=' + encodeURIComponent(title), true));
  if (!response.ok) {
    console.error('Wikipedia content call failed', response)
    throw new Error('Wikipedia content is down');
  }
  const json = await response.json();
  const page = Object.values(json.query.pages)[0];
  console.info('Page', page)
  seen[page.title] = true;
  return {
    url: wikiUrl(encodeURIComponent(page.title), false),
    title: page.title,
    content: simpleHtmlToText(page.extract.trim()),
    lang: state.lang.speechTag,
  };
}

async function getArticleForLocation() {
  console.info('Geo coding');
  const locationResults = processResult(await geoCode(position));
  console.info('Location results retrieved', locationResults.length);
  let result;
  while (result = locationResults.find(r => !seen[r.formatted_address])) {
    seen[result.formatted_address] = true;
    console.info('Searching for', result.formatted_address);
    const title = await searchWikipedia(result.formatted_address);
    if (!title) {
      continue;
    }
    console.info('Title', title);
    return getContent(title);
  };
  return null;
}

async function getNearbyArticle() {
  console.info('Finding nearby article');
  const response = await fetchWithTimeout(wikiUrl('action=query&format=json&origin=*&generator=geosearch&ggsradius=10000&ggsnamespace=0&ggslimit=50&formatversion=2&ggscoord=' + encodeURIComponent(position.coords.latitude) + '%7C' + encodeURIComponent(position.coords.longitude), true, true));
  if (!response.ok) {
    console.error('Wikipedia nearby failed', response)
    throw new Error('Wikipedia nearby is down');
  }
  const json = await response.json();
  console.info('Nearby response', json);
  const pages = json.query.pages;
  for (let page of pages) {
    const title = page.title;
    if (seen[title]) {
      continue;
    }
    seen[title] = true;
    console.info('Title', title);
    return getContent(title);
  }
  return null;
}

async function speak(text, language) {
  // Mobile Chrome doesn't like long texts, so we just do one sentence at a time.
  // Make a sentence end a paragraph end. \w\w to not match e.g.
  const paras = text.split(/\n/).filter(p => p.trim());
  for (let p of paras) {
    p = p.replace(/(\w\w\.)/, '$1\n')
    const sentences = p.split(/\.\n/).filter(e => e.trim());
    for (let sentence of sentences) {
      await speakSentence(sentence, language);
      if (cancelSpeaking) {
        cancelSpeaking = false;
        console.info('Cancel speaking');
        return;
      }
      if (skipThisParagraph) {
        skipThisParagraph = false;
        console.info('Skipping paragraph');
        break; // Goes to next step in paras loop
      }
    }
  }
  
}

function speakSentence(text, language) {
	var utterance = new SpeechSynthesisUtterance();
  utterance.text = text + '.';
  utterance.lang = language;
  console.info('Start speaking', utterance.text);
  let interval;
  return new Promise(resolve => {
    let spoke = false;
    interval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        spoke = true;
      }
      if (spoke && !window.speechSynthesis.speaking) {
        if (state.paused) {
          return;
        }
        console.info('Detected end of speaking without end event', utterance.text);
        resolve();
      }
    }, 100);
    utterance.onend = () => {
      console.info('End speaking', utterance.text);
      resolve();
    };
    utterance.onerror = e => {
      console.error('Error speaking', e.error, e);
      resolve();
    };
    utterance.onpause = () => console.info('Pause');
    utterance.onresume = () => console.info('Resume');
    window.speechSynthesis.speak(utterance);
  }).then(() => clearInterval(interval))
}

async function talkAboutLocation(article) {
  state.status = `Reading about <a href="${article.url}" target="_blank">${html(article.title)}</a>`;
  render();
  gtag('config', 'UA-121987888-1', {
    'page_title' : 'Article ' + article.title,
    'page_path': '/article/' + encodeURIComponent(article.title),
  });
  return speak(article.content, article.lang);
}

async function start() {
  state.playing = true;
  state.loading = true;
  state.lang = languageMap[$('language_inner_select').value];
  state.status = 'Finding your location.'
  render();
  const s = startWatchLocation();
  $('toast').MaterialSnackbar.showSnackbar({
    message: 'Please make sure your volume is turned up!',
    timeout: 10000,
  });
  await speak(state.lang.welcomeMsg + '\n\n', state.lang.speechTag);
  await s;
  next();
}

async function next() {
  console.info('Starting session');
  state.playing = true;
  state.loading = true;
  state.status = 'Finding something interesting to read. I\'ll keep checking as you move.'
  render();
  gtag('config', 'UA-121987888-1', {
    'page_title' : 'Next',
    'page_path': '/next/' + state.lang.speechTag,
  });
  try {
    console.info('Finding article.');
    let article = await getArticleForLocation();
    if (!article) {
      console.info('Did not find location article. Trying nearby.');
      article = await getNearbyArticle();
    }
    if (!article) {
      console.info('Did not find article');
      setTimeout(next, pollSeconds * 1000);
      return;
    }
    console.info('Retrieved article');
    state.loading = false;
    render();
    await talkAboutLocation(article);
  } catch (e) {
    console.error('Error :' + e, e);
    setTimeout(next, pollSeconds * 1000);
    return;
  }
  next();
}

function pause() {
  state.paused = true;
  render()
  window.speechSynthesis.pause();
}

function play() {
  state.paused = false;
  render()
  window.speechSynthesis.resume();
}

function forward() {
  cancelSpeaking = true;
  window.speechSynthesis.cancel();
}

function skipParagraph() {
  skipThisParagraph = true;
  window.speechSynthesis.cancel();
}

function render() {
  $('html_start').style.display = display(!state.playing);
  $('language_select').style.display = display(!state.playing);
  $('html_pause').style.display = display(!state.loading && state.playing && !state.paused);
  $('html_play').style.display = display(!state.loading && state.playing && state.paused);
  $('html_next').style.display = display(!state.loading && state.playing);
  $('html_skip').style.display = display(!state.loading && state.playing);
  $('html_spinner').style.display = display(state.loading);
  $('html_title').innerHTML = state.status;
}

function simpleHtmlToText(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  remove(div.querySelector('#References'));
  remove(div.querySelector('#See_also'));
  let text = div.textContent;
  text = text.replace(/(.)\n/g, '$1.\n');
  // Remove stuff in parantheses. Nobody wants to hear that stuff.
  // This isn't how you pass the Google interview.
  // But it is technically O(n)
  for (let i = 0; i < 10; i++) {
    text = text.replace(/\([^\)]+\)/g, '');
  }
  return text;
}

function remove(element) {
  if (!element) {
    return false;
  }
  return element.parentElement.removeChild(element);
}

function $(id) {
  return document.getElementById(id);
}

function display(bool) {
  return bool ? 'block' : 'none';
}

function html(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function initMap() {
  const startLoc = {lat: -34.397, lng: 150.644};
  map = new google.maps.Map($('map'), {
    center: startLoc,
    zoom: 11
  });
  map.centerMarker = new google.maps.Marker({
    position: startLoc,
    map: map,
    title: 'Current Location'
  });
  map.addListener('center_changed', e => {
    position = {
      coords: {
        longitude: map.getCenter().lng(),
        latitude: map.getCenter().lat(),
      }
    };
    map.centerMarker.setPosition({
      lat: map.getCenter().lat(), 
      lng: map.getCenter().lng()
    });
    console.info('Map position', position);
    manualPosition = true;
  });
}

function initLanguageSelect(selected) {
  var fragment = document.createDocumentFragment();

  for (let language of Object.keys(languageMap)) {
    var opt = document.createElement('option');
    opt.innerHTML = language;
    opt.value = language;
    fragment.appendChild(opt);
  }

  $('language_inner_select').appendChild(fragment);
  $('language_inner_select').value = selected;
}

function selectLang(langTag) {
  let selected = null;
  for (var langValue in languageMap) {
    if (languageMap[langValue].speechTag === langTag || languageMap[langValue].wikiTag === langTag) {
      selected = langValue;
      break;
    }
  }

  if (!selected) {
    selected = 'Browser Language (' + langTag + ')';
    languageMap[selected] = {
      speechTag: langTag,
      wikiTag: langTag.split('-')[0],
      welcomeMsg: ''
    };
  }
  initLanguageSelect(selected);
}

function timeout(time, message) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Timeout: ' + message)), time);
  })
}

function fetchWithTimeout(url, paras) {
  return Promise.race([fetch(url, paras), 
                       timeout(15 * 1000, 'Fetch timed out for ' + url)]);
}

async function guessLang() {
  const langTag = navigator.language;
  const wikiTag = langTag.split('-')[0];
  const response = await fetchWithTimeout('https://' + wikiTag + '.wikipedia.org/w/api.php?redirects=true&format=json&origin=*&action=query&prop=extracts&titles=Main_Page');
  if (response.ok) {
    console.info('Set language to browser language', langTag);
    return langTag;
  }
}

function init() {
  onunload = function() {
    window.speechSynthesis.cancel();
  }
  navigator.serviceWorker.register("/sw.js");

  const l = new URLSearchParams(location.search).get('lang');
  if (l) {
    selectLang(encodeURIComponent(l));
  }
  else {
    guessLang().then(selectLang);
  }
}

init();