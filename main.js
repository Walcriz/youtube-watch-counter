const procentToCount = 0.95;
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
    console.log("Waiting...");
    if (document.getElementsByTagName("video")) {
      createHooks();
      clearInterval(interval);
    }
  }, 50); // check every 50 ms
}

function createHooks() {
  const video = document.getElementsByTagName("video")[0];
  hook(video, "onplay", () => playing = true);
  hook(video, "onpause", () => playing = false);

  setup(video, window.location.href);

  console.log("Hooks created");
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

  stats = createStatElements();

  var lastTime = video.currentTime;
  loopInterval = setInterval(() => {
    if (url !== window.location.href) {
      setup(video, window.location.href);
    }

    if (!playing || video.duration < 1)
      return;
    if (window.getComputedStyle(ads).display !== "none")
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
      console.log(response)
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
  const func = video[name];
  video[name] = function() {
    callback();

    if (func)
      func();
  };
}

function createStatElements() {
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
  const divider = document.createElement("span");
  divider.innerHTML = " • ";
  const space = document.createElement("span");
  space.innerHTML = "  ";
  outer.appendChild(divider);
  outer.appendChild(timeElement);
  outer.appendChild(space);
  outer.appendChild(loopsElement);

  const interval = setInterval(() => {
    const element = document.querySelector("yt-formatted-string#info");
    if (element) {
      clearInterval(interval);

      // Wait 10ms async and then set element
      element.appendChild(outer);
    }
  }, 50);

  return {
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
