browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message);

  if (message.action == "top") {
    const max = message.max || 10;

    return new Promise((resolve, reject) => {
      browser.storage.local.get().then(keys => {
        var top = [];
        var used = {};

        function add(id, type, value) {
          if (used[id]) {
            top[used[id]][type] = value;
            return
          }

          top.push({ [type]: value, url: "https://www.youtube.com/watch?v=" + id, id: id });
          used[id] = top.length - 1;
        }

        for (const key in keys) {
          if (key == "version") continue;
          const splitKey = key.split("/");
          const type = splitKey[splitKey.length - 1];
          const id = splitKey[0];

          var value = keys[key];
          if (!value || typeof value != "number") value = 0;

          switch (type) {
            case "watchtime":
              add(id, "watchtime", value);
              break;
            case "loops":
              add(id, "loops", value);
              break;
          }
        }

        top.sort((a, b) => b.watchtime - a.watchtime);

        // only take first max elements
        top = top.slice(0, max);

        resolve(top);
      }, error => { console.log(error); });
    })
  }

  if (message.action == "stats") {
    return new Promise((resolve, reject) => {
      browser.storage.local.get().then(keys => {
        var totalWatchtime = 0;
        var totalLoops = 0;
        var totalVideos = 0;

        var mostWatchedWatchtime = 0;
        var mostWatched = "";
        for (const key in keys) {
          if (key == "version") continue;
          const splitKey = key.split("/");
          const type = splitKey[splitKey.length - 1];

          var value = keys[key];
          if (!value || typeof value != "number") value = 0;

          switch (type) {
            case "watchtime":
              totalWatchtime += value;
              if (value > mostWatchedWatchtime) {
                mostWatchedWatchtime = value;
                mostWatched = splitKey[0];
              }
              totalVideos = totalVideos + 1;
              break;
            case "loops":
              totalLoops += value;
              break;
          }
        }

        resolve({
          totalWatchtime: totalWatchtime,
          totalLoops: totalLoops,
          totalVideos: totalVideos,

          mostWatched: {
            watchtime: mostWatchedWatchtime,
            video: "https://www.youtube.com/watch?v=" + mostWatched,
          }
        });
      })
    });
  }

  if (message.action == "load") {
    return new Promise((resolve, reject) => {
      const id = new URL(message.url).searchParams.get("v");
      load(id + "/" + message.name).then(value => {
        var value = value[id + "/" + message.name];
        // make sure value is number
        if (!value || typeof value != "number") value = 0;
        resolve(value)
      }, error => reject(error));
    });
  }

  if (message.action == "save") {
    save(message.url, message.name, message.data);
    return Promise.resolve({ response: "Ok" });
  }
});

function load(id) {
  return browser.storage.local.get(id);
}

function save(url, name, data) {
  const v = new URL(url).searchParams.get("v");
  browser.storage.local.set({
    [v + "/" + name]: data
  });
}

console.log("Background script loaded");
