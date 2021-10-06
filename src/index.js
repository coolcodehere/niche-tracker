const cheerio = require("cheerio");
const { start } = require("repl");

async function getHTML() {
  const axios = require("axios");

  const config = {
    method: "get",
    url: "https://www.nichecoffee.co.uk/products/niche-zero",
    params: { variant: 0 },
    headers: {},
  };

  return axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
    });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const productIds = {
  "Pure White / US": 39263828410499,
  "Pure White / UK": 31208685174915,
  "Pure White / EU": 39319561339011,
  "Pure White / UK Export": 39387927806083,
  "Pure White / AUS": 39403845091459,
  "Midnight Black / US": 39263825494147,
  "Midnight Black / UK": 31208685076611,
  "Midnight Black / EU": 39319561240707,
  "Midnight Black / UK Export": 39387927740547,
  "Midnight Black / AUS": 39403845025923,
};

function parseInventory(html) {
  const quantities = {};
  const $ = cheerio.load(html);
  const inventoryValues = $(
    "#content > div > div:nth-child(2) > ul > li > script"
  )
    .html()
    .replaceAll("\n", "")
    .replaceAll(" ", "")
    .split(";");

  for (let i = 1; i < inventoryValues.length - 1; i++) {
    const startIdx = inventoryValues[i].indexOf("[") + 1;
    const endIdx = inventoryValues[i].indexOf("]");
    const productId = Number.parseInt(
      inventoryValues[i].slice(startIdx, endIdx)
    );
    const quantity = Number.parseInt(inventoryValues[i].split("=")[1]);
    quantities[productId] = quantity;
  }

  return quantities;
}

function parseHTML(html) {
  const data = [];
  const $ = cheerio.load(html);
  const numChildren = $("#productSelect").children().length;
  const itemQuantities = parseInventory(html);

  for (let i = 1; i <= numChildren; i++) {
    const currentModel = $(`#productSelect > option:nth-child(${i})`);

    const span = document.createElement("span");
    if (currentModel.attr("data-sku")) {
      const productName = currentModel.text().split(" - ")[0];
      const productId = productIds[productName];
      const a = document.createElement("a");
      a.href = `https://www.nichecoffee.co.uk/products/niche-zero?variant=${productId}}`;
      a.innerText = `${itemQuantities[productId]} Remaining`;
      span.innerHTML = `${productName} - ${a.outerHTML}`;
    } else {
      span.innerHTML = currentModel.text().replace("\n", "").trim();
    }
    data.push(span);
  }
  return data;
}

(async () => {
  while (true) {
    const html = await getHTML();
    const items = parseHTML(html);
    const div = document.createElement("div");
    const ul = document.createElement("ul");
    const p = document.createElement("p");
    p.innerHTML = `Last Updated ${new Date().toLocaleString()}`;

    items.forEach((item) => {
      const li = document.createElement("li");
      ul.appendChild(li);
      li.innerHTML = item.outerHTML;
    });

    div.appendChild(ul);
    div.appendChild(p);

    document.body.innerHTML = div.innerHTML;

    await sleep(60000);
  }
})();
