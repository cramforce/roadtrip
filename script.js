let position;
let map;
let locationData;
let cancelSpeaking;
const state = {
  playing: false,
  loading: false,
  paused: false,
};
const pollSeconds = 60;

const seen = {};

const interestingTypes = [
  'point_of_interest',
  'natural_feature',
  'neighborhood',
  'sublocality',
  'locality',
];

const testData = {"results":[{"address_components":[{"long_name":"2943","short_name":"2943","types":["street_number"]},{"long_name":"Sea View Parkway","short_name":"Sea View Pkwy","types":["route"]},{"long_name":"Alameda","short_name":"Alameda","types":["locality","political"]},{"long_name":"Alameda County","short_name":"Alameda County","types":["administrative_area_level_2","political"]},{"long_name":"California","short_name":"CA","types":["administrative_area_level_1","political"]},{"long_name":"United States","short_name":"US","types":["country","political"]},{"long_name":"94502","short_name":"94502","types":["postal_code"]}],"formatted_address":"2943 Sea View Pkwy, Alameda, CA 94502, USA","geometry":{"bounds":{"northeast":{"lat":37.747773,"lng":-122.2450505},"southwest":{"lat":37.7476047,"lng":-122.2452242}},"location":{"lat":37.7476805,"lng":-122.2451375},"location_type":"ROOFTOP","viewport":{"northeast":{"lat":37.74903783029149,"lng":-122.2437883697085},"southwest":{"lat":37.74633986970849,"lng":-122.2464863302915}}},"place_id":"ChIJ-9VPsR-Ej4ARJuq2FoACiIY","types":["premise"]},{"address_components":[{"long_name":"101","short_name":"101","types":["street_number"]},{"long_name":"Norwich Road","short_name":"Norwich Rd","types":["route"]},{"long_name":"Alameda","short_name":"Alameda","types":["locality","political"]},{"long_name":"Alameda County","short_name":"Alameda County","types":["administrative_area_level_2","political"]},{"long_name":"California","short_name":"CA","types":["administrative_area_level_1","political"]},{"long_name":"United States","short_name":"US","types":["country","political"]},{"long_name":"94502","short_name":"94502","types":["postal_code"]},{"long_name":"6438","short_name":"6438","types":["postal_code_suffix"]}],"formatted_address":"101 Norwich Rd, Alameda, CA 94502, USA","geometry":{"location":{"lat":37.747451,"lng":-122.2448222},"location_type":"RANGE_INTERPOLATED","viewport":{"northeast":{"lat":37.74879998029149,"lng":-122.2434732197085},"southwest":{"lat":37.74610201970849,"lng":-122.2461711802915}}},"place_id":"EiYxMDEgTm9yd2ljaCBSZCwgQWxhbWVkYSwgQ0EgOTQ1MDIsIFVTQSIaEhgKFAoSCTmGDwgfhI-AEavC7Eyr1njcEGU","types":["street_address"]},{"address_components":[{"long_name":"Alameda","short_name":"Alameda","types":["locality","political"]},{"long_name":"Alameda County","short_name":"Alameda County","types":["administrative_area_level_2","political"]},{"long_name":"California","short_name":"CA","types":["administrative_area_level_1","political"]},{"long_name":"United States","short_name":"US","types":["country","political"]}],"formatted_address":"Alameda, CA, USA","geometry":{"bounds":{"northeast":{"lat":37.80062789999999,"lng":-122.2237791},"southwest":{"lat":37.70763,"lng":-122.3402809}},"location":{"lat":37.7652065,"lng":-122.2416355},"location_type":"APPROXIMATE","viewport":{"northeast":{"lat":37.80062789999999,"lng":-122.2237791},"southwest":{"lat":37.70763,"lng":-122.3402809}}},"place_id":"ChIJlRXP8tiAj4ARFG8BYM-Z_2Y","types":["locality","political"]},{"address_components":[{"long_name":"94502","short_name":"94502","types":["postal_code"]},{"long_name":"Alameda","short_name":"Alameda","types":["locality","political"]},{"long_name":"Alameda County","short_name":"Alameda County","types":["administrative_area_level_2","political"]},{"long_name":"California","short_name":"CA","types":["administrative_area_level_1","political"]},{"long_name":"United States","short_name":"US","types":["country","political"]}],"formatted_address":"Alameda, CA 94502, USA","geometry":{"bounds":{"northeast":{"lat":37.756237,"lng":-122.2263139},"southwest":{"lat":37.7186201,"lng":-122.2691161}},"location":{"lat":37.7339032,"lng":-122.2483726},"location_type":"APPROXIMATE","viewport":{"northeast":{"lat":37.756237,"lng":-122.2263139},"southwest":{"lat":37.7186201,"lng":-122.2691161}}},"place_id":"ChIJIQuG5BWEj4ARyXWkkCwE3Tg","types":["postal_code"]},{"address_components":[{"long_name":"Alameda County","short_name":"Alameda County","types":["administrative_area_level_2","political"]},{"long_name":"California","short_name":"CA","types":["administrative_area_level_1","political"]},{"long_name":"United States","short_name":"US","types":["country","political"]}],"formatted_address":"Alameda County, CA, USA","geometry":{"bounds":{"northeast":{"lat":37.9058239,"lng":-121.4692139},"southwest":{"lat":37.4545388,"lng":-122.3737821}},"location":{"lat":37.6016892,"lng":-121.7195459},"location_type":"APPROXIMATE","viewport":{"northeast":{"lat":37.9058239,"lng":-121.4692139},"southwest":{"lat":37.4545388,"lng":-122.3737821}}},"place_id":"ChIJWRd5NDfyj4ARc30TGxHHxmg","types":["administrative_area_level_2","political"]},{"address_components":[{"long_name":"San Francisco-Oakland-Fremont, CA","short_name":"San Francisco-Oakland-Fremont, CA","types":["political"]},{"long_name":"California","short_name":"CA","types":["administrative_area_level_1","political"]},{"long_name":"United States","short_name":"US","types":["country","political"]}],"formatted_address":"San Francisco-Oakland-Fremont, CA, CA, USA","geometry":{"bounds":{"northeast":{"lat":38.320945,"lng":-121.4692749},"southwest":{"lat":37.1073458,"lng":-123.024066}},"location":{"lat":37.8043507,"lng":-121.8107079},"location_type":"APPROXIMATE","viewport":{"northeast":{"lat":38.320945,"lng":-121.4692749},"southwest":{"lat":37.1073458,"lng":-123.024066}}},"place_id":"ChIJGUN8-q6Ij4ARZ1tA_OojshE","types":["political"]},{"address_components":[{"long_name":"San Francisco Metropolitan Area","short_name":"San Francisco Metropolitan Area","types":["political"]},{"long_name":"California","short_name":"CA","types":["administrative_area_level_1","political"]},{"long_name":"United States","short_name":"US","types":["country","political"]}],"formatted_address":"San Francisco Metropolitan Area, CA, USA","geometry":{"bounds":{"northeast":{"lat":38.320945,"lng":-121.4692139},"southwest":{"lat":37.0538579,"lng":-123.173825}},"location":{"lat":37.7749274,"lng":-122.4194254},"location_type":"APPROXIMATE","viewport":{"northeast":{"lat":38.320945,"lng":-121.4692139},"southwest":{"lat":37.0538579,"lng":-123.173825}}},"place_id":"ChIJE156BviCj4ARKrqKa5lkEu4","types":["political"]},{"address_components":[{"long_name":"California","short_name":"CA","types":["administrative_area_level_1","political"]},{"long_name":"United States","short_name":"US","types":["country","political"]}],"formatted_address":"California, USA","geometry":{"bounds":{"northeast":{"lat":42.0095169,"lng":-114.131211},"southwest":{"lat":32.528832,"lng":-124.482003}},"location":{"lat":36.778261,"lng":-119.4179324},"location_type":"APPROXIMATE","viewport":{"northeast":{"lat":42.0095169,"lng":-114.131211},"southwest":{"lat":32.528832,"lng":-124.482003}}},"place_id":"ChIJPV4oX_65j4ARVW8IJ6IJUYs","types":["administrative_area_level_1","political"]},{"address_components":[{"long_name":"United States","short_name":"US","types":["country","political"]}],"formatted_address":"United States","geometry":{"bounds":{"northeast":{"lat":71.5388001,"lng":-66.885417},"southwest":{"lat":18.7763,"lng":170.5957}},"location":{"lat":37.09024,"lng":-95.712891},"location_type":"APPROXIMATE","viewport":{"northeast":{"lat":49.38,"lng":-66.94},"southwest":{"lat":25.82,"lng":-124.39}}},"place_id":"ChIJCzYy5IS16lQRQrfeQ5K5Oxw","types":["country","political"]}],"status":"OK"}

function startWatchLocation() {
  return new Promise(resolve => {
    navigator.geolocation.watchPosition(pos => {
      console.info('Updated position', pos);
      position = pos;
      if (map) {
        map.setCenter({lat: pos.coords.latitude, lng: pos.coords.longitude});
      }
      resolve();
    });
  });
}

async function geoCode(position) {
  const response = await fetch('https://roadtrip-api.glitch.me/geocode?latlng='
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
  const response = await fetch('https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&limit=1&search='
      + encodeURIComponent(term));
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
  const response = await fetch('https://en.wikipedia.org/w/api.php?redirects=true&format=json&origin=*&action=query&prop=extracts&titles='
      + encodeURIComponent(title));
  if (!response.ok) {
    console.error('Wikipedia content call failed', response)
    throw new Error('Wikipedia content is down');
  }
  const json = await response.json();
  const page = Object.values(json.query.pages)[0];
  console.info('Page', page)
  return {
    url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(page.title),
    title: page.title,
    content: simpleHtmlToText(page.extract.trim())
  };
}

async function getArticleForLocation() {
  const locationResults = processResult(await geoCode(position));
  let result;
  while (result = locationResults.find(r => !seen[r.formatted_address])) {
    seen[result.formatted_address] = true;
    const title = await searchWikipedia(result.formatted_address);
    if (!title) {
      continue;
    }
    console.info('Title', title);
    return getContent(title);
  };
  return null
}

async function speak(text) {
  // Mobile Chrome doesn't like long texts, so we just do one.
  const paras = text.split(/\./).filter(p => p.trim());
  for (let p of paras) {
    await speakParagraph(p);
    if (cancelSpeaking) {
      cancelSpeaking = false;
      return;
    }
  }
}

function speakParagraph(text) {
	var utterance = new SpeechSynthesisUtterance();
  utterance.text = text + '.';
  utterance.lang = 'en';
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
  return speak(article.content);
}

async function start() {
  state.playing = true;
  state.loading = true;
  state.status = 'Finding your location.'
  render();
  const s = startWatchLocation();
  await speak('Welcome to your road trip.\n\n');
  await s;
  next();
}

async function next() {
  console.info('Starting session');
  state.playing = true;
  state.loading = true;
  state.status = 'Finding something interesting to read. I\'ll keep checking as you move.'
  render();
  try {
    const article = await getArticleForLocation();
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

function render() {
  $('html_start').style.display = display(!state.playing);
  $('html_pause').style.display = display(!state.loading && state.playing && !state.paused);
  $('html_play').style.display = display(!state.loading && state.playing && state.paused);
  $('html_next').style.display = display(!state.loading && state.playing);
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
  map = new google.maps.Map($('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 11
  });
  map.addListener('center_changed', e => {
    position = {
      coords: {
        longitude: map.getCenter().lng(),
        latitude: map.getCenter().lat(),
      }
    };
    console.info('Map position', position);
  });
}

onunload = function() {
  window.speechSynthesis.cancel();
}
navigator.serviceWorker.register("/sw.js");