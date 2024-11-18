const links = [
  "https://www.youtube.com/watch?v=B3kE_zxORik",
  "https://www.youtube.com/watch?v=Ci_zad39Uhw",
  "https://www.youtube.com/watch?v=NCLBok_C9Hg",
  "https://www.youtube.com/watch?v=xpKfRwX_8Ws",
  "https://www.youtube.com/watch?v=NFWiDdxqgfY",
  "https://www.youtube.com/watch?v=pfQQ7QURSro",
  "https://www.youtube.com/watch?v=qPdPjWkJZF8",
  "https://www.youtube.com/watch?v=-jGBp5HBLFs",
  "https://www.youtube.com/watch?v=7pmd0kt3FOs",
  "https://www.youtube.com/watch?v=OGj0xMWReQM",
  "https://www.youtube.com/watch?v=I3ZozsgDDqI",
  "https://www.youtube.com/watch?v=fzQ6gRAEoy0"
];

browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
  const currentTab = tabs[0]; // The first tab object is the active one
  const currentUrl = currentTab.url; // Get the URL of the active tab

  if (!currentUrl.startsWith("https://www.youtube.com/watch")) {
    document.getElementById("stats").style.display = "none";
    document.getElementById("error").style.display = "block";

    document.getElementById("link").href = links[Math.floor(Math.random() * links.length)];
  } else {
    document.getElementById("stats").style.display = "block";
    document.getElementById("error").style.display = "none";

    load(currentUrl, "watchtime").then(value => {
      document.getElementById("time").textContent = formatTime(value);
    })
    load(currentUrl, "loops").then(value => {
      const suffix = value == 1 ? " time" : " times";
      document.getElementById("loops").textContent = value + suffix;
    })
  }

  browser.runtime.sendMessage({ action: "stats" }).then(stats => {
    if (stats.mostWatched.watchtime === 0) {
      document.getElementById("most-watched").style.display = "none";
    }
    document.getElementById("total-videos").textContent = stats.totalVideos;
    document.getElementById("total-watchtime").textContent = formatTime(stats.totalWatchtime);
    document.getElementById("total-loops").textContent = stats.totalLoops;
    const mostWatched = document.getElementById("most-watched-video")
    mostWatched.textContent = stats.mostWatched.video;
    mostWatched.href = stats.mostWatched.video;
    document.getElementById("most-watched-watchtime").textContent = formatTime(stats.mostWatched.watchtime);
  })

  document.getElementById("most-watched-btn").addEventListener("click", switchToTopView);
});

function switchToTopView() {
  document.getElementById("home").style.display = "none";
  document.getElementById("top").style.display = "block";
  console.log("Switched to top view");

  browser.runtime.sendMessage({ action: "top" }).then(top => {
    for (const video of top) {
      // Create a list item
      const li = document.createElement("li");

      // Add the video link
      const link = document.createElement("a");
      link.href = video.url;
      link.textContent = video.id;
      link.target = "_blank"; // Open link in a new tab
      link.style.fontWeight = "bold"; // Optional styling
      li.appendChild(link);

      // Add the watch time
      const time = document.createElement("span");
      time.textContent = ` | ${formatTime(video.watchtime)} watched`;
      time.style.marginLeft = "10px"; // Optional styling
      li.appendChild(time);

      if (video.loops) {
        // Add the loop count
        const loops = document.createElement("span");
        loops.textContent = ` | ${video.loops} loops`;
        loops.style.marginLeft = "10px"; // Optional styling
        li.appendChild(loops);
      }

      // Append the list item to the top-videos list
      document.getElementById("top-videos").appendChild(li);
    }
  })
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
