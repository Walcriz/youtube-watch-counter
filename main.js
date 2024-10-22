const procentToCount = 0.90;
const startPart = 0.10;

var watchtime = 0;
var totalWatchtime = 0;
var loops = 0;
var totalLoops = 0;

var playing = false;
var loaded = false;

function wait() {
  // Wait until video starts playing
  const interval = setInterval(() => {
    if (!window.location.href.startsWith("https://www.youtube.com/watch"))
      return;

    if (document.getElementsByTagName("video")) {
      createHooks();
      clearInterval(interval);
    }
  }, 100);
}

function createHooks() {
  const video = document.getElementsByTagName("video")[0];
  hook(video, "onplay", () => playing = true);
  hook(video, "onpause", () => playing = false);

  setup(video, window.location.href);
}

function setup(video, url) {
  if (loopInterval)
    clearInterval(loopInterval);

  const ads = document.getElementsByClassName("video-ads")[0];
  loaded = false;
  watchtime = 0;
  loops = 0;
  totalWatchtime = 0;
  totalLoops = 0;
  playing = !video.paused;

  load(url, "watchtime").then(value => { totalWatchtime = value; loaded = true; });
  load(url, "loops").then(value => totalLoops = value);
  loop(video, url, ads);
}

var stats = null;
var loopInterval = null;
function loop(video, url, ads) {

  if (stats) {
    // Remove stats
    stats.outer.remove();
    stats = null;
  }

  createStatElements();

  var lastTime = video.currentTime;
  loopInterval = setInterval(() => {
    if (url !== window.location.href) {
      wait();
    }

    if (!playing || video.duration < 1)
      return;
    if (ads && window.getComputedStyle(ads).display !== "none")
      return;

    watchtime++;

    if (lastTime >= procentToCount * video.duration) {
      if (video.currentTime < startPart * video.duration) {
        loops++;
        save(url, "loops", totalLoops + loops);
      }
    }

    lastTime = video.currentTime;

    if (loaded)
      save(url, "watchtime", totalWatchtime + watchtime);

    updateStats(stats);
  }, 1000);
}

function load(url, name) {
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage({ action: "load", url: url, name: name }, response => {
      if (browser.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  })
}

function save(url, name, data) {
  browser.runtime.sendMessage({ action: "save", url: url, name: name, data: data });
}

function hook(video, name, callback) {
  video[name] = function() {
    callback();
  };
}

const outerId = "sadhfkasdfhslkdfjsalhdkhasdf-youtube-watch-counter-stats";
var createInterval = null;
function createStatElements() {
  if (stats) {
    // Remove stats
    stats.outer.remove();
    stats = null;

    const element = document.getElementById(outerId);
    if (element) {
      element.remove();
      return;
    }
  }

  const timeElement = document.createElement("p");
  timeElement.textContent = formatTime(watchtime) + " watched";
  timeElement.classList.add("yt-formatted-string");
  timeElement.style = "display: inline-block; word-wrap: none; white-break: none; font-weight: 500;";

  const loopsElement = document.createElement("p");
  loopsElement.textContent = "";
  loopsElement.classList.add("yt-formatted-string");
  loopsElement.style = "display: inline-block; word-wrap: none; white-break: none; font-weight: 500;";

  const outer = document.createElement("div");
  outer.style = "display: inline-block; align-items: right;";
  outer.classList.add(outerId);
  const divider = document.createElement("span");
  divider.innerHTML = " • ";
  const space = document.createElement("span");
  space.innerHTML = "  ";
  outer.appendChild(divider);
  outer.appendChild(timeElement);
  outer.appendChild(space);
  outer.appendChild(loopsElement);

  if (createInterval)
    clearInterval(createInterval);

  createInterval = setInterval(() => {
    const element = document.querySelector("yt-formatted-string#info");
    if (element && element.children.length > 2) {
      element.appendChild(outer);
      clearInterval(createInterval);
    }
  }, 50);

  stats = {
    time: timeElement,
    loops: loopsElement,
    outer: outer
  };
}

function updateStats(stats) {
  stats.time.textContent = formatTime(watchtime) + " watched";
  if (loops == 0) {
    stats.loops.textContent = "";
  } else {
    if (loops == 1)
      stats.loops.textContent = loops + " loop";
      else
      stats.loops.textContent = loops + " loops";
  }
}

function formatTime(seconds) {
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);

  seconds = seconds % 60;
  minutes = minutes % 60;
  hours = hours % 24;

  // Create an array to hold the parts
  const parts = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0 || parts.length === 0) { // Ensure we always show seconds if no other units are present
    parts.push(`${seconds}s`);
  }

  return parts.join(' ');
}

wait();
