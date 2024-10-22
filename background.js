browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message);

  if (message.action == "load") {
    return new Promise((resolve, reject) => {
      load(message.url, message.name).then(value => {
        var value = value[message.url + "/" + message.name];
        // make sure value is number
        if (!value || typeof value != "number") value = 0;
        console.log(value)
        resolve(value)
      }, error => reject(error));
    });
  }

  if (message.action == "save") {
    save(message.url, message.name, message.data);
    return Promise.resolve({ response: "Ok" });
  }
});

function load(url, name) {
  return browser.storage.sync.get(url + "/" + name);
}

function save(url, name, data) {
  console.log(url + "/" + name, data);
  browser.storage.sync.set({
    [url + "/" + name]: data
  });
}

console.log("Background script loaded");
