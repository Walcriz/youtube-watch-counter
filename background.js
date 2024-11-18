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
  const v = new URL(url).searchParams.get("v");
  return browser.storage.local.get(v + "/" + name);
}

function save(url, name, data) {
  const v = new URL(url).searchParams.get("v");
  browser.storage.local.set({
    [v + "/" + name]: data
  });
}

console.log("Background script loaded");
